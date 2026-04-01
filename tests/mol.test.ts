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

  it('getV2KMolblock with options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molblock = mol.getV2KMolblock();
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

    // FixedH
    using protomer1 = rdkit.getMol('C1C[NH+]=CO1')!;
    using protomer2 = rdkit.getMol('C1CN=C[OH+]1')!;
    const fhixedHInchi1 = protomer1.getInchi(['FixedH']);
    const stdInchi1 = protomer1.getInchi();
    const fhixedHInchi2 = protomer2.getInchi(['FixedH']);
    const stdInchi2 = protomer2.getInchi();

    expect(fhixedHInchi1).not.toBe(fhixedHInchi2);
    expect(stdInchi1).toBe(stdInchi2);
  });

  it('getInchikey returns InChI key', () => {
    using mol = rdkit.getMol('CN1CC[C@]23C4=C5C=CC(O)=C4O[C@H]2[C@@H](O)C=C[C@H]3[C@H]1C5')!;
    expect(mol.getInchikey()).toBe('BQJCRHHNABKAKU-KBQPJGBKSA-N');
  });

  it('getJSON returns parsed molecule JSON', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const json = mol.getJSON();
    expect(json.molecules).toBeInstanceOf(Array);
    expect(json.molecules.length).toBeGreaterThan(0);
  });
});

const COLCHICINE_MOLBLOCK = `
     RDKit          2D

 29 31  0  0  0  0  0  0  0  0999 V2000
    6.4602    1.0300    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.3062    1.9883    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    3.8993    1.4680    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.7453    2.4262    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3384    1.9059    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.0856    0.4273    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2396   -0.5309    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.9868   -2.0094    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    3.1408   -2.9677    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6465   -0.0106    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.8005   -0.9688    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    4.5477   -2.4474    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2280   -0.2968    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.1857   -1.7387    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.6836   -2.9611    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1813   -3.0436    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.7569   -4.4288    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -4.2442   -4.6230    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.1797   -1.9240    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -4.6215   -2.3378    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -2.9268   -0.4455    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6132    0.2787    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.0269    1.7205    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.5055    1.9733    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -4.0258    3.3802    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.5043    3.6330    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.0675    4.5342    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1576    2.9429    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.3401    3.0254    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  7  1  0
  7  8  1  0
  8  9  1  0
  7 10  2  0
 10 11  1  0
 11 12  1  0
  6 13  1  0
 13 14  2  0
 14 15  1  0
 15 16  2  0
 16 17  1  0
 17 18  1  0
 16 19  1  0
 19 20  2  0
 19 21  1  0
 21 22  2  0
 23 22  1  1
 23 24  1  0
 24 25  1  0
 25 26  1  0
 25 27  2  0
 23 28  1  0
 28 29  1  0
 10  3  1  0
 22 13  1  0
 29  5  1  0
M  END
`;

describe('Mol - CX SMILES options', () => {
  it('getCxSmiles default returns wedging info', () => {
    using mol = rdkit.getMol(COLCHICINE_MOLBLOCK)!;
    expect(mol.getCxSmiles()).toContain('wU:22.24|');
  });

  it('getCxSmiles with restoreBondDirOption true changes wedging', () => {
    using mol = rdkit.getMol(COLCHICINE_MOLBLOCK)!;
    expect(mol.getCxSmiles({ restoreBondDirOption: true })).toContain('wU:22.23|');
  });

  it('getCxSmiles with restoreBondDirOption clear keeps original wedging', () => {
    using mol = rdkit.getMol(COLCHICINE_MOLBLOCK)!;
    expect(mol.getCxSmiles({ restoreBondDirOption: 'clear' })).toContain('wU:22.24|');
  });

  it('getCxSmiles with ALL_BUT_COORDS excludes coordinates', () => {
    using mol = rdkit.getMol(COLCHICINE_MOLBLOCK)!;
    const withCoords = mol.getCxSmiles({ fields: ['ALL'] }); // same as default (without the `fields` property)
    const withoutCoords = mol.getCxSmiles({ fields: ['ALL_BUT_COORDS'] });
    // With ALL, the CX block contains coordinate data (semicolons separate coords)
    const cxBlockWithCoords = withCoords.split(' |')[1] ?? '';
    expect(cxBlockWithCoords).toMatch(/\(\d/);
    // With ALL_BUT_COORDS, no coordinate data in the CX block
    const cxBlockWithout = withoutCoords.split(' |')[1] ?? '';
    expect(cxBlockWithout).not.toMatch(/\(\d/);
  });

  it('getCxSmiles with doIsomericSmiles false strips stereo', () => {
    using mol = rdkit.getMol(COLCHICINE_MOLBLOCK)!;
    const noStereo = mol.getCxSmiles({
      doIsomericSmiles: false,
      fields: ['ALL_BUT_COORDS'],
    });
    // Colchicine without stereo info should not have @ or / or \ characters in the SMILES part
    const smilesPart = noStereo.split(' ')[0];
    expect(smilesPart).not.toContain('@');
  });
});

describe('Mol - SVG', () => {
  it('getSVG returns SVG string with defaults', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const svg = mol.getSVG();
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('getSVG with custom dimensions and options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const svg = mol.getSVG({ width: 400, height: 300, addAtomIndices: true });
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
    const desc = mol.getDescriptors()!;
    expect(desc.exactmw).toBeTypeOf('number');
    expect(desc.NumAromaticRings).toBeTypeOf('number');
    expect(desc.NumAromaticRings).toBe(1);
    expect(desc.NumHeavyAtoms).toBe(6);
  });
  it('getDescriptors returns null for molecule with queries', () => {
    using mol = rdkit.getQMol('c1ccccc1')!;
    const desc = mol.getDescriptors();
    expect(desc).toBeNull();
  });
});

describe('Mol - fingerprints', () => {
  it('getMorganFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMorganFp();
    expect(fp.toString()).toBeTypeOf('string');
    expect(fp.nBits).toBeGreaterThan(0);
  });

  it('getMorganFp with options', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMorganFp({ radius: 3 });
    expect(fp.toString()).toBeTypeOf('string');
    expect(fp.nBits).toBeGreaterThan(0);
  });

  it('getPatternFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getPatternFp();
    expect(fp.toString()).toBeTypeOf('string');
    expect(fp.nBits).toBeGreaterThan(0);
  });

  it('getTopologicalTorsionFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getTopologicalTorsionFp();
    expect(fp.toString()).toBeTypeOf('string');
    expect(fp.nBits).toBeGreaterThan(0);
  });

  it('getRdkitFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getRdkitFp();
    expect(fp.toString()).toBeTypeOf('string');
    expect(fp.nBits).toBeGreaterThan(0);
  });

  it('getAtomPairFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getAtomPairFp();
    expect(fp.toString()).toBeTypeOf('string');
    expect(fp.nBits).toBeGreaterThan(0);
  });

  it('getMaccsFp returns fingerprint string', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const fp = mol.getMaccsFp();
    expect(fp.toString()).toBeTypeOf('string');
    expect(fp.nBits).toBeGreaterThan(0);
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

  it('getProp returns a plain string when value is not JSON', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.setProp('name', 'benzene');
    expect(mol.getProp('name')).toBe('benzene');
  });
});

describe('Mol - molecule info', () => {
  it('getNumAtoms returns atom count', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.numAtoms).toBe(6);
  });

  it('getNumBonds returns bond count', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    expect(mol.numBonds).toBe(6);
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
    expect(mol.numAtoms).toBe(12);
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
    expect(mol.numAtoms).toBe(12);
    mol.removeHsInPlace();
    expect(mol.numAtoms).toBe(6);
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
    expect(result).toEqual({
      atoms: [0, 1, 2, 3, 4, 5, 6],
      bonds: [0, 1, 2, 3, 4, 5, 8],
    });
  });

  it('condenseAbbreviations with options', () => {
    using mol = rdkit.getMol('c1ccccc1C(=O)O')!;
    const result = mol.condenseAbbreviations({
      maxCoverage: 0.4,
      useLinkers: true,
    });
    expect(result).toEqual({
      atoms: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      bonds: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    });
  });
});

describe('Mol - fragments', () => {
  it('getFrags returns fragment mappings and MolArray', () => {
    using mol = rdkit.getMol('c1ccccc1.CC')!;
    const { mappings, mols } = mol.getFrags();
    expect(mappings.atomToFrag).toBeInstanceOf(Array);
    expect(mappings.atomToFrag.length).toBe(mol.numAtoms);
    expect(mappings.fragToAtoms).toBeInstanceOf(Array);
    expect(mappings.fragToAtoms.length).toBe(2);
    expect(mols.length).toBe(2);
    mols.delete();
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

describe('Mol - property map', () => {
  it('getPropMap returns a Map with parsed values', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const map = mol.getPropMap();
    expect(map).toBeInstanceOf(Map);
    expect(map.get('numArom')).toBe(1);
  });

  it('getPropMap with options includes custom props', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    mol.setProp('name', 'benzene');
    const map = mol.getPropMap({
      includePrivate: true,
      includeComputed: true,
    });
    expect(map).toBeInstanceOf(Map);
    expect(map.has('name')).toBe(true);
    expect(map.get('name')).toBe('benzene');
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
      expect(mol.isDeleted).toBe(false);
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
