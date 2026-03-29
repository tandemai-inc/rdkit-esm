/**
 * Tests ported from the original RDKit MinimalLib test suite (tests.js).
 * These cover core chemistry data functionality: SMILES, InChI, molblock, JSON,
 * descriptors, SVG, substructure, properties, fragments, and parsing options.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

// ─────────────────────────────────────────────────────────────────────────────
// test_basics (non-fingerprint part)
// ─────────────────────────────────────────────────────────────────────────────

describe('test_basics', () => {
  it('returns null for invalid SMILES (c1ccccc)', () => {
    const mol = rdkit.getMol('c1ccccc');
    expect(mol).toBeNull();
  });

  it('gets canonical SMILES from phenol', () => {
    using mol = rdkit.getMol('c1ccccc1O')!;
    expect(mol).not.toBeNull();
    expect(mol.getSmiles()).toBe('Oc1ccccc1');
  });

  it('gets InChI and InChIKey for phenol', () => {
    using mol = rdkit.getMol('c1ccccc1O')!;
    expect(mol.getInchi()).toBe('InChI=1S/C6H6O/c7-6-4-2-1-3-5-6/h1-5,7H');
    expect(mol.getInchi(['FixedH'])).toBe('InChI=1/C6H6O/c7-6-4-2-1-3-5-6/h1-5,7H');
    expect(mol.getInchikey()).toBe('ISWSIDIOOBJBQZ-UHFFFAOYSA-N');
  });

  it('round-trips phenol through molblock', () => {
    using mol = rdkit.getMol('c1ccccc1O')!;
    const mb = mol.getMolblock();
    expect(mb).toContain('M  END');
    using mol2 = rdkit.getMol(mb)!;
    expect(mol2).not.toBeNull();
    expect(mol2.getSmiles()).toBe('Oc1ccccc1');
  });

  it('round-trips phenol through JSON', () => {
    using mol = rdkit.getMol('c1ccccc1O')!;
    const mjson = mol.getJSON();
    expect(JSON.stringify(mjson)).toContain('rdkitjson');
    using mol3 = rdkit.getMol(JSON.stringify(mjson))!;
    expect(mol3).not.toBeNull();
    expect(mol3.getSmiles()).toBe('Oc1ccccc1');
  });

  it('gets descriptors for phenol', () => {
    using mol = rdkit.getMol('c1ccccc1O')!;
    const descrs = mol.getDescriptors()!;
    expect(descrs.NumAromaticRings).toBe(1);
    expect(descrs.NumRings).toBe(1);
    expect(descrs.amw).toBeCloseTo(94.113, 3);
  });

  it('gets SVG for phenol', () => {
    using mol = rdkit.getMol('c1ccccc1O')!;
    const svg = mol.getSVG();
    expect(svg).toContain('svg');
  });

  it('gets substruct match and highlighted SVG for phenol', () => {
    using mol = rdkit.getMol('c1ccccc1O')!;
    using qmol = rdkit.getQMol('Oc(c)c')!;
    expect(qmol).not.toBeNull();
    const match = mol.getSubstructMatch(qmol);
    expect(match.atoms.length).toBe(4);
    expect(match.atoms[0]).toBe(6);
    const svg1 = mol.getSVG();
    const svg2 = mol.getSVG({ ...match });
    expect(svg2).toContain('svg');
    expect(svg1).not.toContain('#FF7F7F');
    expect(svg2).toContain('#FF7F7F');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_molblock_nostrict
// ─────────────────────────────────────────────────────────────────────────────

const MOLBLOCK_NOSTRICT = `
  MJ201100

 10 10  0  0  0  0  0  0  0  0999 V2000
   -1.2946    0.5348    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.0090    0.1223    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.0090   -0.7027    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2946   -1.1152    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5801   -0.7027    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5801    0.1223    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.5467    1.2493    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
    0.1342    0.5348    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.5467   -0.1796    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6907    0.5348    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  6  8  1  0  0  0  0
  7  8  1  0  0  0  0
  8  9  1  0  0  0  0
  8 10  1  0  0  0  0
M  STY  1   1 SUP
M  SAL   1  4   7   8   9  10
M  SMT   1 CF3
M  SBL   1  1   7
M  SAP   1  1   8
M  END`;

describe('test_molblock_nostrict', () => {
  it('reads molblock with SAP group and writes back with attachment point', () => {
    using mol = rdkit.getMol(MOLBLOCK_NOSTRICT)!;
    expect(mol).not.toBeNull();
    const mb = mol.getMolblock();
    expect(mb).toContain('M  SAP   1  1   8   6');
  });

  it('reads qmol from molblock with SAP group and writes back with attachment point', () => {
    using qmol = rdkit.getQMol(MOLBLOCK_NOSTRICT)!;
    expect(qmol).not.toBeNull();
    const qmb = qmol.getMolblock();
    expect(qmb).toContain('M  SAP   1  1   8   6');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_molblock_rgp
// ─────────────────────────────────────────────────────────────────────────────

const MOLBLOCK_RGP = `
  MJ190400

  9  9  0  0  0  0  0  0  0  0999 V2000
   -6.5623    0.3105    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
   -5.8478   -0.1019    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.1333    0.3105    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -4.4188   -0.1019    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -4.4188   -0.9269    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.1333   -1.3394    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.8478   -0.9269    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.7043   -1.3394    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9898   -0.9268    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  3  4  4  0  0  0  0
  4  5  4  0  0  0  0
  5  6  4  0  0  0  0
  6  7  4  0  0  0  0
  2  3  4  0  0  0  0
  2  7  4  0  0  0  0
  5  8  1  0  0  0  0
  8  9  1  0  0  0  0
  1  2  1  0  0  0  0
M  RGP  2   1   2   9   1
M  END`;

describe('test_molblock_rgp', () => {
  it('reads molblock with R-group (RGP) entries', () => {
    using mol = rdkit.getMol(MOLBLOCK_RGP)!;
    expect(mol).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_aromatic_kekule_form
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_aromatic_kekule_form', () => {
  const aromRegExp = /  \d  \d  4  \d\n/g;
  const kekRegExp = /  \d  \d  [12]  \d\n/g;

  it('benzene molblock is Kekule by default', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getMolblock();
    expect(molblock.match(aromRegExp)).toBeNull();
    expect(molblock.match(kekRegExp)!.length).toBe(6);
  });

  it('getKekuleForm returns Kekule molblock', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getKekuleForm();
    expect(molblock.match(aromRegExp)).toBeNull();
    expect(molblock.match(kekRegExp)!.length).toBe(6);
  });

  it('getAromaticForm returns aromatic molblock', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getAromaticForm();
    expect(molblock.match(aromRegExp)!.length).toBe(6);
    expect(molblock.match(kekRegExp)).toBeNull();
  });

  const BENZENE_AROMATIC_MOLBLOCK = `
  MJ201100

  6  6  0  0  0  0  0  0  0  0999 V2000
   -0.6473    0.8696    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.3617    0.4571    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.3617   -0.3679    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6473   -0.7804    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0671   -0.3679    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0671    0.4571    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  4  0  0  0  0
  2  3  4  0  0  0  0
  3  4  4  0  0  0  0
  4  5  4  0  0  0  0
  5  6  4  0  0  0  0
  6  1  4  0  0  0  0
M  END
`;

  it('qmol from aromatic molblock: getAromaticForm returns aromatic', () => {
    using mol = rdkit.getQMol(BENZENE_AROMATIC_MOLBLOCK)!;
    const molblock = mol.getAromaticForm();
    expect(molblock.match(aromRegExp)!.length).toBe(6);
    expect(molblock.match(kekRegExp)).toBeNull();
  });

  it('qmol from aromatic molblock: getKekuleForm returns Kekule', () => {
    using mol = rdkit.getQMol(BENZENE_AROMATIC_MOLBLOCK)!;
    const molblock = mol.getKekuleForm();
    expect(molblock.match(aromRegExp)).toBeNull();
    expect(molblock.match(kekRegExp)!.length).toBe(6);
  });

  const BENZENE_KEKULE_MOLBLOCK = `
  MJ201100

  6  6  0  0  0  0  0  0  0  0999 V2000
   -0.6473    0.8696    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.3617    0.4571    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.3617   -0.3679    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6473   -0.7804    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0671   -0.3679    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0671    0.4571    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
M  END
`;

  it('qmol from Kekule molblock: getMolblock with kekulize:false is Kekule', () => {
    using mol = rdkit.getQMol(BENZENE_KEKULE_MOLBLOCK)!;
    const molblock = mol.getMolblock({ kekulize: false });
    expect(molblock.match(aromRegExp)).toBeNull();
    expect(molblock.match(kekRegExp)!.length).toBe(6);
  });

  it('qmol: convertToAromaticForm then getMolblock with kekulize:false is aromatic', () => {
    using mol = rdkit.getQMol(BENZENE_KEKULE_MOLBLOCK)!;
    mol.convertToAromaticForm();
    const molblock = mol.getMolblock({ kekulize: false });
    expect(molblock.match(aromRegExp)!.length).toBe(6);
    expect(molblock.match(kekRegExp)).toBeNull();
  });

  it('qmol: convertToAromaticForm then convertToKekuleForm then getMolblock with kekulize:false is Kekule', () => {
    using mol = rdkit.getQMol(BENZENE_KEKULE_MOLBLOCK)!;
    mol.convertToAromaticForm();
    mol.convertToKekuleForm();
    const molblock = mol.getMolblock({ kekulize: false });
    expect(molblock.match(aromRegExp)).toBeNull();
    expect(molblock.match(kekRegExp)!.length).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_mol_no_kekulize
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_mol_no_kekulize', () => {
  it('returns null for non-kekulizable SMILES "c" without options', () => {
    const mol = rdkit.getMol('c');
    expect(mol).toBeNull();
  });

  it('returns non-null for "c" with kekulize:false', () => {
    using mol = rdkit.getMol('c', { kekulize: false })!;
    expect(mol).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_smarts
// ─────────────────────────────────────────────────────────────────────────────

const MOLBLOCK_RGROUP_SMARTS = `
  MJ201100

  8  8  0  0  0  0  0  0  0  0999 V2000
   -1.0491    1.5839    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7635    1.1714    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7635    0.3463    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.0491   -0.0661    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3346    0.3463    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3346    1.1714    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.3798    1.5839    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
    0.3798   -0.0661    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  6  7  1  0  0  2  0
  5  8  1  0  0  2  0
M  RGP  2   7   1   8   2
M  END
`;

describe('test_get_smarts', () => {
  it('gets SMARTS from molblock with R groups', () => {
    using mol = rdkit.getMol(MOLBLOCK_RGROUP_SMARTS)!;
    expect(mol).not.toBeNull();
    expect(mol.getSmarts()).toBe('[#6]1:[#6]:[#6]:[#6]:[#6](:[#6]:1-&!@*)-&!@*');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_cxsmarts
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_cxsmarts', () => {
  it('gets CX SMARTS from molblock with R groups (with coordinates and atom props)', () => {
    using mol = rdkit.getMol(MOLBLOCK_RGROUP_SMARTS)!;
    expect(mol).not.toBeNull();
    const cxsmarts = mol.getCxSmarts();
    expect(cxsmarts).toBe(
      '[#6]1:[#6]:[#6]:[#6]:[#6](:[#6]:1-&!@*)-&!@* |' +
        '(-1.0491,1.5839,;-1.7635,1.1714,;-1.7635,0.3463,;-1.0491,-0.0661,;' +
        '-0.3346,0.3463,;-0.3346,1.1714,;0.3798,1.5839,;0.3798,-0.0661,),' +
        'atomProp:6.dummyLabel.R1:7.dummyLabel.R2|',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_kekulize
// ─────────────────────────────────────────────────────────────────────────────

describe('test_kekulize', () => {
  it('returns null for bad aromatic SMILES "c1cccc1" without options', () => {
    const mol = rdkit.getMol('c1cccc1');
    expect(mol).toBeNull();
  });

  it('returns non-null for "c1cccc1" with kekulize:false', () => {
    using mol = rdkit.getMol('c1cccc1', { kekulize: false })!;
    expect(mol).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_sanitize
// ─────────────────────────────────────────────────────────────────────────────

describe('test_sanitize', () => {
  const badValence = 'N(C)(C)(C)C';

  it('returns null for bad valence SMILES', () => {
    expect(rdkit.getMol(badValence)).toBeNull();
  });

  it('returns null for bad valence SMILES even with kekulize:false', () => {
    expect(rdkit.getMol(badValence, { kekulize: false })).toBeNull();
  });

  it('returns non-null for bad valence SMILES with sanitize:false', () => {
    using mol = rdkit.getMol(badValence, { sanitize: false })!;
    expect(mol).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_removehs
// ─────────────────────────────────────────────────────────────────────────────

describe('test_removehs', () => {
  it('returns non-null for bad valence SMILES with sanitize:false and removeHs:false', () => {
    using mol = rdkit.getMol('N1C=CC(=O)c2ccc(N(C)(C)(C)(C)C)cc12', {
      sanitize: false,
      removeHs: false,
    })!;
    expect(mol).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_prop
// ─────────────────────────────────────────────────────────────────────────────

const ETHANE_MOLBLOCK = `
  MJ201900

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.1899    1.9526    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5245    1.5401    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  1  1  0  0  0  0
M  END
`;

describe('test_prop', () => {
  it('hasProp returns false for unset property', () => {
    using mol = rdkit.getMol(ETHANE_MOLBLOCK)!;
    expect(mol.hasProp('test1')).toBe(false);
  });

  it('setProp/getProp/hasProp round-trip', () => {
    using mol = rdkit.getMol(ETHANE_MOLBLOCK)!;
    expect(mol.setProp('test1', 'val')).toBe(true);
    expect(mol.hasProp('test1')).toBe(true);
    expect(mol.getProp('test1')).toBe('val');
  });

  it('getPropMap returns all set properties', () => {
    using mol = rdkit.getMol(ETHANE_MOLBLOCK)!;
    mol.setProp('test1', 'val');
    mol.setProp('test2', 'val');
    const props = mol.getPropMap({ includePrivate: false, includeComputed: false });
    expect(props.get('test1')).toBe('val');
    expect(props.get('test2')).toBe('val');
  });

  it('clearProp returns false for non-existent property', () => {
    using mol = rdkit.getMol(ETHANE_MOLBLOCK)!;
    expect(mol.clearProp('test3')).toBe(false);
  });

  it('clearProp removes an existing property', () => {
    using mol = rdkit.getMol(ETHANE_MOLBLOCK)!;
    mol.setProp('test2', 'val');
    expect(mol.hasProp('test2')).toBe(true);
    expect(mol.clearProp('test2')).toBe(true);
    expect(mol.hasProp('test2')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_frags
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_frags', () => {
  it('splits disconnected SMILES into fragments with correct mappings', () => {
    using mol = rdkit.getMol('n1ccccc1.CC(C)C.OCCCN')!;
    const expectedFragSmiles = ['c1ccncc1', 'CC(C)C', 'NCCCO'];
    const { mols, mappings } = mol.getFrags();
    expect(mols.length).toBe(3);
    expect(mappings.atomToFrag).toEqual([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2]);
    expect(mappings.fragToAtoms).toEqual([
      [0, 1, 2, 3, 4, 5],
      [6, 7, 8, 9],
      [10, 11, 12, 13, 14],
    ]);
    expect(mols.map((m) => m.getSmiles())).toEqual(expectedFragSmiles);
    mols.delete();
  });

  it('getFrags without sanitizeFrags throws for unsanitized mol', () => {
    using mol = rdkit.getMol('N(C)(C)(C)C.c1ccc1', { sanitize: false })!;
    expect(() => mol.getFrags()).toThrow();
  });

  it('getFrags with sanitizeFrags:false returns fragments for unsanitized mol', () => {
    using mol = rdkit.getMol('N(C)(C)(C)C.c1ccc1', { sanitize: false })!;
    const { mols } = mol.getFrags({ sanitizeFrags: false });
    expect(mols.length).toBe(2);
    const expectedSmiles = ['CN(C)(C)C', 'c1ccc1'];
    expect(mols.map((m) => m.getSmiles())).toEqual(expectedSmiles);
    mols.delete();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_molzip
// ─────────────────────────────────────────────────────────────────────────────

describe('test_molzip', () => {
  it('zips two molecules via mapped dummy atoms (basic)', () => {
    using mol1 = rdkit.getMol('F/C=C/[*:1]')!;
    using mol2 = rdkit.getMol('[*:1]F')!;
    using mol = rdkit.molzip(mol1, mol2)!;
    expect(mol).not.toBeNull();
    expect(mol.getSmiles()).toBe('F/C=C/F');
  });

  // rdkit.molzip() does not yet accept options — this test is expected to fail
  // until the wrapper exposes the third `details` argument from the raw WASM API
  it('zips two molecules with custom atom symbols (stereo preservation)', () => {
    using mol1 = rdkit.getMol('[C@H]([Xe])(F)([V])')!;
    using mol2 = rdkit.getMol('[Xe]N.[V]I')!;
    using mol = rdkit.molzip(mol1, mol2, { Label: 'AtomType', AtomSymbols: ['Xe', 'V'] })!;
    expect(mol).not.toBeNull();
    expect(mol.getSmiles()).toBe('N[C@@H](F)I');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_hs_in_place
// ─────────────────────────────────────────────────────────────────────────────

describe('test_hs_in_place', () => {
  it('addHsInPlace adds explicit H without coordinates', () => {
    using mol = rdkit.getMol('CC')!;
    expect(mol.hasCoords()).toBe(0);
    const descNoH = mol.getDescriptors()!;
    expect(descNoH.chi0v).toBe(2);
    expect(descNoH.chi1v).toBe(1);
    mol.addHsInPlace();
    expect(mol.hasCoords()).toBe(0);
    expect(mol.getSmiles()).toBe('[H]C([H])([H])C([H])([H])[H]');
    const descH = mol.getDescriptors()!;
    expect(descH.chi0v).toBe(1);
    expect(descH.chi1v).toBe(0.25);
  });

  it('removeHsInPlace (no options) and removeHsInPlace({}) both strip Hs', () => {
    using mol = rdkit.getMol('C([H])([H])([H])C([H])([H])[H]', { removeHs: false })!;
    expect(mol.getSmiles()).toBe('[H]C([H])([H])C([H])([H])[H]');
    expect(mol.hasCoords()).toBe(0);

    // '' equivalent → no options
    using molCopy1 = mol.copy();
    molCopy1.removeHsInPlace();
    expect(molCopy1.hasCoords()).toBe(0);
    expect(molCopy1.getSmiles()).toBe('CC');
    const descNoH1 = molCopy1.getDescriptors()!;
    expect(descNoH1.chi0v).toBe(2);
    expect(descNoH1.chi1v).toBe(1);
    molCopy1.delete();

    // '{}' equivalent → empty options object
    using molCopy2 = mol.copy();
    molCopy2.removeHsInPlace({});
    expect(molCopy2.hasCoords()).toBe(0);
    expect(molCopy2.getSmiles()).toBe('CC');
  });

  it('addHsInPlace preserves and extends 2D coordinates from molblock', () => {
    using mol = rdkit.getMol(`
  MJ201100

  2  1  0  0  0  0  0  0  0  0999 V2000
  -13.9955    5.1116    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  -13.2810    5.5241    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END
`)!;
    expect(mol.hasCoords()).toBe(2);
    mol.addHsInPlace();
    expect(mol.hasCoords()).toBe(2);
    expect(mol.getSmiles()).toBe('[H]C([H])([H])C([H])([H])[H]');
    const mb = mol.getMolblock();
    expect(mb).toContain('  8  7');
    expect(mb).toContain('  1  2  1  0');
  });

  it('removeHsInPlace preserves 2D coordinates from molblock', () => {
    using mol = rdkit.getMol(
      `
  MJ201100

  8  7  0  0  0  0  0  0  0  0999 V2000
  -13.9955    5.1116    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  -13.2810    5.5241    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  -14.4080    5.8260    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  -14.7100    4.6991    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  -13.5830    4.3971    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  -12.8685    4.8096    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  -12.5665    5.9366    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  -13.6935    6.2385    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
  1  4  1  0  0  0  0
  1  5  1  0  0  0  0
  2  6  1  0  0  0  0
  2  7  1  0  0  0  0
  2  8  1  0  0  0  0
M  END
`,
      { removeHs: false },
    )!;
    expect(mol.hasCoords()).toBe(2);
    mol.removeHsInPlace();
    expect(mol.hasCoords()).toBe(2);
    expect(mol.getSmiles()).toBe('CC');
    const mb = mol.getMolblock();
    expect(mb).toContain('  2  1');
    expect(mb).toContain('  1  2  1  0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_num_atoms_bonds
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_num_atoms_bonds', () => {
  it('numAtoms, numHeavyAtoms, numBonds are correct with and without Hs', () => {
    using mol = rdkit.getMol('CCCC')!;
    using molH = mol.copy();
    molH.addHsInPlace();
    expect(mol.numAtoms).toBe(molH.numHeavyAtoms);
    expect(mol.numAtoms).toBe(4);
    expect(molH.numAtoms).toBe(14);
    expect(mol.numBonds).toBe(3);
    expect(molH.numBonds).toBe(13);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_sanitize_no_kekulize_no_setaromaticity
// ─────────────────────────────────────────────────────────────────────────────

const BENZENE_MOLBLOCK_ALT1 = `
     RDKit          2D

  6  6  0  0  0  0  0  0  0  0999 V2000
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7500   -1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7500   -1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  1  1  0
M  END`;

const BENZENE_MOLBLOCK_ALT2 = `
     RDKit          2D

  6  6  0  0  0  0  0  0  0  0999 V2000
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7500   -1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7500   -1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7500    1.2990    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  2  0
  3  4  1  0
  4  5  2  0
  5  6  1  0
  6  1  2  0
M  END`;

describe('test_sanitize_no_kekulize_no_setaromaticity', () => {
  it('Kekule tautomers produce different molblocks when kekulize:false, setAromaticity:false', () => {
    using mol1 = rdkit.getMol(BENZENE_MOLBLOCK_ALT1, { kekulize: false, setAromaticity: false })!;
    using mol2 = rdkit.getMol(BENZENE_MOLBLOCK_ALT2, { kekulize: false, setAromaticity: false })!;
    expect(mol1.getMolblock()).not.toBe(mol2.getMolblock());
  });

  it('Kekule tautomers produce equal molblocks with default sanitization', () => {
    using mol1 = rdkit.getMol(BENZENE_MOLBLOCK_ALT1)!;
    using mol2 = rdkit.getMol(BENZENE_MOLBLOCK_ALT2)!;
    expect(mol1.getMolblock()).toBe(mol2.getMolblock());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_partial_sanitization
// ─────────────────────────────────────────────────────────────────────────────

describe('test_partial_sanitization', () => {
  it('partial sanitization (no fastFindRings) allows getMorganFp', () => {
    using mol = rdkit.getMol('C1CCC2CCCC2C1', {
      sanitize: false,
      removeHs: false,
      assignStereo: false,
    })!;
    const fp = mol.getMorganFp({ radius: 2, nBits: 32 });
    expect(fp.toString()).toBe('00001001010101000000100000110010');
  });

  it('partial sanitization with fastFindRings:false throws on getMorganFp', () => {
    using mol = rdkit.getMol('C1CCC2CCCC2C1', {
      sanitize: false,
      removeHs: false,
      assignStereo: false,
      fastFindRings: false,
    })!;
    expect(() => mol.getMorganFp({ radius: 2, nBits: 32 })).toThrow();
  });

  it('partial sanitization (no sanitize) molblock has aromatic bonds', () => {
    using mol = rdkit.getMol('c1ccccc1N(=O)=O', { sanitize: false })!;
    const mb = mol.getMolblock({ kekulize: false });
    expect(mb).toContain('  1  2  4  0');
    expect(mb.includes('  7  8  2  0') && mb.includes('  7  9  2  0')).toBe(true);
    expect(mb).not.toContain('M  CHG');
  });

  it('partial sanitization (SANITIZE_CLEANUP) fixes charge but retains aromatic bonds', () => {
    using mol = rdkit.getMol('c1ccccc1N(=O)=O', { sanitize: { SANITIZE_CLEANUP: true } })!;
    const mb = mol.getMolblock({ kekulize: false });
    expect(mb).toContain('  1  2  4  0');
    const hasChargeLine = mb.includes('  7  8  1  0') || mb.includes('  7  9  1  0');
    expect(hasChargeLine).toBe(true);
    expect(mb).toContain('M  CHG  2');
  });

  it('partial sanitization (SANITIZE_CLEANUP + SANITIZE_KEKULIZE) removes aromatic bonds', () => {
    using mol = rdkit.getMol('c1ccccc1N(=O)=O', {
      sanitize: { SANITIZE_CLEANUP: true, SANITIZE_KEKULIZE: true },
    })!;
    const mb = mol.getMolblock({ kekulize: false });
    expect(mb).not.toContain('  1  2  4  0');
    const hasChargeLine = mb.includes('  7  8  1  0') || mb.includes('  7  9  1  0');
    expect(hasChargeLine).toBe(true);
    expect(mb).toContain('M  CHG  2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_relabel_mapped_dummies
// ─────────────────────────────────────────────────────────────────────────────

describe('test_relabel_mapped_dummies', () => {
  it('by default mapped dummies are NOT relabeled as R groups', () => {
    using core = rdkit.getMol('c1cc([4*:2])c([3*:1])cn1')!;
    expect(core.getCxSmiles()).toBe('c1cc([4*:2])c([3*:1])cn1');
  });

  it('with mappedDummiesAreRGroups:true mapped dummies become R groups', () => {
    using core = rdkit.getMol('c1cc([4*:2])c([3*:1])cn1', { mappedDummiesAreRGroups: true })!;
    expect(core.getCxSmiles()).toBe('*c1ccncc1* |atomProp:0.dummyLabel.R2:7.dummyLabel.R1|');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_smiles_smarts_params
// ─────────────────────────────────────────────────────────────────────────────

const AMOXICILLIN_PUBCHEM =
  'CC1([C@@H](N2[C@H](S1)[C@@H](C2=O)NC(=O)[C@@H](C3=CC=C(C=C3)O)N)C(=O)O)C';

describe('test_smiles_smarts_params', () => {
  it('getSmiles returns canonical SMILES by default', () => {
    using mol = rdkit.getMol(AMOXICILLIN_PUBCHEM)!;
    const canonical = mol.getSmiles();
    expect(canonical).toBe('CC1(C)S[C@@H]2[C@H](NC(=O)[C@H](N)c3ccc(O)cc3)C(=O)N2[C@H]1C(=O)O');
  });

  it('getSmiles with empty options returns same canonical SMILES', () => {
    using mol = rdkit.getMol(AMOXICILLIN_PUBCHEM)!;
    expect(mol.getSmiles({})).toBe(
      'CC1(C)S[C@@H]2[C@H](NC(=O)[C@H](N)c3ccc(O)cc3)C(=O)N2[C@H]1C(=O)O',
    );
  });

  it('getSmiles with canonical:false returns non-canonical SMILES', () => {
    using mol = rdkit.getMol(AMOXICILLIN_PUBCHEM)!;
    const nonCanonical = mol.getSmiles({ canonical: false });
    expect(nonCanonical).toBe(
      'CC1(C)[C@H](C(=O)O)N2[C@H](S1)[C@H](NC(=O)[C@@H](c1ccc(O)cc1)N)C2=O',
    );
  });

  it('getSmiles with doIsomericSmiles:false strips stereo', () => {
    using mol = rdkit.getMol(AMOXICILLIN_PUBCHEM)!;
    expect(mol.getSmiles({ doIsomericSmiles: false })).toBe(
      'CC1(C)SC2C(NC(=O)C(N)c3ccc(O)cc3)C(=O)N2C1C(=O)O',
    );
  });

  it('getSmiles with doIsomericSmiles:false canonical:false strips stereo non-canonically', () => {
    using mol = rdkit.getMol(AMOXICILLIN_PUBCHEM)!;
    expect(mol.getSmiles({ doIsomericSmiles: false, canonical: false })).toBe(
      'CC1(C)C(C(=O)O)N2C(S1)C(NC(=O)C(c1ccc(O)cc1)N)C2=O',
    );
  });

  const BICYCLO = `
     RDKit          2D

  9 10  0  0  1  0  0  0  0  0999 V2000
   -2.8237   -1.3088    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -1.5723   -0.3996    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.5723    1.1473    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.1011    1.6253    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3701    1.1474    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3701   -0.3995    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.6217   -1.3087    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -0.1009   -0.8775    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8083    0.3739    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  1  1  1
  2  3  1  0
  4  3  1  0
  4  5  1  0
  6  5  1  0
  6  7  1  1
  6  8  1  0
  8  9  1  1
  8  2  1  0
  4  9  1  1
M  END
`;

  it('bicyclo getCxSmiles default has correct stereo and wedging', () => {
    using mol = rdkit.getMol(BICYCLO)!;
    const cxsmiles = mol.getCxSmiles();
    const match = cxsmiles.match(/^(\S+) \|\([^\)]+\),([^\|]+)\|$/);
    expect(match).not.toBeNull();
    const [, smi, wedging] = match!;
    expect(smi).toBe('N[C@@H]1C[C@@H]2C[C@H]1[C@@H](O)C2');
    expect(wedging).toBe('wD:3.9,wU:1.0,5.4,6.7');
  });

  it('bicyclo getCxSmiles with empty options returns same result', () => {
    using mol = rdkit.getMol(BICYCLO)!;
    const cxsmiles = mol.getCxSmiles({});
    const match = cxsmiles.match(/^(\S+) \|\([^\)]+\),([^\|]+)\|$/);
    expect(match).not.toBeNull();
    const [, smi, wedging] = match!;
    expect(smi).toBe('N[C@@H]1C[C@@H]2C[C@H]1[C@@H](O)C2');
    expect(wedging).toBe('wD:3.9,wU:1.0,5.4,6.7');
  });

  it('bicyclo getCxSmiles with restoreBondDirOption:true changes wedging', () => {
    using mol = rdkit.getMol(BICYCLO)!;
    const cxsmiles = mol.getCxSmiles({ restoreBondDirOption: true });
    const match = cxsmiles.match(/^(\S+) \|\([^\)]+\),([^\|]+)\|$/);
    expect(match).not.toBeNull();
    const [, smi, wedging] = match!;
    expect(smi).toBe('N[C@@H]1C[C@@H]2C[C@H]1[C@@H](O)C2');
    expect(wedging).toBe('wU:1.0,3.3,5.4,6.7');
  });

  it('bicyclo getCxSmiles with doIsomericSmiles:false, canonical:false, fields:[ALL_BUT_COORDS]', () => {
    using mol = rdkit.getMol(BICYCLO)!;
    const cxsmiles = mol.getCxSmiles({
      doIsomericSmiles: false,
      canonical: false,
      fields: ['ALL_BUT_COORDS'],
    });
    expect(cxsmiles).toBe('OC1CC2CC(N)C1C2');
    // atom prop round-trip
    const smiWithProp = `${cxsmiles} |atomProp:1.atomProp.1&#46;234|`;
    using molWithProp = rdkit.getMol(smiWithProp)!;
    expect(molWithProp).not.toBeNull();
    const cxWithProp = molWithProp.getCxSmiles({ fields: ['ALL_BUT_COORDS'] });
    expect(cxWithProp).toBe('NC1CC2CC(O)C1C2 |atomProp:5.atomProp.1&#46;234|');
  });

  it('chiral qmol getSmarts strips stereo with doIsomericSmiles:false', () => {
    using chiralQuery = rdkit.getQMol('N-[C@H](-C(-O)=O)-C(-C)-C')!;
    expect(chiralQuery.getSmarts()).toBe('N-[C@&H1](-C(-O)=O)-C(-C)-C');
    expect(chiralQuery.getSmarts({})).toBe('N-[C@&H1](-C(-O)=O)-C(-C)-C');
    expect(chiralQuery.getSmarts({ doIsomericSmiles: false })).toBe('N-[C&H1](-C(-O)=O)-C(-C)-C');
  });

  it('chiral qmol getCxSmarts with atom prop round-trip', () => {
    using chiralQuery = rdkit.getQMol('N-[C@H](-C(-O)=O)-C(-C)-C |atomProp:1.atomProp.1&#46;234|')!;
    expect(chiralQuery.getCxSmarts()).toBe(
      'N-[C@&H1](-C(-O)=O)-C(-C)-C |atomProp:1.atomProp.1&#46;234|',
    );
    expect(chiralQuery.getCxSmarts({})).toBe(
      'N-[C@&H1](-C(-O)=O)-C(-C)-C |atomProp:1.atomProp.1&#46;234|',
    );
    expect(chiralQuery.getCxSmarts({ doIsomericSmiles: false })).toBe(
      'N-[C&H1](-C(-O)=O)-C(-C)-C |atomProp:1.atomProp.1&#46;234|',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_make_dummies_queries
// ─────────────────────────────────────────────────────────────────────────────

describe('test_make_dummies_queries', () => {
  it('dummy atom * does not match by default (treated as literal)', () => {
    using mol = rdkit.getMol('CN')!;
    using query = rdkit.getMol('*N')!;
    const match = mol.getSubstructMatch(query);
    // wrapper returns { atoms: [], bonds: [] } for no-match (raw API returns '{}')
    expect(match.atoms).toHaveLength(0);
  });

  it('dummy atom * matches with makeDummiesQueries:true', () => {
    using mol = rdkit.getMol('CN')!;
    using query = rdkit.getMol('*N', { makeDummiesQueries: true })!;
    const match = mol.getSubstructMatch(query);
    expect(match.atoms).toEqual([0, 1]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_mol_copy
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_mol_copy', () => {
  it('mol.copy() returns an equivalent molecule (same molblock)', () => {
    using mol = rdkit.getMol('c1ccccn1')!;
    using molCopy = mol.copy();
    expect(mol.getMolblock()).toBe(molCopy.getMolblock());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_pickle
// ─────────────────────────────────────────────────────────────────────────────

describe('test_pickle', () => {
  it('getAsUint8Array / getMol(Uint8Array) preserves properties', () => {
    using mol = rdkit.getMol('c1ccccn1')!;
    mol.setProp('a', '1');
    // getProp auto-parses JSON: '1' (string) → 1 (number)
    expect(mol.getProp('a')).toBe(1);
    const pkl = mol.getAsUint8Array();
    expect(pkl).toBeTruthy();
    using molFromPkl = rdkit.getMol(pkl)!;
    expect(molFromPkl).not.toBeNull();
    expect(molFromPkl.hasProp('a')).toBe(true);
    expect(molFromPkl.getProp('a')).toBe(1);
  });

  it('getAsUint8Array with NoProps strips properties', () => {
    using mol = rdkit.getMol('c1ccccn1')!;
    mol.setProp('a', '1');
    // wrapper uses { properties: ['NoProps'] } instead of raw { propertyFlags: { NoProps: true } }
    const pklNoProps = mol.getAsUint8Array({ properties: ['NoProps'] });
    using molNoProp = rdkit.getMol(pklNoProps)!;
    expect(molNoProp).not.toBeNull();
    expect(molNoProp.hasProp('a')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_remove_hs_details
// ─────────────────────────────────────────────────────────────────────────────

describe('test_remove_hs_details', () => {
  it('removeHsInPlace with removeIsotopes:false preserves isotopic H', () => {
    using mol = rdkit.getMol('C([H])([H])([H])C([2H])([H])C([H])([H])[H]', { removeHs: false })!;
    expect(mol.getSmiles()).toBe('[H]C([H])([H])C([H])([2H])C([H])([H])[H]');
    expect(mol.removeHsInPlace({ removeIsotopes: false })).toBeTruthy();
    expect(mol.getSmiles()).toBe('[2H]C(C)C');
  });

  it('removeHsInPlace with removeIsotopes:true also removes isotopic H', () => {
    using mol = rdkit.getMol('C([H])([H])([H])C([2H])([H])C([H])([H])[H]', { removeHs: false })!;
    mol.removeHsInPlace({ removeIsotopes: false });
    expect(mol.removeHsInPlace({ removeIsotopes: true })).toBeTruthy();
    expect(mol.getSmiles()).toBe('CCC');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_mol_remove_hs
// ─────────────────────────────────────────────────────────────────────────────

const MOLBLOCK_WITH_ISOTOPIC_H = `
  MJ240300

  8  8  0  0  0  0  0  0  0  0999 V2000
   -1.4955    1.1152    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.2099    0.7027    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.2099   -0.1223    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.4955   -0.5348    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7810   -0.1223    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7810    0.7027    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0666    1.1152    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9244   -0.5348    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  6  7  1  0  0  0  0
  3  8  1  0  0  0  0
M  ISO  1   7   2
M  END
`;

const DEUTERIUM_COORDS = '  -0.0666    1.1152    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0';
const HYDROGEN_COORDS = '  -2.9244   -0.5348    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0';

describe('test_get_mol_remove_hs', () => {
  it('default (no details): both deuterium and H are retained in molblock', () => {
    using mol = rdkit.getMol(MOLBLOCK_WITH_ISOTOPIC_H)!;
    const mb = mol.getMolblock();
    expect(mb).toContain(DEUTERIUM_COORDS);
    expect(mb).toContain(HYDROGEN_COORDS);
  });

  it('removeHs:false: both deuterium and H are retained', () => {
    using mol = rdkit.getMol(MOLBLOCK_WITH_ISOTOPIC_H, { removeHs: false })!;
    const mb = mol.getMolblock();
    expect(mb).toContain(DEUTERIUM_COORDS);
    expect(mb).toContain(HYDROGEN_COORDS);
  });

  it('removeHs:true: deuterium retained but plain H removed', () => {
    using mol = rdkit.getMol(MOLBLOCK_WITH_ISOTOPIC_H, { removeHs: true })!;
    const mb = mol.getMolblock();
    expect(mb).toContain(DEUTERIUM_COORDS);
    expect(mb).not.toContain(HYDROGEN_COORDS);
  });

  it('round-trip via JSON (default): deuterium retained, H removed', () => {
    using molRef = rdkit.getMol(MOLBLOCK_WITH_ISOTOPIC_H)!;
    const jb = molRef.getJSON();
    using mol = rdkit.getMol(JSON.stringify(jb), { removeHs: true })!;
    const mb = mol.getMolblock();
    expect(mb).toContain(DEUTERIUM_COORDS);
    expect(mb).not.toContain(HYDROGEN_COORDS);
  });

  it('round-trip via SMILES (default): deuterium present, plain H absent', () => {
    using molRef = rdkit.getMol(MOLBLOCK_WITH_ISOTOPIC_H)!;
    const smi = molRef.getSmiles();
    using mol = rdkit.getMol(smi)!;
    const smiOut = mol.getSmiles();
    expect(smiOut).toContain('[2H]');
    expect(smiOut).not.toContain('[H]');
  });

  it('round-trip via SMILES with removeHs:false: deuterium and H both present', () => {
    using molRef = rdkit.getMol(MOLBLOCK_WITH_ISOTOPIC_H)!;
    const smi = molRef.getSmiles();
    using mol = rdkit.getMol(smi, { removeHs: false })!;
    const smiOut = mol.getSmiles();
    expect(smiOut).toContain('[2H]');
    expect(smiOut).toContain('[H]');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_combine_with
// ─────────────────────────────────────────────────────────────────────────────

describe('test_combine_with', () => {
  it('combineWith merges two molecules', () => {
    using mol = rdkit.getMol('CC')!;
    using other = rdkit.getMol('NCC')!;
    mol.combineWith(other);
    expect(mol.numAtoms).toBe(5);
    expect(mol.getSmiles()).toBe('CC.CCN');
  });

  it('combineWith with offset places molecule at given coordinates', () => {
    using mol = rdkit.getMol('C1CC1 |(0.866025,0,;-0.433013,0.75,;-0.433013,-0.75,)|')!;
    using other = rdkit.getMol('C1CNC1 |(-1.06066,0,;0,-1.06066,;1.06066,0,;0,1.06066,)|')!;
    mol.combineWith(other, { offset: [4.0, 0.0, 0.0] });
    expect(mol.numAtoms).toBe(7);
    expect(mol.getSmiles()).toBe('C1CC1.C1CNC1');
    expect(mol.getMolblock()).toContain('    4.0000');
  });

  it('combineWith with offset 9.0 places molecule at correct x coordinate', () => {
    using molCopy = rdkit.getMol('C1CC1 |(0.866025,0,;-0.433013,0.75,;-0.433013,-0.75,)|')!;
    using other = rdkit.getMol('C1CNC1 |(-1.06066,0,;0,-1.06066,;1.06066,0,;0,1.06066,)|')!;
    molCopy.combineWith(other, { offset: [9.0, 0.0, 0.0] });
    expect(molCopy.numAtoms).toBe(7);
    expect(molCopy.getSmiles()).toBe('C1CC1.C1CNC1');
    expect(molCopy.getMolblock()).toContain('    9.0000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_v3K_v2K_molblock
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_v3K_v2K_molblock', () => {
  it('getV3KMolblock round-trips through getMol', () => {
    using mol = rdkit.getMol('c1cc(O)ccc1')!;
    const v3k = mol.getV3KMolblock();
    using mol2 = rdkit.getMol(v3k)!;
    expect(mol2.getSmiles()).toBe('Oc1ccccc1');
  });

  it('getV3KMolblock with kekulize:false preserves aromatic bond type', () => {
    using mol = rdkit.getMol('c1cc(O)ccc1')!;
    const v3k = mol.getV3KMolblock({ kekulize: false });
    expect(v3k).toContain('M  V30 1 4 1 2');
  });

  it('getMolblock with forceMDLVersion:V3000 produces V3000 output', () => {
    using mol = rdkit.getMol('c1cc(O)ccc1')!;
    const mb = mol.getMolblock({ forceMDLVersion: 'V3000' });
    expect(mb).toContain('V3000');
  });

  it('getV3KMolblock with forceMDLVersion:V2000 still produces V3000 (flag ignored)', () => {
    using mol = rdkit.getMol('c1cc(O)ccc1')!;
    const mb = mol.getV3KMolblock({ forceMDLVersion: 'V2000' });
    expect(mb).toContain('V3000');
  });

  it('dative bond molecule defaults to V3000 molblock', () => {
    using mol = rdkit.getMol('N->[Pt+2](Cl)(Cl)<-N')!;
    const mb = mol.getMolblock();
    expect(mb).toContain('V3000');
    expect(mb).toContain('M  V30 4 9 5 2');
  });

  it('dative bond molecule with forceMDLVersion:V2000 produces V2000 molblock', () => {
    using mol = rdkit.getMol('N->[Pt+2](Cl)(Cl)<-N')!;
    const mb = mol.getMolblock({ forceMDLVersion: 'V2000' });
    expect(mb).toContain('V2000');
    expect(mb).toContain('  5  2  9  0');
  });

  it('getV3KMolblock with forceMDLVersion:V2000 still produces V3000 for dative bond', () => {
    using mol = rdkit.getMol('N->[Pt+2](Cl)(Cl)<-N')!;
    const mb = mol.getV3KMolblock({ forceMDLVersion: 'V2000' });
    expect(mb).toContain('V3000');
    expect(mb).toContain('M  V30 4 9 5 2');
  });

  it('getV2KMolblock with forceMDLVersion:V3000 still produces V2000 for dative bond', () => {
    using mol = rdkit.getMol('N->[Pt+2](Cl)(Cl)<-N')!;
    const mb = mol.getV2KMolblock({ forceMDLVersion: 'V3000' });
    expect(mb).toContain('V2000');
    expect(mb).toContain('  5  2  9  0');
  });
});

describe('test_get_mmpa_frags', () => {
  const SMILES = 'CC(C)CCN1C(=O)CN=C(C2CCCCC2)c2ccccc21';

  it('throws for minCuts < 1', () => {
    using mol = rdkit.getMol(SMILES)!;
    expect(() => mol.getMmpaFrags({ minCuts: 0, maxCuts: 2, fragmentableBondLimit: 20 })).toThrow();
  });

  it('throws for maxCuts < minCuts', () => {
    using mol = rdkit.getMol(SMILES)!;
    expect(() => mol.getMmpaFrags({ minCuts: 2, maxCuts: 1, fragmentableBondLimit: 20 })).toThrow();
  });

  it('minCuts=2 maxCuts=2: returns 11 fragmentations with expected core and sidechains SMILES', () => {
    using mol = rdkit.getMol(SMILES)!;
    using result = mol.getMmpaFrags({ minCuts: 2, maxCuts: 2, fragmentableBondLimit: 20 });

    const expectedCores = [
      'O=C1CN=C(C2CCCCC2)c2ccccc2N1CCC([*:1])[*:2]',
      'CC([*:1])[*:2]',
      'CC(C[*:2])[*:1]',
      'CC(CC[*:2])[*:1]',
      'CC(CCN1C(=O)CN=C([*:2])c2ccccc21)[*:1]',
      'C([*:1])[*:2]',
      'C(C[*:2])[*:1]',
      'O=C1CN=C([*:2])c2ccccc2N1CC[*:1]',
      'C([*:1])[*:2]',
      'O=C1CN=C([*:1])c2ccccc2N1C[*:2]',
      'O=C1CN=C([*:1])c2ccccc2N1[*:2]',
    ];
    const expectedSidechains = [
      'C[*:1].C[*:2]',
      'C[*:1].O=C1CN=C(C2CCCCC2)c2ccccc2N1CC[*:2]',
      'C[*:1].O=C1CN=C(C2CCCCC2)c2ccccc2N1C[*:2]',
      'C[*:1].O=C1CN=C(C2CCCCC2)c2ccccc2N1[*:2]',
      'C1CCC([*:2])CC1.C[*:1]',
      'CC(C)[*:1].O=C1CN=C(C2CCCCC2)c2ccccc2N1C[*:2]',
      'CC(C)[*:1].O=C1CN=C(C2CCCCC2)c2ccccc2N1[*:2]',
      'C1CCC([*:2])CC1.CC(C)[*:1]',
      'CC(C)C[*:1].O=C1CN=C(C2CCCCC2)c2ccccc2N1[*:2]',
      'C1CCC([*:1])CC1.CC(C)C[*:2]',
      'C1CCC([*:1])CC1.CC(C)CC[*:2]',
    ];

    expect(result.length).toBe(11);
    expect(result.cores.length).toBe(11);
    expect(result.sidechains.length).toBe(11);

    let i = 0;
    for (const { core, sidechains } of result) {
      expect(core.getSmiles()).toBe(expectedCores[i]);
      expect(sidechains.getSmiles()).toBe(expectedSidechains[i]);
      core.zipWith(sidechains);
      expect(core.getSmiles()).toBe(SMILES);
      i++;
    }
  });

  it('minCuts=1 maxCuts=1: returns 5 fragmentations, cores normalized to largest fragment', () => {
    using mol = rdkit.getMol(SMILES)!;
    using result = mol.getMmpaFrags({ minCuts: 1, maxCuts: 1, fragmentableBondLimit: 20 });

    const expectedCores = [
      'CC(CCN1C(=O)CN=C(C2CCCCC2)c2ccccc21)[*:1]',
      'O=C1CN=C(C2CCCCC2)c2ccccc2N1CC[*:1]',
      'O=C1CN=C(C2CCCCC2)c2ccccc2N1C[*:1]',
      'O=C1CN=C(C2CCCCC2)c2ccccc2N1[*:1]',
      'CC(C)CCN1C(=O)CN=C([*:1])c2ccccc21',
    ];

    const expectedSidechains = [
      'C[*:1]',
      'CC(C)[*:1]',
      'CC(C)C[*:1]',
      'CC(C)CC[*:1]',
      'C1CCC([*:1])CC1',
    ];
    // For single-cut, RDKit returns no core — wrapper assigns largest fragment as core
    expect(result.length).toBe(5);
    expect(result.cores.length).toBe(5);
    expect(result.sidechains.length).toBe(5);

    // Each core must have >= atoms than its sidechains
    let i = 0;
    for (const { core, sidechains } of result) {
      expect(core.numAtoms).toBeGreaterThanOrEqual(sidechains.numAtoms);
      expect(core.getSmiles()).toBe(expectedCores[i]);
      expect(sidechains.getSmiles()).toBe(expectedSidechains[i]);
      core.zipWith(sidechains);
      expect(core.getSmiles()).toBe(SMILES);
      i++;
    }
  });

  it('returns empty result when fragmentableBondLimit is too low', () => {
    using mol = rdkit.getMol(SMILES)!;
    using result = mol.getMmpaFrags({ minCuts: 2, maxCuts: 2, fragmentableBondLimit: 1 });
    expect(result.length).toBe(0);
    expect(result.cores.length).toBe(0);
    expect(result.sidechains.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_substruct_library (ported from tests.js)
// ─────────────────────────────────────────────────────────────────────────────

describe('test_substruct_library', () => {
  const COMPOUNDS_SMI = join(__dirname, 'data/compounds.smi');
  const QUERY_SMARTS = 'C1CCCCN1';
  const EXPECTED_INDICES = new Uint32Array([39, 64, 80, 127, 128, 234, 240]);
  const COMPOUND_SMILES = readFileSync(COMPOUNDS_SMI, 'utf8')
    .split('\n')
    .map((l) => l.split('\t')[0].trim())
    .filter(Boolean);

  let compoundsLib: ReturnType<typeof rdkit.createSubstructLibrary>;

  beforeAll(() => {
    compoundsLib = rdkit.createSubstructLibrary();
    for (const smi of COMPOUND_SMILES) compoundsLib.add(smi, { trusted: true });
  });

  afterAll(() => {
    compoundsLib.delete();
  });

  it('empty library returns no matches', () => {
    using lib = rdkit.createSubstructLibrary();
    const result = lib.getMatches(QUERY_SMARTS);
    expect(result.count).toBe(0);
    expect(result.indices.length).toBe(0);
  });

  it('empty query SMARTS matches nothing', () => {
    using lib = rdkit.createSubstructLibrary();
    lib.add('C', { trusted: true });
    const result = lib.getMatches('');
    expect(result.count).toBe(0);
  });

  it('size reflects number of added molecules', () => {
    using lib = rdkit.createSubstructLibrary();
    expect(lib.size).toBe(0);
    lib.add('C', { trusted: true });
    lib.add('CC', { trusted: true });
    expect(lib.size).toBe(2);
  });

  it('finds expected matches in compound library (default fingerprints)', () => {
    expect(compoundsLib.size).toBe(300);
    const result = compoundsLib.getMatches(QUERY_SMARTS);
    expect(result.count).toBe(EXPECTED_INDICES.length);
    expect(result.indices).toEqual(EXPECTED_INDICES);
  });

  it('finds same matches with disableFingerprints (brute-force)', () => {
    using lib = rdkit.createSubstructLibrary({ disableFingerprints: true });
    for (const smi of COMPOUND_SMILES) lib.add(smi, { trusted: true });
    const result = lib.getMatches(QUERY_SMARTS);
    expect(result.indices).toEqual(EXPECTED_INDICES);
  });

  it('addPrecomputed round-trip produces identical results', () => {
    // Extract SMILES + fingerprints from shared lib, rebuild in lib2
    using lib2 = rdkit.createSubstructLibrary();
    for (let i = 0; i < compoundsLib.size; i++) {
      const { smiles, patternFp } = compoundsLib.at(i);
      lib2.addPrecomputed(smiles, patternFp);
    }

    const r1 = compoundsLib.getMatches(QUERY_SMARTS);
    const r2 = lib2.getMatches(QUERY_SMARTS);
    expect(r2.indices).toEqual(r1.indices);
  });

  it('iterator yields entries with correct indices and smiles', () => {
    using lib = rdkit.createSubstructLibrary();
    lib.add('C1CCCCN1', { trusted: true });
    lib.add('c1ccccc1', { trusted: true });
    lib.add('CC(=O)O', { trusted: true });

    const result = lib.getMatches(QUERY_SMARTS);
    expect(result.count).toBe(1);

    const entries = [...result];
    expect(entries.length).toBe(1);
    expect(entries[0].index).toBe(0);
    expect(typeof entries[0].smiles).toBe('string');
    entries[0].delete();
  });

  it('at() provides lazy mol getter that is disposable', () => {
    using lib = rdkit.createSubstructLibrary();
    lib.add('c1ccccc1', { trusted: true });

    const entry = lib.at(0);
    expect(entry.smiles).toBeTruthy();
    expect(entry.patternFp).toBeTruthy();

    // Accessing mol lazily creates a Mol
    using mol = entry.mol!;
    expect(mol).not.toBeNull();
    expect(mol.getSmiles()).toBe('c1ccccc1');
  });

  it('respects maxResults option', () => {
    const result = compoundsLib.getMatches(QUERY_SMARTS, { maxResults: 3 });
    expect(result.count).toBe(3);
    expect(result.indices).toEqual(EXPECTED_INDICES.subarray(0, 3));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_substruct_library_merge_hs (ported from tests.js)
// ─────────────────────────────────────────────────────────────────────────────

describe('test_substruct_library_merge_hs', () => {
  const BENZENE_MOLBLOCK = `
  MJ201100          2D

  6  6  0  0  0  0  0  0  0  0999 V2000
   -1.0491    0.7134    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7635    0.3009    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7635   -0.5241    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.0491   -0.9366    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3346   -0.5241    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3346    0.3009    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  3  1  0  0  0  0
  5  6  2  0  0  0  0
  1  2  2  0  0  0  0
  6  1  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
M  END`;

  it('benzene query matches benzene and toluene', () => {
    using lib = rdkit.createSubstructLibrary();
    using mol1 = rdkit.getMol('c1ccccc1')!;
    using mol2 = rdkit.getMol('Cc1ccccc1')!;
    lib.add(mol1);
    lib.add(mol2);

    using query = rdkit.getMol(BENZENE_MOLBLOCK)!;
    const result = lib.getMatches(query);
    expect(Array.from(result.indices)).toEqual([0, 1]);
  });

  it('query with explicit H matches nothing', () => {
    using lib = rdkit.createSubstructLibrary();
    using mol1 = rdkit.getMol('c1ccccc1')!;
    using mol2 = rdkit.getMol('Cc1ccccc1')!;
    lib.add(mol1);
    lib.add(mol2);

    using query = rdkit.getMol(BENZENE_MOLBLOCK)!;
    const queryWithHs = query.addHs();
    using queryHsMol = rdkit.getMol(queryWithHs)!;
    const result = lib.getMatches(queryHsMol);
    expect(result.count).toBe(0);
  });

  it('query with explicit H and mergeQueryHs matches only unsubstituted benzene', () => {
    using lib = rdkit.createSubstructLibrary();
    using mol1 = rdkit.getMol('c1ccccc1')!;
    using mol2 = rdkit.getMol('Cc1ccccc1')!;
    lib.add(mol1);
    lib.add(mol2);

    using query = rdkit.getMol(BENZENE_MOLBLOCK)!;
    const queryWithHs = query.addHs();
    using queryHsMol = rdkit.getMol(queryWithHs)!;
    using queryMerged = rdkit.getMol(queryHsMol.getMolblock(), { mergeQueryHs: true })!;
    const result = lib.getMatches(queryMerged);
    expect(Array.from(result.indices)).toEqual([0]);
  });
});
