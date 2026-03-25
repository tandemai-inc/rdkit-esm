import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('getRxn', () => {
  it('creates a Reaction from reaction SMARTS', () => {
    using rxn = rdkit.getRxn('[CH3:1][OH:2]>>[CH2:1]=[OH0:2]')!;
    expect(rxn).not.toBeNull();
  });

  it('returns null for invalid reaction', () => {
    using rxn = rdkit.getRxn('Z>>C');
    expect(rxn).toBeNull();
  });

  it('applies options correctly', () => {
    using rxn = rdkit.getRxn('Brc1ccccc1.OB(O)c1ccccc1>>c1ccccc1c2ccccc2', { useSmiles: true })!;
    expect(rxn).not.toBeNull();
    const svgFromSmiles = rxn.getSVG();

    using rxn2 = rdkit.getRxn('Brc1ccccc1.OB(O)c1ccccc1>>c1ccccc1c2ccccc2', { useSmiles: false })!;
    expect(rxn2).not.toBeNull();
    const svgFromSmarts = rxn2.getSVG();

    expect(svgFromSmiles).not.toBe(svgFromSmarts);
  });
});

describe('Reaction - runReactants', () => {
  it('runs a reaction with string array reactants', () => {
    using rxn = rdkit.getRxn('[#6:1][O:2]>>[#6:1]=[O:2]')!;
    const products = rxn.runReactants(['CC(C)O']);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].length).toBeGreaterThan(0);
    const smiles = products[0][0].getSmiles();
    expect(smiles).toBe('CC(C)=O');
    for (const set of products) {
      for (const mol of set) {
        mol.delete();
      }
    }
  });

  it('runs a reaction with Mol[] reactants', () => {
    using rxn = rdkit.getRxn('[#6:1][O:2]>>[#6:1]=[O:2]')!;
    using reactant = rdkit.getMol('CC(C)O')!;
    const products = rxn.runReactants([reactant]);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0][0].getSmiles()).toBe('CC(C)=O');
    for (const set of products) {
      set.delete();
    }
  });

  it('returns multiple product sets for multiple matches', () => {
    using rxn = rdkit.getRxn('[OH:1]>>[NH2:1]')!;
    const products = rxn.runReactants(['c1ccc(O)cc1O']);
    expect(products.length).toBeGreaterThan(1);
    for (const set of products) {
      set.delete();
    }
  });

  it('respects maxProducts parameter', () => {
    using rxn = rdkit.getRxn('[OH:1]>>[NH2:1]')!;
    const products = rxn.runReactants(['c1ccc(O)cc1O'], 1);
    expect(products.length).toBe(1);
    for (const set of products) {
      set.delete();
    }
  });
});

describe('Reaction - getSVG', () => {
  it('returns SVG string with defaults', () => {
    using rxn = rdkit.getRxn('[CH3:1][OH:2]>>[CH2:1]=[OH0:2]')!;
    const svg = rxn.getSVG();
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('returns SVG with highlight options', () => {
    using rxn = rdkit.getRxn('[CH3:1][OH:2]>>[CH2:1]=[OH0:2]')!;
    const svg = rxn.getSVG({ highlightByReactant: true });
    expect(svg).toContain('<svg');
  });
});

describe('Reaction - lifecycle', () => {
  it('delete() frees the reaction', () => {
    const rxn = rdkit.getRxn('[CH3:1][OH:2]>>[CH2:1]=[OH0:2]')!;
    rxn.delete();
    expect(() => rxn.jsReaction).toThrow('Reaction has been deleted');
  });

  it('using keyword disposes the reaction', () => {
    let rxnRef: ReturnType<typeof rdkit.getRxn> = null;
    {
      using rxn = rdkit.getRxn('[CH3:1][OH:2]>>[CH2:1]=[OH0:2]')!;
      rxnRef = rxn;
      expect(rxn.getSVG()).toContain('<svg');
    }
    expect(() => rxnRef!.jsReaction).toThrow('Reaction has been deleted');
  });
});
