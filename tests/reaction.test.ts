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

// ─────────────────────────────────────────────────────────────────────────────
// test_rxn_drawing
// ─────────────────────────────────────────────────────────────────────────────

const RXN_SMARTS_SIMPLE = '[CH3:1][OH:2]>>[CH2:1]=[OH0:2]';

const RXN_BLOCK = `$RXN

      RDKit

  1  1
$MOL

     RDKit          2D

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  1  0  0
    1.2990    0.7500    0.0000 O   0  0  0  0  0  0  0  0  0  2  0  0
  1  2  6  0
V    1 [C&H3:1]
V    2 [O&H1:2]
M  END
$MOL

     RDKit          2D

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  1  0  0
    1.2990    0.7500    0.0000 O   0  0  0  0  0  0  0  0  0  2  0  0
  1  2  2  0
V    1 [C&H2:1]
V    2 [O&H0:2]
M  END`;

const RXN_SMILES_COMPLEX =
  '[cH:5]1[cH:6][c:7]2[cH:8][n:9][cH:10][cH:11][c:12]2[c:3]([cH:4]1)[C:2](=[O:1])O.' +
  '[N-:13]=[N+:14]=[N-:15]>C(Cl)Cl.C(=O)(C(=O)Cl)Cl>' +
  '[cH:5]1[cH:6][c:7]2[cH:8][n:9][cH:10][cH:11][c:12]2[c:3]([cH:4]1)[C:2](=[O:1])[N:13]=[N+:14]=[N-:15]';

describe('test_rxn_drawing', () => {
  it('SMARTS reaction SVG has the same path count as RXN block SVG', () => {
    using rxn = rdkit.getRxn(RXN_SMARTS_SIMPLE)!;
    using rxnFromBlock = rdkit.getRxn(RXN_BLOCK)!;
    const svg = rxn.getSVG();
    const svgFromBlock = rxnFromBlock.getSVG();
    expect(svg).toContain('svg');
    expect(svgFromBlock).toContain('svg');
    const pathCount = svg.match(/<path/g)!.length;
    expect(pathCount).toBeGreaterThan(0);
    expect(svgFromBlock.match(/<path/g)!.length).toBe(pathCount);
  });

  it('default SVG has no stroke-dasharray (kekulized)', () => {
    using rxn = rdkit.getRxn(RXN_SMILES_COMPLEX, { useSmiles: true })!;
    const svg = rxn.getSVG();
    expect(svg).toContain('svg');
    expect(svg).not.toContain('stroke-dasharray');
    expect(svg).not.toContain('ellipse');
  });

  it('SVG with kekulize:false adds stroke-dasharray (aromatic bonds)', () => {
    using rxn = rdkit.getRxn(RXN_SMILES_COMPLEX, { useSmiles: true })!;
    const svg = rxn.getSVG({ kekulize: false });
    expect(svg).toContain('svg');
    expect(svg).toContain('stroke-dasharray');
    expect(svg).not.toContain('ellipse');
  });

  it('SVG with highlightByReactant:true adds ellipse markers', () => {
    using rxn = rdkit.getRxn(RXN_SMILES_COMPLEX, { useSmiles: true })!;
    const svg = rxn.getSVG({ highlightByReactant: true });
    expect(svg).toContain('svg');
    expect(svg).toContain('ellipse');
    // no custom colors → no specific hex colors
    expect(svg).not.toContain('#BCD6ED');
    expect(svg).not.toContain('#A8D08D');
  });

  it('SVG with highlightColorsReactants does not add ellipse without highlightByReactant', () => {
    using rxn = rdkit.getRxn(RXN_SMILES_COMPLEX, { useSmiles: true })!;
    const svg = rxn.getSVG({
      highlightColorsReactants: [
        [0.741, 0.843, 0.933],
        [0.659, 0.816, 0.553],
      ],
    });
    expect(svg).toContain('svg');
    expect(svg).not.toContain('ellipse');
  });

  it('SVG with highlightByReactant + highlightColorsReactants uses specified colors', () => {
    using rxn = rdkit.getRxn(RXN_SMILES_COMPLEX, { useSmiles: true })!;
    const svg = rxn.getSVG({
      highlightByReactant: true,
      highlightColorsReactants: [
        [0.741, 0.843, 0.933],
        [0.659, 0.816, 0.553],
      ],
    });
    expect(svg).toContain('svg');
    expect(svg).toContain('ellipse');
    expect(svg).toContain('#BCD6ED');
    expect(svg).toContain('#A8D08D');
  });

  it('reaction from non-kekulizable SMARTS produces aromatic form or throws', () => {
    using rxn = rdkit.getRxn(RXN_SMILES_COMPLEX)!;
    let isAromatic = false;
    const svg = rxn.getSVG();
    isAromatic = svg.includes('stroke-dasharray');

    expect(isAromatic).toBe(true);
  });
});
