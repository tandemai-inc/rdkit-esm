import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('getRGD', () => {
  it('decomposes molecules with a single string core', () => {
    using rows = rdkit.getRGD('*1***[*:1]1', ['c1cocc1CCl', 'c1c[nH]cc1CI', 'c1cscc1CF'], {
      allowNonTerminalRGroups: true,
    });
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(3);
    expect(rows[0]).toHaveProperty('Core');
    expect(rows[0]).toHaveProperty('R1');
    expect(rows[0].R1.getSmiles()).toBe('ClC[*:1]');
    expect(rows[1].R1.getSmiles()).toBe('IC[*:1]');
    expect(rows[2].R1.getSmiles()).toBe('FC[*:1]');
  });

  it('decomposes with a Mol core', () => {
    using core = rdkit.getQMol('*1***[*:1]1')!;
    using rows = rdkit.getRGD(core, ['c1cocc1CCl', 'c1cscc1CF'], {
      allowNonTerminalRGroups: true,
    });
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(2);
    expect(rows[0]).toHaveProperty('Core');
    expect(rows[0]).toHaveProperty('R1');
  });

  it('decomposes with terminal R-groups (no options needed)', () => {
    using rows = rdkit.getRGD('c1ccc([*:1])cc1', ['c1ccc(Cl)cc1', 'c1ccc(F)cc1', 'c1ccc(Br)cc1']);
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(3);
    expect(rows[0]).toHaveProperty('Core');
    expect(rows[0]).toHaveProperty('R1');
  });

  it('decomposes with multiple string cores', () => {
    const molecules = [
      'C1CCNC(Cl)CC1',
      'C1CC(Cl)NCCC1',
      'C1CCNC(I)CC1',
      'C1CC(I)NCCC1',
      'C1CCSC(Cl)CC1',
      'C1CC(Cl)SCCC1',
      'C1CCSC(I)CC1',
      'C1CC(I)SCCC1',
      'C1CCOC(Cl)CC1',
      'C1CC(Cl)OCCC1',
      'C1CCOC(I)CC1',
      'C1CC(I)OCCC1',
    ];
    using rows = rdkit.getRGD(['C1CCNCCC1', 'C1CCOCCC1', 'C1CCSCCC1'], molecules);
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(12);
    for (const row of rows) {
      expect(row).toHaveProperty('Core');
      expect(row).toHaveProperty('R1');
    }
  });

  it('decomposes with Mol[] cores', () => {
    using core1 = rdkit.getMol('C1CCNCCC1')!;
    using core2 = rdkit.getMol('C1CCOCCC1')!;
    using rows = rdkit.getRGD([core1, core2], ['C1CCNC(Cl)CC1', 'C1CCOC(Cl)CC1']);
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(2);
  });

  it('decomposes with Mol[] molecules', () => {
    using mol1 = rdkit.getMol('c1ccc(Cl)cc1')!;
    using mol2 = rdkit.getMol('c1ccc(F)cc1')!;
    using rows = rdkit.getRGD('c1ccc([*:1])cc1', [mol1, mol2]);
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(2);
  });

  it('accepts options', () => {
    using rows = rdkit.getRGD('*1***[*:1]1', ['c1cocc1CCl', 'c1c[nH]cc1CI', 'c1cscc1CF'], {
      allowNonTerminalRGroups: true,
      scoreMethod: 'Match',
    });
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(3);
  });

  it('returns Mol instances that support getSmiles()', () => {
    using rows = rdkit.getRGD('c1ccc([*:1])cc1', ['c1ccc(Cl)cc1']);
    if (!rows) {
      throw new Error('getRGD returned null');
    }
    expect(rows.length).toBe(1);
    for (const mol of Object.values(rows[0])) {
      expect(mol.getSmiles()).toBeTypeOf('string');
    }
  });
});
