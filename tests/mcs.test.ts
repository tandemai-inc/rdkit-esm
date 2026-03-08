import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('getMolCollection', () => {
  it('creates empty MolCollection', () => {
    using coll = rdkit.getMolCollection();
    expect(coll.size()).toBe(0);
  });

  it('creates MolCollection from SMILES array', () => {
    using coll = rdkit.getMolCollection(['c1ccccc1', 'CC', 'O']);
    expect(coll.size()).toBe(3);
  });

  it('skips invalid SMILES', () => {
    using coll = rdkit.getMolCollection(['c1ccccc1', 'invalid!!!', 'CC']);
    expect(coll.size()).toBe(2);
  });
});

describe('getMCS', () => {
  it('finds MCS from string array', () => {
    const result = rdkit.getMCS(['c1ccccc1O', 'c1ccccc1N']);
    expect(result.numAtoms).toBeGreaterThan(0);
    expect(result.numBonds).toBeGreaterThan(0);
    expect(result.smarts).toBeTypeOf('string');
    expect(result.canceled).toBe(false);
  });

  it('finds MCS from MolCollection', () => {
    using coll = rdkit.getMolCollection(['c1ccccc1O', 'c1ccccc1N']);
    const result = rdkit.getMCS(coll);
    expect(result.numAtoms).toBeGreaterThan(0);
    expect(result.smarts).toBeTypeOf('string');
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
