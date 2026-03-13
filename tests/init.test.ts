import { describe, it, expect } from 'vitest';
import { initRDKit } from '../src/index.ts';

describe('initRDKit', () => {
  it('initializes the module and returns a version string', async () => {
    const rdkit = await initRDKit();
    expect(rdkit.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
