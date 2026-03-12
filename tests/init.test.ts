import { describe, it, expect } from 'vitest';
import { initRDKit } from '../src/index.ts';

describe('initRDKit', () => {
  it('initializes the module and returns a version string', async () => {
    const rdkit = await initRDKit();
    expect(rdkit.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('getMol returns a Mol for valid SMILES', async () => {
    const rdkit = await initRDKit();
    const mol = rdkit.getMol('c1ccccc1');
    expect(mol).not.toBeNull();
    expect(mol!.isValid()).toBe(true);
    mol!.delete();
  });

  it('getMol returns null for invalid SMILES', async () => {
    const rdkit = await initRDKit();
    const mol = rdkit.getMol('not_a_molecule');
    expect(mol).toBeNull();
  });

  it('getQMol returns a Mol for valid SMARTS', async () => {
    const rdkit = await initRDKit();
    const mol = rdkit.getQMol('[#6]');
    expect(mol).not.toBeNull();
    mol!.delete();
  });
});
