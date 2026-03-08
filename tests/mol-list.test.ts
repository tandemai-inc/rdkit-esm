import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('MolCollection', () => {
  it('is created from getFrags', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    expect(frags.mols.size()).toBe(2);
    frags.mols.delete();
  });

  it('at() returns Mol at index', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    using frag0 = frags.mols.at(0)!;
    expect(frag0.getSmiles()).toBeTypeOf('string');
    expect(frag0.getNumAtoms()).toBeGreaterThan(0);
    frags.mols.delete();
  });

  it('at() returns null for out-of-bounds index', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    const result = frags.mols.at(99);
    expect(result).toBeNull();
    frags.mols.delete();
  });

  it('is iterable', () => {
    using mol = rdkit.getMol('c1ccccc1.CC.O')!;
    const frags = mol.getFrags();
    const smiles: string[] = [];
    for (const frag of frags.mols) {
      smiles.push(frag.getSmiles());
      frag.delete();
    }
    expect(smiles.length).toBe(3);
    frags.mols.delete();
  });

  it('frags array maps atoms to fragment indices', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    expect(frags.frags).toBeInstanceOf(Array);
    expect(frags.frags.length).toBe(mol.getNumAtoms());
    expect(frags.fragsMolAtomMapping).toBeInstanceOf(Array);
    frags.mols.delete();
  });

  it('throws after delete', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    frags.mols.delete();
    expect(() => frags.mols.size()).toThrow('MolCollection has been deleted');
  });

  it('supports using keyword', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    {
      using mols = frags.mols;
      expect(mols.size()).toBe(2);
    }
    expect(() => frags.mols.size()).toThrow('MolCollection has been deleted');
  });
});
