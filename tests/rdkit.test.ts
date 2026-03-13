import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('getMol', () => {
  it('getMol returns a Mol for valid SMILES', () => {
    const mol = rdkit.getMol('c1ccccc1');
    expect(mol).not.toBeNull();
    expect(mol!.isValid()).toBe(true);
    mol!.delete();
  });

  it('getMol returns null for invalid SMILES', () => {
    const mol = rdkit.getMol('not_a_molecule');
    expect(mol).toBeNull();
  });

  it('getMol accepts a Uint8Array input', () => {
    const mol = rdkit.getMol('c1ccccc1')!;
    const pickled = mol.getAsUint8Array();
    mol.delete();
    const mol2 = rdkit.getMol(pickled)!;
    expect(mol2).not.toBeNull();
    expect(mol2.getSmiles()).toBe('c1ccccc1');
    mol2.delete();
  });
});

describe('getQMol', () => {
  it('getQMol returns a Mol for valid SMARTS', () => {
    const mol = rdkit.getQMol('[#6]');
    expect(mol).not.toBeNull();
    mol!.delete();
  });
});
