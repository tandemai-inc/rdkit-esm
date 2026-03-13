import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('getMCS', () => {
  it('finds MCS from string array', () => {
    const result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N']);
    expect(result.numAtoms).toBeGreaterThan(0);
    expect(result.numBonds).toBeGreaterThan(0);
    expect(result.smarts).toBeTypeOf('string');
    expect(result.canceled).toBe(false);
  });

  it('finds MCS from Mol array', () => {
    const mol1 = rdkit.getMol('c1ccccc1O')!;
    const mol2 = rdkit.getMol('c1ccccc1N')!;
    const result = rdkit.getMCS([mol1, mol2]);
    expect(result.numAtoms).toBeGreaterThan(0);
    expect(result.smarts).toBeTypeOf('string');
    mol1.delete();
    mol2.delete();
  });

  it('accepts options', () => {
    const result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N'], {
      BondCompare: 'Any',
    });
    expect(result.numAtoms).toBeGreaterThan(0);
  });

  it('qmol returns a lazy query molecule', () => {
    const result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N']);
    using qmol = result.qmol!;
    expect(qmol).not.toBeNull();
    expect(qmol.getSmarts()).toBeTypeOf('string');
  });

  it('qmol is cached across accesses', () => {
    const result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N']);
    const qmol1 = result.qmol;
    const qmol2 = result.qmol;
    expect(qmol1).toBe(qmol2);
    qmol1?.delete();
  });

  it('returns result for molecules with minimal common substructure', () => {
    const result = rdkit.getMCS(['C', 'c1ccccc1']);
    expect(result).toHaveProperty('numAtoms');
    expect(result).toHaveProperty('numBonds');
    expect(result).toHaveProperty('smarts');
  });
});
