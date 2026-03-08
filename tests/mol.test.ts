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
    using mol = rdkit.getMol('c1ccccc1')!;
    const inchi = mol.getInchi();
    expect(inchi).toMatch(/^InChI=/);
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
    expect(match.atoms).toBeInstanceOf(Array);
    expect(match.bonds).toBeInstanceOf(Array);
    expect(match.atoms.length).toBe(6);
  });

  it('getSubstructMatch with SMARTS string', () => {
    using mol = rdkit.getMol('c1ccc(O)cc1')!;
    const match = mol.getSubstructMatch('[OH]');
    expect(match.atoms).toBeInstanceOf(Array);
    expect(match.atoms.length).toBeGreaterThan(0);
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
