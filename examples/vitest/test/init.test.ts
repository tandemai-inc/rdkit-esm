import { describe, it, expect } from 'vitest';
import { initRDKit } from 'rdkit-esm';

describe('rdkit-esm consumer test', () => {
  it('initializes RDKit from the published package', async () => {
    const rdkit = await initRDKit();
    expect(rdkit.version).toMatch(/^\d+\.\d+\.\d+/);

    using mol = rdkit.getMol('c1ccccc1');
    expect(mol?.numAtoms).toBe(6);
  });
});
