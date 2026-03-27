import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('getMCS', () => {
  it('finds MCS from string array', () => {
    using result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N']);
    expect(result.numAtoms).toBeGreaterThan(0);
    expect(result.numBonds).toBeGreaterThan(0);
    expect(result.smarts).toBeTypeOf('string');
    expect(result.canceled).toBe(false);
  });

  it('finds MCS from Mol array', () => {
    using mol1 = rdkit.getMol('c1ccccc1O')!;
    using mol2 = rdkit.getMol('c1ccccc1N')!;
    using result = rdkit.getMCS([mol1, mol2]);
    expect(result.numAtoms).toBeGreaterThan(0);
    expect(result.smarts).toBeTypeOf('string');
  });

  it('accepts options', () => {
    using result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N'], {
      BondCompare: 'Any',
    });
    expect(result.numAtoms).toBeGreaterThan(0);
  });

  it('qmol returns a lazy query molecule', () => {
    using result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N']);
    using qmol = result.qmol!;
    expect(qmol).not.toBeNull();
    expect(qmol.getSmarts()).toBeTypeOf('string');
  });

  it('qmol is cached across accesses', () => {
    using result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N']);
    using qmol1 = result.qmol;
    using qmol2 = result.qmol;
    expect(qmol1).toBe(qmol2);
  });

  it('returns result for molecules with minimal common substructure', () => {
    using result = rdkit.getMCS(['C', 'c1ccccc1']);
    expect(result).toHaveProperty('numAtoms');
    expect(result).toHaveProperty('numBonds');
    expect(result).toHaveProperty('smarts');
  });
});
