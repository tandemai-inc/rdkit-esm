import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('Mol - string representations', () => {
  it('getSmiles returns canonical SMILES', () => {
    using mol = rdkit.getMol('C1=CC=CC=C1')!;
    expect(mol.getSmiles()).toBe('c1ccccc1');
  });

  it('getCxSmiles returns extended SMILES', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.getCxSmiles()).toBeTypeOf('string');
  });

  it('getSmarts returns SMARTS string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.getSmarts()).toBeTypeOf('string');
  });

  it('getCxSmarts returns extended SMARTS string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.getCxSmarts()).toBeTypeOf('string');
  });

  it('getAsUint8Array returns Uint8Array', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const arr = mol.getAsUint8Array();
    expect(arr).toBeInstanceOf(Uint8Array);
    expect(arr.length).toBeGreaterThan(0);
  });

  it('getMolblock returns V2000 Molfile', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getMolblock();
    expect(molblock).toContain('V2000');
  });

  it('getMolblock with options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getMolblock({ kekulize: true });
    expect(molblock).toContain('V2000');
  });

  it('getV3KMolblock returns V3000 Molfile', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getV3KMolblock();
    expect(molblock).toContain('V3000');
  });

  it('getInchi returns InChI string', () => {
    using mol = rdkit.getMol('C(CC(=O)O)C(=O)C(=O)O')!; // alpha-ketoglutaric acid
    const inchi = mol.getInchi();
    expect(inchi).toBe('InChI=1S/C5H6O5/c6-3(5(9)10)1-2-4(7)8/h1-2H2,(H,7,8)(H,9,10)');
  });

  it('getInchi accepts options', () => {
    using ketoMol = rdkit.getMol('C(CC(=O)O)C(=O)C(=O)O')!; // alpha-ketoglutaric acid
    const ketoInchi = ketoMol.getInchi(['KET']);
    expect(ketoInchi).toBe('InChI=1/C5H6O5/c6-3(5(9)10)1-2-4(7)8/h2H2,(H2,1,6)(H,7,8)(H,9,10)');
    using enolMol = rdkit.getMol('C(CC(=O)O)=C(O)C(=O)O')!;
    const enolInchi = enolMol.getInchi(['KET']);
    expect(enolInchi).toBe(ketoInchi); // same InChI for both tautomers
  });

  it('getInchikey returns InChI key', () => {
    using mol = rdkit.getMol('CN1CC[C@]23C4=C5C=CC(O)=C4O[C@H]2[C@@H](O)C=C[C@H]3[C@H]1C5')!;
    expect(mol.getInchikey()).toBe('BQJCRHHNABKAKU-KBQPJGBKSA-N');
  });

  it('getJson returns parsed molecule JSON', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const json = mol.getJson();
    expect(json.molecules).toBeInstanceOf(Array);
    expect(json.molecules.length).toBeGreaterThan(0);
  });
});

describe('Mol - SVG', () => {
  it('getSvg returns SVG string with defaults', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const svg = mol.getSvg();
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('getSvg with custom dimensions and options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const svg = mol.getSvg({ width: 400, height: 300, addAtomIndices: true });
    expect(svg).toContain('<svg');
  });
});

describe('Mol - substructure', () => {
  it('getSubstructMatch with Mol query', () => {
    using mol = rdkit.getMol('c1ccc(O)cc1')!;
    using query = rdkit.getMol('c1ccccc1')!;
    const match = mol.getSubstructMatch(query);
    expect(match.atoms).toEqual([0, 1, 2, 3, 5, 6]);
    expect(match.bonds).toEqual([0, 1, 2, 4, 5, 6]);
    expect(match.atoms.length).toBe(6);
  });

  it('getSubstructMatch with SMARTS string', () => {
    using mol = rdkit.getMol('c1ccc(O)cc1')!;
    const match = mol.getSubstructMatch('[OH]');
    expect(match.atoms).toEqual([4]);
    expect(match.atoms.length).toBe(1);
  });

  it('getSubstructMatches returns all matches', () => {
    using mol = rdkit.getMol('c1ccc(O)cc1O')!;
    const matches = mol.getSubstructMatches('[OH]');
    expect(matches).toBeInstanceOf(Array);
    expect(matches.length).toBe(2);
  });
});

describe('Mol - descriptors', () => {
  it('getDescriptors returns typed object', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const desc = mol.getDescriptors();
    expect(desc.exactmw).toBeTypeOf('number');
    expect(desc.NumAromaticRings).toBeTypeOf('number');
    expect(desc.NumAromaticRings).toBe(1);
    expect(desc.NumHeavyAtoms).toBe(6);
  });
});

describe('Mol - fingerprints', () => {
  it('getMorganFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMorganFp();
    expect(fp).toBeTypeOf('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getMorganFp with options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMorganFp({ radius: 3 });
    expect(fp).toBeTypeOf('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getPatternFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getPatternFp();
    expect(fp).toBeTypeOf('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getTopologicalTorsionFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getTopologicalTorsionFp();
    expect(fp).toBeTypeOf('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getRdkitFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getRdkitFp();
    expect(fp).toBeTypeOf('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getAtomPairFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getAtomPairFp();
    expect(fp).toBeTypeOf('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getMaccsFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMaccsFp();
    expect(fp).toBeTypeOf('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getMorganFpAsUint8Array returns Uint8Array', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMorganFpAsUint8Array();
    expect(fp).toBeInstanceOf(Uint8Array);
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getPatternFpAsUint8Array returns Uint8Array', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getPatternFpAsUint8Array();
    expect(fp).toBeInstanceOf(Uint8Array);
    expect(fp.length).toBeGreaterThan(0);
  });

  it('getMaccsFpAsUint8Array returns Uint8Array', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMaccsFpAsUint8Array();
    expect(fp).toBeInstanceOf(Uint8Array);
    expect(fp.length).toBeGreaterThan(0);
  });
});

describe('Mol - properties', () => {
  it('set, has, get, clear property cycle', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.hasProp('myKey')).toBe(false);

    mol.setProp('myKey', 'myValue');
    expect(mol.hasProp('myKey')).toBe(true);
    expect(mol.getProp('myKey')).toBe('myValue');

    mol.clearProp('myKey');
    expect(mol.hasProp('myKey')).toBe(false);
  });
});

describe('Mol - molecule info', () => {
  it('getNumAtoms returns atom count', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.getNumAtoms()).toBe(6);
  });

  it('getNumBonds returns bond count', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.getNumBonds()).toBe(6);
  });

  it('hasCoords returns 0 for SMILES without coords', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.hasCoords()).toBe(0);
  });

  it('hasCoords returns 2 after generating 2D coords', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.setNewCoords();
    expect(mol.hasCoords()).toBe(2);
  });

  it('getStereoTags returns stereo info', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const tags = mol.getStereoTags();
    expect(tags).toHaveProperty('CIP_atoms');
    expect(tags).toHaveProperty('CIP_bonds');
  });
});

describe('Mol - aromatic / kekule', () => {
  it('getAromaticForm returns molfile string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const form = mol.getAromaticForm();
    expect(form).toBeTypeOf('string');
  });

  it('getKekuleForm returns molfile string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const form = mol.getKekuleForm();
    expect(form).toBeTypeOf('string');
  });

  it('convertToAromaticForm and convertToKekuleForm work in place', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.convertToKekuleForm();
    expect(mol.getSmiles()).toBeTypeOf('string');
    mol.convertToAromaticForm();
    expect(mol.getSmiles()).toBeTypeOf('string');
  });
});

describe('Mol - hydrogen methods', () => {
  it('addHs returns molfile with explicit Hs', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const withHs = mol.addHs();
    expect(withHs).toContain('V2000');
  });

  it('addHsInPlace adds Hs in place', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const result = mol.addHsInPlace();
    expect(result).toBeTypeOf('boolean');
    expect(mol.getNumAtoms()).toBe(12);
  });

  it('removeHs returns molfile without explicit Hs', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.addHsInPlace();
    const withoutHs = mol.removeHs();
    expect(withoutHs).toContain('V2000');
  });

  it('removeHsInPlace removes Hs in place', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.addHsInPlace();
    expect(mol.getNumAtoms()).toBe(12);
    mol.removeHsInPlace();
    expect(mol.getNumAtoms()).toBe(6);
  });
});

describe('Mol - coordinate generation', () => {
  it('setNewCoords generates 2D coordinates', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const result = mol.setNewCoords();
    expect(result).toBeTypeOf('boolean');
    expect(mol.hasCoords()).toBe(2);
  });

  it('getNewCoords returns molfile with new coordinates', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getNewCoords();
    expect(molblock).toContain('V2000');
  });

  it('normalizeDepiction returns scale factor', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.setNewCoords();
    const scale = mol.normalizeDepiction();
    expect(scale).toBeTypeOf('number');
  });

  it('normalizeDepiction with options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.setNewCoords();
    const scale = mol.normalizeDepiction({ canonicalize: 1, scaleFactor: -1 });
    expect(scale).toBeTypeOf('number');
  });

  it('straightenDepiction works', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.setNewCoords();
    expect(() => mol.straightenDepiction()).not.toThrow();
  });
});

describe('Mol - abbreviations', () => {
  it('condenseAbbreviations returns string', () => {
    using mol = rdkit.getMol('c1ccccc1C(=O)O')!;
    const result = mol.condenseAbbreviations();
    expect(result).toBeTypeOf('string');
  });

  it('condenseAbbreviations with options', () => {
    using mol = rdkit.getMol('c1ccccc1C(=O)O')!;
    const result = mol.condenseAbbreviations({
      maxCoverage: 0.4,
      useLinkers: false,
    });
    expect(result).toBeTypeOf('string');
  });
});

describe('Mol - fragments', () => {
  it('getFrags returns fragment info and MolCollection', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const frags = mol.getFrags();
    expect(frags.frags).toBeInstanceOf(Array);
    expect(frags.frags.length).toBe(mol.getNumAtoms());
    expect(frags.fragsMolAtomMapping).toBeInstanceOf(Array);
    expect(frags.fragsMolAtomMapping.length).toBe(2);
    expect(frags.mols.size()).toBe(2);
    frags.mols.delete();
  });
});

describe('Mol - copy', () => {
  it('copy returns independent molecule', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    using copy = mol.copy();
    expect(copy.getSmiles()).toBe('c1ccccc1');
    mol.delete();
    expect(copy.getSmiles()).toBe('c1ccccc1');
  });
});

describe('Mol - property list', () => {
  it('getPropList returns array', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const list = mol.getPropList();
    expect(list).toBeInstanceOf(Array);
  });

  it('getPropList with options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.setProp('myKey', 'myValue');
    const list = mol.getPropList({
      includePrivate: true,
      includeComputed: true,
    });
    expect(list).toBeInstanceOf(Array);
    expect(list).toContain('myKey');
  });
});

describe('Mol - lifecycle', () => {
  it('delete() frees the molecule', () => {
    const mol = rdkit.getMol('c1ccccc1')!;
    mol.delete();
    expect(() => mol.jsMol).toThrow('Mol has been deleted');
  });

  it('throws after delete()', () => {
    const mol = rdkit.getMol('c1ccccc1')!;
    mol.delete();
    expect(() => mol.getSmiles()).toThrow('Mol has been deleted');
  });

  it('using keyword disposes the molecule', () => {
    let molRef: typeof import('../src/index.ts').Mol.prototype | null = null;
    {
      using mol = rdkit.getMol('c1ccccc1')!;
      expect(mol.isValid()).toBe(true);
      molRef = mol;
    }
    expect(() => molRef!.jsMol).toThrow('Mol has been deleted');
  });

  it('jsMol is accessible for advanced usage', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    // Direct access to the underlying JSMol
    expect(mol.jsMol.get_smiles()).toBe('c1ccccc1');
  });
});
