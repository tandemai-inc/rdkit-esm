import { describe, it, expect, beforeAll } from 'vitest';
import {
  initRDKit,
  isRDKitOperationError,
  RDKitOperationError,
  type Mol,
  type RDKit,
  type RDKitParseErrorEvent,
} from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

const ASPIRIN = 'CC(=O)Oc1ccccc1C(=O)O';

/** Returns a molecule with explicit hydrogens and a single ETKDGv3 conformer. */
const embed = (smiles: string, randomSeed = 42): Mol => {
  const mol = rdkit.getMol(smiles)!;
  mol.addHsInPlace();
  mol.generateConformers({ count: 1, randomSeed, throwOnError: true });
  return mol;
};

describe('Mol.generateConformers', () => {
  it('embeds the requested number of 3D conformers', () => {
    using mol = rdkit.getMol('CCCCO')!;
    mol.addHsInPlace();
    const result = mol.generateConformers({ count: 5, randomSeed: 7, throwOnError: true });
    expect(result.conformers).toHaveLength(5);
    for (const conformer of result.conformers) {
      expect(conformer).toHaveLength(mol.numAtoms);
      expect(conformer[0]).toHaveLength(3);
    }
    expect(result.minimizedCount).toBe(0);
    expect(result.forcefield).toBeNull();
    expect(mol.hasCoords()).toBe(3);
    expect(mol.getJSON().molecules[0].conformers).toHaveLength(5);
  });

  it('keeps the first conformer as the molecule coordinates', () => {
    using mol = rdkit.getMol('CCCCO')!;
    mol.addHsInPlace();
    const result = mol.generateConformers({ count: 3, randomSeed: 7, throwOnError: true });
    expect(mol.getCoords()).toEqual(result.conformers[0]);
  });

  it('is deterministic for a given random seed', () => {
    using mol = rdkit.getMol(ASPIRIN)!;
    mol.addHsInPlace();
    const first = mol.generateConformers({ count: 3, randomSeed: 42, throwOnError: true });
    const second = mol.generateConformers({ count: 3, randomSeed: 42, throwOnError: true });
    expect(second.conformers).toEqual(first.conformers);
  });

  it('prunes near-duplicate conformers with pruneRmsThreshold', () => {
    using mol = rdkit.getMol('CCCCO')!;
    mol.addHsInPlace();
    const result = mol.generateConformers({
      count: 10,
      randomSeed: 7,
      pruneRmsThreshold: 0.5,
      throwOnError: true,
    });
    expect(result.conformers.length).toBeGreaterThanOrEqual(1);
    expect(result.conformers.length).toBeLessThan(10);
  });

  it('minimizes each conformer with minimizeIterations', () => {
    using mol = rdkit.getMol(ASPIRIN)!;
    mol.addHsInPlace();
    const result = mol.generateConformers({
      count: 3,
      randomSeed: 42,
      minimizeIterations: 200,
      throwOnError: true,
    });
    expect(result.minimizedCount).toBe(result.conformers.length);
    expect(result.forcefield).toBe('MMFF94');
  });

  it('removes all conformers when count is 0', () => {
    using mol = embed('CCO');
    const result = mol.generateConformers({ count: 0, throwOnError: true });
    expect(result.conformers).toEqual([]);
    expect(mol.hasCoords()).toBe(0);
  });

  it('returns null for a negative count', () => {
    using mol = rdkit.getMol('CCO')!;
    expect(mol.generateConformers({ count: -1 })).toBeNull();
    expect(() => mol.generateConformers({ count: -1, throwOnError: true })).toThrow(
      RDKitOperationError,
    );
  });
});

describe('Mol.getForceFieldEnergy', () => {
  it('uses MMFF94 when parameters are available', () => {
    using mol = embed(ASPIRIN);
    const result = mol.getForceFieldEnergy({ throwOnError: true });
    expect(result.forcefield).toBe('MMFF94');
    expect(result.fallback).toBe(false);
    expect(Number.isFinite(result.energy)).toBe(true);
  });

  it('falls back to UFF when MMFF94 has no parameters', () => {
    using mol = embed('C[Se]C');
    const result = mol.getForceFieldEnergy({ throwOnError: true });
    expect(result.forcefield).toBe('UFF');
    expect(result.fallback).toBe(true);
  });

  it('returns null when the molecule has no conformer', () => {
    using mol = rdkit.getMol('CCO')!;
    expect(mol.getForceFieldEnergy()).toBeNull();
  });

  it('throws RDKitOperationError with throwOnError: true', () => {
    using mol = rdkit.getMol('CCO')!;
    try {
      mol.getForceFieldEnergy({ throwOnError: true });
      expect.unreachable();
    } catch (e) {
      expect(isRDKitOperationError(e)).toBe(true);
      if (isRDKitOperationError(e)) {
        expect(e.operation).toBe('getForceFieldEnergy');
        expect(e.input).toBe('CCO');
        expect(e.rdkitMessage).toContain('No conformations available on the molecule');
      }
    }
  });
});

describe('Mol.minimize', () => {
  it('lowers the energy and updates the coordinates in place', () => {
    using mol = embed(ASPIRIN);
    const before = mol.getCoords();
    const result = mol.minimize({ maxIterations: 2000, throwOnError: true });
    expect(result.converged).toBe(true);
    expect(result.finalEnergy).toBeLessThan(result.initialEnergy);
    expect(mol.getCoords()).not.toEqual(before);
    expect(mol.getForceFieldEnergy({ throwOnError: true }).energy).toBeCloseTo(
      result.finalEnergy,
      6,
    );
  });

  it('returns frames from the starting to the final geometry', () => {
    using mol = embed(ASPIRIN);
    const before = mol.getCoords();
    const result = mol.minimize({ maxIterations: 2000, throwOnError: true });
    const first = result.frames[0];
    const last = result.frames[result.frames.length - 1];
    expect(first.energy).toBe(result.initialEnergy);
    expect(first.coords).toEqual(before);
    expect(last.energy).toBe(result.finalEnergy);
    expect(last.coords).toEqual(mol.getCoords());
  });

  it('records intermediate frames with snapshotFrequency', () => {
    using mol = embed(ASPIRIN);
    const withoutSnapshots = mol.copy();
    const result = mol.minimize({ maxIterations: 2000, snapshotFrequency: 5, throwOnError: true });
    const plain = withoutSnapshots.minimize({ maxIterations: 2000, throwOnError: true });
    withoutSnapshots.delete();
    expect(plain.frames).toHaveLength(2);
    expect(result.frames.length).toBeGreaterThan(2);
    for (let i = 1; i < result.frames.length; i++) {
      expect(result.frames[i].energy).toBeLessThanOrEqual(result.frames[i - 1].energy + 1e-6);
    }
  });

  it('reports converged: false when maxIterations is reached', () => {
    using mol = embed(ASPIRIN);
    expect(mol.minimize({ maxIterations: 2, throwOnError: true }).converged).toBe(false);
  });

  it('keeps fixedAtoms at their exact coordinates', () => {
    using mol = embed(ASPIRIN);
    const before = mol.getCoords();
    mol.minimize({ maxIterations: 2000, fixedAtoms: [0, 1, 2], throwOnError: true });
    const after = mol.getCoords();
    expect(after.slice(0, 3)).toEqual(before.slice(0, 3));
    expect(after.slice(3)).not.toEqual(before.slice(3));
  });

  it('accepts 2D coordinates', () => {
    using mol = rdkit.getMol('CCO')!;
    mol.addHsInPlace();
    mol.setNewCoords();
    const result = mol.minimize({ maxIterations: 2000, throwOnError: true });
    expect(result.finalEnergy).toBeLessThan(result.initialEnergy);
  });

  it('returns null for out-of-range fixedAtoms', () => {
    using mol = embed('CCO');
    expect(mol.minimize({ fixedAtoms: [99] })).toBeNull();
  });

  it('returns null when every atom is fixed', () => {
    using mol = embed('CCO');
    const all = mol.getCoords().map((_, i) => i);
    expect(mol.minimize({ fixedAtoms: all })).toBeNull();
  });

  it('returns null for a negative maxIterations', () => {
    using mol = embed('CCO');
    expect(mol.minimize({ maxIterations: -1 })).toBeNull();
  });
});

describe('force-field error reporting', () => {
  it('notifies the error listener with the operation and RDKit message', () => {
    const events: RDKitParseErrorEvent[] = [];
    const remove = rdkit.events.addErrorListener((event) => events.push(event));
    try {
      using mol = rdkit.getMol('CCO')!;
      expect(mol.minimize()).toBeNull();
    } finally {
      remove();
    }
    expect(events).toHaveLength(1);
    expect(events[0].operation).toBe('minimize');
    expect(events[0].input).toBe('CCO');
    expect(events[0].message).toContain('run_forcefield');
  });

  it('raw run_forcefield returns an empty string for an unknown job', () => {
    using mol = embed('CCO');
    expect(mol.jsMol.run_forcefield(JSON.stringify({ job: 'dynamics' }))).toBe('');
  });

  it('raw generate_conformers returns an empty string for invalid JSON', () => {
    using mol = rdkit.getMol('CCO')!;
    expect(mol.jsMol.generate_conformers('{not json')).toBe('');
  });
});
