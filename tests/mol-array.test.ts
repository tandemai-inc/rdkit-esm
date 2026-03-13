import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, MolArray, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('MolArray', () => {
  it('is returned by getFrags', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    expect(frags.mols).toBeInstanceOf(MolArray);
    expect(frags.mols.length).toBe(2);
    frags.mols.delete();
  });

  it('supports indexing', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const { mols } = mol.getFrags();
    expect(mols[0].getSmiles()).toBeTypeOf('string');
    expect(mols[0].numAtoms).toBeGreaterThan(0);
    mols.delete();
  });

  it('returns undefined for out-of-bounds index', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const { mols } = mol.getFrags();
    expect(mols[99]).toBeUndefined();
    mols.delete();
  });

  it('is iterable', () => {
    using mol = rdkit.getMol('c1ccccc1.CC.O')!;
    const { mols } = mol.getFrags();
    const smiles: string[] = [];
    for (const frag of mols) {
      smiles.push(frag.getSmiles());
    }
    expect(smiles.length).toBe(3);
    mols.delete();
  });

  it('delete() frees all contained Mol instances', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const { mols } = mol.getFrags();
    const first = mols[0];
    mols.delete();
    expect(() => first.getSmiles()).toThrow();
  });

  it('supports using keyword', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    let ref: MolArray;
    {
      using mols = mol.getFrags().mols;
      ref = mols;
      expect(mols.length).toBe(2);
    }
    expect(() => ref[0].getSmiles()).toThrow();
  });
});
