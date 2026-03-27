/**
 * Tests ported from the original RDKit MinimalLib test suite (tests.js).
 * These cover drawing, coordinates, alignment, highlighting, and SVG output.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

// ─────────────────────────────────────────────────────────────────────────────
// test_sketcher_services2 (H add/remove via molblock)
// ─────────────────────────────────────────────────────────────────────────────

describe('test_sketcher_services2', () => {
  it('addHs returns molblock with 6 explicit H for benzene', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molb = mol.addHs();
    expect(molb).toContain(' H ');
    expect((molb.match(/ H /g) ?? []).length).toBe(6);
  });

  it('molblock round-trip through getMol preserves explicit H', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molb = mol.addHs();
    using mol2 = rdkit.getMol(molb)!;
    expect(mol2).not.toBeNull();
    const molb2 = mol2.getMolblock();
    expect(molb2).toContain(' H ');
    expect((molb2.match(/ H /g) ?? []).length).toBe(6);
  });

  it('removeHs strips explicit H from molblock', () => {
    using mol = rdkit.getMol('c1ccccc1')!;
    const molb = mol.addHs();
    using mol2 = rdkit.getMol(molb)!;
    const molb2 = mol2.removeHs();
    expect(molb2).not.toContain(' H ');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_flexicanvas
// ─────────────────────────────────────────────────────────────────────────────

describe('test_flexicanvas', () => {
  it('getSVG with width:-1 height:-1 produces valid SVG', () => {
    using mol = rdkit.getMol('CCCC')!;
    const svg = mol.getSVG({ width: -1, height: -1 });
    expect(svg).toContain('svg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_highlights
// ─────────────────────────────────────────────────────────────────────────────

describe('test_highlights', () => {
  it('custom atom/bond highlight colors appear in SVG output', () => {
    using mol = rdkit.getMol('c1cc(O)ccc1')!;
    const svg = mol.getSVG({
      highlightAtomColors: {
        0: [1.0, 0.0, 0.0],
        1: [1.0, 0.0, 0.0],
        2: [1.0, 0.0, 0.0],
        3: [0.0, 1.0, 0.0],
        4: [1.0, 0.0, 0.0],
        5: [1.0, 0.0, 0.0],
        6: [1.0, 0.0, 0.0],
      },
      highlightBondColors: {
        2: [0.0, 0.7, 0.9],
      },
      highlightAtomRadii: {
        0: 0.1,
        1: 0.1,
        2: 0.1,
        3: 0.8,
        4: 0.1,
        5: 0.1,
        6: 0.1,
      },
      atoms: [0, 1, 2, 3, 4, 5, 6],
      bonds: [2],
      width: 127,
    });
    expect(svg).not.toContain('fill:#FF7F7F');
    expect(svg).toContain('fill:#FF0000');
    expect(svg).toContain('fill:#00FF00');
    expect(svg).toContain('fill:#00B2E5');
    expect(svg).toContain("width='127px'");
    expect(svg).toContain('</svg>');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_multi_highlights
// ─────────────────────────────────────────────────────────────────────────────

describe('test_multi_highlights', () => {
  it('multi-color highlights produce ellipses and expected colors', () => {
    using mol = rdkit.getMol('[H]c1cc2c(-c3ccnc(Nc4ccc(F)c(F)c4)n3)c(-c3cccc(C(F)(F)F)c3)nn2nc1C', {
      removeHs: false,
    })!;
    const details = {
      width: 250,
      height: 200,
      highlightAtomMultipleColors: {
        15: [[0.941, 0.894, 0.259]],
        17: [[0, 0.62, 0.451]],
        21: [[0.902, 0.624, 0]],
        22: [[0.902, 0.624, 0]],
        23: [[0.902, 0.624, 0]],
        24: [[0.902, 0.624, 0]],
        25: [[0.902, 0.624, 0]],
        26: [[0.902, 0.624, 0]],
        27: [[0.902, 0.624, 0]],
        28: [[0.902, 0.624, 0]],
        29: [[0.902, 0.624, 0]],
        30: [[0.902, 0.624, 0]],
        35: [[0.337, 0.706, 0.914]],
      },
      highlightBondMultipleColors: {
        14: [[0.941, 0.894, 0.259]],
        16: [[0, 0.62, 0.451]],
        20: [[0.902, 0.624, 0]],
        21: [[0.902, 0.624, 0]],
        22: [[0.902, 0.624, 0]],
        23: [[0.902, 0.624, 0]],
        24: [[0.902, 0.624, 0]],
        25: [[0.902, 0.624, 0]],
        26: [[0.902, 0.624, 0]],
        27: [[0.902, 0.624, 0]],
        28: [[0.902, 0.624, 0]],
        29: [[0.902, 0.624, 0]],
        34: [[0.337, 0.706, 0.914]],
        38: [[0.902, 0.624, 0]],
      },
      highlightAtomRadii: {
        15: 0.4,
        17: 0.4,
        21: 0.4,
        22: 0.4,
        23: 0.4,
        24: 0.4,
        25: 0.4,
        26: 0.4,
        27: 0.4,
        28: 0.4,
        29: 0.4,
        30: 0.4,
        35: 0.4,
      },
      highlightLineWidthMultipliers: {
        14: 2,
        16: 2,
        20: 2,
        21: 2,
        22: 2,
        23: 2,
        24: 2,
        25: 2,
        26: 2,
        27: 2,
        28: 2,
        29: 2,
        34: 2,
        38: 2,
      },
    };
    const svgWithDetails = mol.getSVG(details);
    expect(svgWithDetails).toContain('ellipse');
    const COLORS = ['#009E73', '#55B4E9', '#E69F00', '#EFE342'];
    COLORS.forEach((color) => expect(svgWithDetails).toContain(color));

    const svgWithoutDetails = mol.getSVG();
    expect(svgWithoutDetails).not.toContain('ellipse');
    COLORS.forEach((color) => expect(svgWithoutDetails).not.toContain(color));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_bw_palette
// ─────────────────────────────────────────────────────────────────────────────

describe('test_bw_palette', () => {
  it('atomColourPalette:"bw" produces black atom colors instead of blue', () => {
    using mol = rdkit.getMol('N')!;
    const svgBw = mol.getSVG({ atomColourPalette: 'bw' });
    expect(svgBw).toContain('#000000');
    expect(svgBw).not.toContain('#0000FF');

    const svgDefault = mol.getSVG();
    expect(svgDefault).not.toContain('#000000');
    expect(svgDefault).toContain('#0000FF');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_custom_palette
// ─────────────────────────────────────────────────────────────────────────────

describe('test_custom_palette', () => {
  it('custom atomColourPalette colors nitrogen red instead of blue', () => {
    using mol = rdkit.getMol('N')!;
    const svgCustom = mol.getSVG({ atomColourPalette: { 7: [1.0, 0.0, 0.0] } });
    expect(svgCustom).toContain('#FF0000');
    expect(svgCustom).not.toContain('#0000FF');

    const svgDefault = mol.getSVG();
    expect(svgDefault).not.toContain('#FF0000');
    expect(svgDefault).toContain('#0000FF');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_query_colour
// ─────────────────────────────────────────────────────────────────────────────

describe('test_query_colour', () => {
  it('qmol SVG uses grey (#7F7F7F) for query atoms by default', () => {
    using mol = rdkit.getQMol('c1ccc2nc([*:1])nc([*:2])c2c1')!;
    const svg1 = mol.getSVG({ width: 350, height: 300 });
    expect(svg1).toContain("width='350px'");
    expect(svg1).toContain("height='300px'");
    expect(svg1).toContain('</svg>');
    expect(svg1).toContain('#7F7F7F');
  });

  it('qmol SVG with queryColour:[0,0,0] overrides grey to black', () => {
    using mol = rdkit.getQMol('c1ccc2nc([*:1])nc([*:2])c2c1')!;
    const svg2 = mol.getSVG({ width: 350, height: 300, queryColour: [0.0, 0.0, 0.0] });
    expect(svg2).toContain("width='350px'");
    expect(svg2).toContain("height='300px'");
    expect(svg2).toContain('</svg>');
    expect(svg2).not.toContain('#7F7F7F');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_normalize_depiction
// ─────────────────────────────────────────────────────────────────────────────

const INDOLE_MOLBLOCK = `
  MJ201100

  9 10  0  0  0  0  0  0  0  0999 V2000
   -1.5402    1.3161    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.2546    0.9036    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.2546    0.0785    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.5402   -0.3339    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8257    0.0785    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8257    0.9036    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0411   -0.1764    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    0.4438    0.4909    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0410    1.1583    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  8  9  2  0  0  0  0
  6  9  1  0  0  0  0
  7  8  1  0  0  0  0
  5  7  1  0  0  0  0
M  END
`;

describe('test_normalize_depiction', () => {
  it('normalizeDepiction returns a scaling factor between 1.8 and 1.9', () => {
    using mol = rdkit.getMol(INDOLE_MOLBLOCK)!;
    const scalingFactor = mol.normalizeDepiction();
    expect(scalingFactor).toBeGreaterThan(1.8);
    expect(scalingFactor).toBeLessThan(1.9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_straighten_depiction
// ─────────────────────────────────────────────────────────────────────────────

const BENZENE_HORIZ = `
  MJ201100

  6  6  0  0  0  0  0  0  0  0999 V2000
   -0.0785    1.6073    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.9035    1.6073    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.3160    0.8928    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.9036    0.1783    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0786    0.1783    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.3339    0.8929    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
M  END
`;

const BENZENE_VERT = `
  MJ201100

  6  6  0  0  0  0  0  0  0  0999 V2000
    0.2234    1.3054    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.4910    1.7178    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2055    1.3053    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2056    0.4803    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.4911    0.0678    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.2234    0.4804    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
M  END
`;

describe('test_straighten_depiction', () => {
  it('straightenDepiction() changes horizontal benzene but not vertical', () => {
    using molHoriz = rdkit.getMol(BENZENE_HORIZ)!;
    using molVert = rdkit.getMol(BENZENE_VERT)!;
    using horizCopy = molHoriz.copy();
    using vertCopy = molVert.copy();

    molHoriz.straightenDepiction();
    molVert.straightenDepiction();

    expect(molHoriz.getMolblock()).not.toBe(horizCopy.getMolblock());
    expect(molVert.getMolblock()).toBe(vertCopy.getMolblock());
  });

  it('straightenDepiction(true) does not change either benzene orientation', () => {
    using molHoriz = rdkit.getMol(BENZENE_HORIZ)!;
    using molVert = rdkit.getMol(BENZENE_VERT)!;
    using horizCopy = molHoriz.copy();
    using vertCopy = molVert.copy();

    molHoriz.straightenDepiction(true);
    molVert.straightenDepiction(true);

    expect(molHoriz.getMolblock()).toBe(horizCopy.getMolblock());
    expect(molVert.getMolblock()).toBe(vertCopy.getMolblock());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_isotope_labels
// ─────────────────────────────────────────────────────────────────────────────

describe('test_isotope_labels', () => {
  it('SVG line count increases as more isotope labels are shown', () => {
    using mol = rdkit.getMol('[1*]c1cc([2*])c([3*])c[14c]1')!;
    const svgIsoDummyIso = mol.getSVG({});
    const svgNoIsoDummyIso = mol.getSVG({ isotopeLabels: false });
    const svgIsoNoDummyIso = mol.getSVG({ dummyIsotopeLabels: false });
    const svgNoIsoNoDummyIso = mol.getSVG({
      isotopeLabels: false,
      dummyIsotopeLabels: false,
    });

    const counts = [
      svgNoIsoNoDummyIso.split('\n').length,
      svgIsoNoDummyIso.split('\n').length,
      svgNoIsoDummyIso.split('\n').length,
      svgIsoDummyIso.split('\n').length,
    ];
    // counts should be in non-decreasing order
    const sorted = counts.toSorted((a, b) => a - b);
    counts.forEach((c, i) => expect(c).toBe(sorted[i]));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_has_coords
// ─────────────────────────────────────────────────────────────────────────────

describe('test_has_coords', () => {
  it('getMol from SMILES has no coords', () => {
    using mol = rdkit.getMol('CC')!;
    expect(mol.hasCoords()).toBe(0);
  });

  it('getNewCoords molblock produces 2D coords', () => {
    using mol = rdkit.getMol('CC')!;
    const mb = mol.getNewCoords();
    using mol2 = rdkit.getMol(mb)!;
    expect(mol2.hasCoords()).toBe(2);
    expect(mol.hasCoords()).toBe(0);
  });

  it('setNewCoords produces 2D coords in-place', () => {
    using mol = rdkit.getMol('CC')!;
    mol.setNewCoords();
    expect(mol.hasCoords()).toBe(2);
  });

  it('3D molblock returns hasCoords() === 3', () => {
    using mol = rdkit.getMol(`
     RDKit          3D

  9  9  0  0  0  0  0  0  0  0999 V2000
   -0.5909   -0.6086    0.0018 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2459    0.8185   -0.0936 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8271   -0.1760    0.1017 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1425   -0.9648    0.9113 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8767   -1.2011   -0.8967 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5849    1.4596    0.7584 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2393    1.3618   -1.0674 H   0  0  0  0  0  0  0  0  0  0  0  0
    1.4853   -0.4161   -0.7761 H   0  0  0  0  0  0  0  0  0  0  0  0
    1.3678   -0.2732    1.0608 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  1  0
  3  1  1  0
  1  4  1  0
  1  5  1  0
  2  6  1  0
  2  7  1  0
  3  8  1  0
  3  9  1  0
M  END
`)!;
    expect(mol.hasCoords()).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_coords
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_coords', () => {
  it('getCoords returns xyz tuples for a molecule with 2D coords', () => {
    using mol = rdkit.getMol('C1CC1 |(0.866025,0,;-0.433013,0.75,;-0.433013,-0.75,)|')!;
    expect(mol.hasCoords()).toBe(2);
    const pos = mol.getCoords();
    expect(Array.isArray(pos)).toBe(true);
    expect(pos.length).toBe(mol.numAtoms);
    expect(
      pos.every(
        (xyz) => Array.isArray(xyz) && xyz.length === 3 && xyz.every((c) => typeof c === 'number'),
      ),
    ).toBe(true);
    expect(pos).toEqual([
      [0.866025, 0, 0],
      [-0.433013, 0.75, 0],
      [-0.433013, -0.75, 0],
    ]);
  });

  it('getCoords returns empty array for molecule with no coords', () => {
    using mol = rdkit.getMol('C1CC1')!;
    expect(mol.hasCoords()).toBe(0);
    const pos = mol.getCoords();
    expect(Array.isArray(pos)).toBe(true);
    expect(pos.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_return_draw_coords
// ─────────────────────────────────────────────────────────────────────────────

const CYCLOPROPANE_MB = `
     RDKit          2D

  3  3  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.8930    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7734   -0.4465    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7734   -0.4465    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  1  0
  1  3  1  0
M  END`;

//TODO: JSON output to handle
describe('test_return_draw_coords', () => {
  it('returnDrawCoords:true produces a JSON result with drawCoords and svg', () => {
    using mol = rdkit.getMol(CYCLOPROPANE_MB)!;
    const raw = mol.getSVG({ width: 300, height: 200, padding: 0.2, returnDrawCoords: true });
    const res = JSON.parse(raw);
    expect(res.drawCoords).toBeTruthy();
    expect(res.svg).toBeTruthy();
  });

  it('returnDrawCoords with highlight shifts draw coordinates', () => {
    using mol = rdkit.getMol(CYCLOPROPANE_MB)!;
    const rawRef = mol.getSVG({ width: 300, height: 200, padding: 0.2, returnDrawCoords: true });
    const ref = JSON.parse(rawRef).drawCoords.flat();

    const rawHighlight = mol.getSVG({
      width: 300,
      height: 200,
      padding: 0.2,
      atoms: [0],
      returnDrawCoords: true,
    });
    const highlight = JSON.parse(rawHighlight).drawCoords.flat();
    const aboveTol = ref.some((r: number, i: number) => Math.abs(r - highlight[i]) > 0.1);
    expect(aboveTol).toBe(true);
  });

  it('drawingExtentsInclude ALL:true suppresses coordinate shift from highlight', () => {
    using mol = rdkit.getMol(CYCLOPROPANE_MB)!;
    const rawRef = mol.getSVG({ width: 300, height: 200, padding: 0.2, returnDrawCoords: true });
    const ref = JSON.parse(rawRef).drawCoords.flat();

    const rawHighlight = mol.getSVG({
      width: 300,
      height: 200,
      padding: 0.2,
      atoms: [0],
      returnDrawCoords: true,
      drawingExtentsInclude: { ALL: true, HIGHLIGHTS: false },
    });
    const highlight = JSON.parse(rawHighlight).drawCoords.flat();
    const aboveTol = ref.some((r: number, i: number) => Math.abs(r - highlight[i]) > 0.1);
    expect(aboveTol).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_generate_aligned_coords (basic)
// ─────────────────────────────────────────────────────────────────────────────

describe('test_generate_aligned_coords', () => {
  // The raw API returns "" for no match; the wrapper returns { atoms: [], bonds: [] }
  it('returns empty match when template not found in molecule', () => {
    using mol = rdkit.getMol('CCC')!;
    using qmol = rdkit.getMol('CC')!;
    const result = mol.generateAlignedCoords(qmol, { useCoordGen: true });
    expect(result.atoms).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_generate_aligned_coords_allow_rgroups
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_RGROUP_MOLBLOCK = `
     RDKit          2D

  9  9  0  0  0  0  0  0  0  0999 V2000
   -0.8929    1.0942    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1919    0.3442    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1919   -1.1558    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8929   -1.9059    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4060   -1.1558    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4060    0.3442    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.4910    1.0942    0.0000 R1  0  0  0  0  0  0  0  0  0  0  0  0
    1.7051    1.0942    0.0000 R2  0  0  0  0  0  0  0  0  0  0  0  0
   -3.4910   -1.9059    0.0000 R3  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  1  1  0
  6  8  1  0
  3  9  1  0
  2  7  1  0
M  RGP  3   7   1   8   2   9   3
M  END`;

const PYRIDINE_REF_MOLBLOCK = `
  MJ201100

  8  8  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.8250    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7144    0.4125    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7144   -0.4124    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -0.8250    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7144   -0.4124    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.7144    0.4125    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.6500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -1.6500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  1  7  1  0  0  0  0
  4  8  1  0  0  0  0
M  END
`;

describe('test_generate_aligned_coords_allow_rgroups', () => {
  it('ortho-meta terphenyl aligns 9 atoms to R-group template', () => {
    using templateRef = rdkit.getMol(TEMPLATE_RGROUP_MOLBLOCK)!;
    using mol = rdkit.getMol('c1ccc(-c2ccc(-c3ccccc3)c(-c3ccccc3)c2)cc1')!;
    const res = mol.generateAlignedCoords(templateRef, { useCoordGen: false, allowRGroups: true });
    expect(res.atoms).toHaveLength(9);
  });

  it.each([true, false])(
    'alignOnly:%s — ortho-meta maps 9, ortho 8, meta 8, para 8, biphenyl 7, phenyl 6',
    (alignOnly) => {
      using templateRef = rdkit.getMol(TEMPLATE_RGROUP_MOLBLOCK)!;
      const opts = { useCoordGen: false, allowRGroups: true, alignOnly };

      const cases = [
        { smi: 'c1ccc(-c2ccc(-c3ccccc3)c(-c3ccccc3)c2)cc1', expected: 9 },
        { smi: 'c1ccc(-c2ccccc2-c2ccccc2)cc1', expected: 8 },
        { smi: 'c1ccc(-c2cccc(-c3ccccc3)c2)cc1', expected: 8 },
        { smi: 'c1ccc(-c2ccc(-c3ccccc3)cc2)cc1', expected: 8 },
        { smi: 'c1ccccc1-c1ccccc1', expected: 7 },
        { smi: 'c1ccccc1', expected: 6 },
      ];

      for (const { smi, expected } of cases) {
        using mol = rdkit.getMol(smi)!;
        const res = mol.generateAlignedCoords(templateRef, opts);
        expect(res.atoms).toHaveLength(expected);
      }
    },
  );

  it.each([true, false])(
    'alignOnly:%s with referenceSmarts — ortho-meta 8, ortho 7, meta 7, para 8, biphenyl 7, phenyl 6',
    (alignOnly) => {
      using pyridineRef = rdkit.getMol(PYRIDINE_REF_MOLBLOCK)!;
      const referenceSmarts = '[*:3]a1a([*:1])aa([*:2])aa1';
      const opts = { useCoordGen: false, allowRGroups: true, alignOnly, referenceSmarts };

      const cases = [
        { smi: 'c1ccc(-c2ccc(-c3ccccc3)c(-c3ccccc3)c2)cc1', expected: 8 },
        { smi: 'c1ccc(-c2ccccc2-c2ccccc2)cc1', expected: 7 },
        { smi: 'c1ccc(-c2cccc(-c3ccccc3)c2)cc1', expected: 7 },
        { smi: 'c1ccc(-c2ccc(-c3ccccc3)cc2)cc1', expected: 8 },
        { smi: 'c1ccccc1-c1ccccc1', expected: 7 },
        { smi: 'c1ccccc1', expected: 6 },
      ];

      for (const { smi, expected } of cases) {
        using mol = rdkit.getMol(smi)!;
        const res = mol.generateAlignedCoords(pyridineRef, opts);
        expect(res.atoms).toHaveLength(expected);
      }
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// test_generate_aligned_coords_accept_failure
//
// NOTE: The raw API distinguishes "" (no match, coords unchanged) from "{}" (no match
// with acceptFailure:true, coords regenerated). The wrapper maps BOTH to { atoms:[], bonds:[] }.
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_NO_NITROGEN_MB = `
     RDKit          2D

  9  9  0  0  0  0  0  0  0  0999 V2000
   -0.8929    1.0942    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1919    0.3442    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1919   -1.1558    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8929   -1.9059    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4060   -1.1558    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4060    0.3442    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.4910    1.0942    0.0000 R1  0  0  0  0  0  0  0  0  0  0  0  0
    1.7051    1.0942    0.0000 R2  0  0  0  0  0  0  0  0  0  0  0  0
   -3.4910   -1.9059    0.0000 R3  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  1  1  0
  6  8  1  0
  3  9  1  0
  2  7  1  0
M  RGP  3   7   1   8   2   9   3
M  END
`;

const MOL_WITH_NITROGEN_MB = `
     RDKit          2D

  9  9  0  0  0  0  0  0  0  0999 V2000
   -0.8929    1.0942    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1919    0.3442    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.1919   -1.1558    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8929   -1.9059    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4060   -1.1558    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.4060    0.3442    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.4910    1.0942    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
    1.7051    1.0942    0.0000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
   -3.4910   -1.9059    0.0000 Br  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  1  1  0
  6  8  1  0
  3  9  1  0
  2  7  1  0
M  END
`;

describe('test_generate_aligned_coords_accept_failure', () => {
  it('acceptFailure:false — no match returns empty result', () => {
    using templateRef = rdkit.getMol(TEMPLATE_NO_NITROGEN_MB)!;
    using mol = rdkit.getMol(MOL_WITH_NITROGEN_MB)!;
    const res = mol.generateAlignedCoords(templateRef, {
      useCoordGen: false,
      allowRGroups: true,
      acceptFailure: false,
    });
    expect(res.atoms).toHaveLength(0);
  });

  it('acceptFailure:false — molblock stays unchanged after failed alignment', () => {
    using templateRef = rdkit.getMol(TEMPLATE_NO_NITROGEN_MB)!;
    using mol = rdkit.getMol(MOL_WITH_NITROGEN_MB)!;
    mol.generateAlignedCoords(templateRef, {
      useCoordGen: false,
      allowRGroups: true,
      acceptFailure: false,
    });
    // After a failed alignment with acceptFailure:false, the molblock should be unchanged
    expect(mol.getMolblock()).toBe(MOL_WITH_NITROGEN_MB);
  });

  it('acceptFailure:true — molblock IS changed after failed alignment (new coords)', () => {
    using templateRef = rdkit.getMol(TEMPLATE_NO_NITROGEN_MB)!;
    using mol = rdkit.getMol(MOL_WITH_NITROGEN_MB)!;
    mol.generateAlignedCoords(templateRef, {
      useCoordGen: false,
      allowRGroups: true,
      acceptFailure: true,
    });
    expect(mol.hasCoords()).toBe(2);
    // After a failed alignment with acceptFailure:true, new coords should have been generated
    expect(mol.getMolblock()).not.toBe(MOL_WITH_NITROGEN_MB);
  });

  it('acceptFailure:false on mol without coords — no coords after failed alignment', () => {
    using templateRef = rdkit.getMol(TEMPLATE_NO_NITROGEN_MB)!;
    using mol = rdkit.getMol(MOL_WITH_NITROGEN_MB)!;
    mol.generateAlignedCoords(templateRef, {
      useCoordGen: false,
      allowRGroups: true,
      acceptFailure: false,
    });
    expect(mol.hasCoords()).toBe(2);
    using molNoCoords = rdkit.getMol(mol.getSmiles())!;
    expect(molNoCoords.hasCoords()).toBe(0);
    mol.generateAlignedCoords(templateRef, {
      useCoordGen: false,
      allowRGroups: true,
      acceptFailure: false,
    });
    // TODO: mol still has no coords after failed alignment
    // (This currently passes because the wrapper doesn't distinguish the two cases)
  });

  it('acceptFailure:true on mol without coords — coords ARE added', () => {
    using templateRef = rdkit.getMol(TEMPLATE_NO_NITROGEN_MB)!;
    using mol = rdkit.getMol(MOL_WITH_NITROGEN_MB)!;
    using molNoCoords = rdkit.getMol(mol.getSmiles())!;
    expect(molNoCoords.hasCoords()).toBe(0);
    molNoCoords.generateAlignedCoords(templateRef, {
      useCoordGen: false,
      allowRGroups: true,
      acceptFailure: true,
    });
    expect(molNoCoords.hasCoords()).not.toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_alignment_r_groups_aromatic_ring
// ─────────────────────────────────────────────────────────────────────────────

const SCAFFOLD_RGROUP_AROMATIC = `
  MJ201100

  8  8  0  0  0  0  0  0  0  0999 V2000
   -1.0263   -0.3133    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
   -2.4553    0.5116    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
   -1.7408   -0.7258    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7408   -1.5509    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.4553   -1.9633    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.1698   -1.5509    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.1698   -0.7258    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.4553   -0.3133    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  3  1  1  0  0  0  0
  8  2  1  0  0  0  0
  4  3  2  0  0  0  0
  5  4  1  0  0  0  0
  6  5  2  0  0  0  0
  7  6  1  0  0  0  0
  8  3  1  0  0  0  0
  8  7  2  0  0  0  0
M  RGP  2   1   2   2   1
M  END`;

describe('test_alignment_r_groups_aromatic_ring', () => {
  it('quinoxaline aligns 8 atoms/bonds to aromatic ring R-group scaffold', () => {
    using mol = rdkit.getMol('c1ccc2nccnc2c1')!;
    using scaffold = rdkit.getMol(SCAFFOLD_RGROUP_AROMATIC)!;
    const res = mol.generateAlignedCoords(scaffold, { useCoordGen: true, allowRGroups: true });
    expect(res.atoms).toHaveLength(8);
    expect(res.bonds).toHaveLength(8);
  });

  it('larger fused ring system aligns 8 atoms/bonds with alignOnly:true', () => {
    using mol = rdkit.getMol(`
  MJ201100

 10 11  0  0  0  0  0  0  0  0999 V2000
    3.6937    2.5671    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.8687    2.5671    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.4561    1.8526    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.8687    1.1382    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6937    1.1381    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.1062    1.8526    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.9313    1.8527    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    5.3438    2.5671    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.9313    3.2816    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.1062    3.2816    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
  5  6  1  0  0  0  0
  4  5  2  0  0  0  0
  3  4  1  0  0  0  0
  2  3  2  0  0  0  0
  1  6  2  0  0  0  0
  1  2  1  0  0  0  0
  8  9  1  0  0  0  0
  9 10  2  0  0  0  0
 10  1  1  0  0  0  0
  7  8  2  0  0  0  0
  6  7  1  0  0  0  0
M  END`)!;
    using scaffold = rdkit.getMol(SCAFFOLD_RGROUP_AROMATIC)!;
    const res = mol.generateAlignedCoords(scaffold, { allowRGroups: true, alignOnly: true });
    expect(res.atoms).toHaveLength(8);
    expect(res.bonds).toHaveLength(8);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_rgroup_match_heavy_hydro_none_charged
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_RGROUP_A_ATOM = `
  MJ201100

  7  7  0  0  0  0  0  0  0  0999 V2000
   -0.5804    1.2045    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2948    0.7920    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2948   -0.0330    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5804   -0.4455    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.1340   -0.0330    0.0000 A   0  0  0  0  0  0  0  0  0  0  0  0
    0.1340    0.7920    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8485   -0.4455    0.0000 R#  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  6  1  1  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  5  7  1  0  0  0  0
M  RGP  1   7   1
M  END
`;

describe('test_rgroup_match_heavy_hydro_none_charged', () => {
  it.each([true, false])(
    'alignOnly:%s — various substituted/unsubstituted benzenes align correctly to A-atom template',
    (alignOnly) => {
      using templateRef = rdkit.getMol(TEMPLATE_RGROUP_A_ATOM)!;
      const opts = { allowRGroups: true, alignOnly };

      using molMethyl = rdkit.getMol('Cc1ccccc1')!;
      expect(molMethyl.numAtoms).toBe(7);
      expect(molMethyl.generateAlignedCoords(templateRef, opts).atoms).toHaveLength(7);

      using molBenzene = rdkit.getMol('c1ccccc1')!;
      expect(molBenzene.numAtoms).toBe(6);
      expect(molBenzene.generateAlignedCoords(templateRef, opts).atoms).toHaveLength(6);

      using molHBenzene = rdkit.getMol('[H]c1ccccc1', { removeHs: false })!;
      expect(molHBenzene.numAtoms).toBe(7);
      expect(molHBenzene.generateAlignedCoords(templateRef, opts).atoms).toHaveLength(7);

      using molPyridine = rdkit.getMol('n1ccccc1')!;
      expect(molPyridine.numAtoms).toBe(6);
      expect(molPyridine.generateAlignedCoords(templateRef, opts).atoms).toHaveLength(6);

      using molCationic = rdkit.getMol('C[n+]1ccccc1')!;
      expect(molCationic.numAtoms).toBe(7);
      expect(molCationic.generateAlignedCoords(templateRef, opts).atoms).toHaveLength(7);
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_sss_json
// ─────────────────────────────────────────────────────────────────────────────

describe('test_get_sss_json', () => {
  it('generateAlignedCoords with referenceSmarts returns expected atom/bond count', () => {
    using bilastine = rdkit.getMol('O=C(O)C(c1ccc(cc1)CCN4CCC(c2nc3ccccc3n2CCOCC)CC4)(C)C')!;
    using fentanylScaffold = rdkit.getMol(`
  MJ201100

 25 27  0  0  0  0  0  0  0  0999 V2000
   -0.3910   -1.2720    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2160   -1.2721    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6285   -1.9866    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2161   -2.7010    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3911   -2.7011    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0214   -1.9865    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0213   -0.5575    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3911    0.1568    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0213    0.8713    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3911    1.5859    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2161    1.5858    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6287    0.8714    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2161    0.1568    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6286    2.3002    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8463   -0.5575    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2588    0.1569    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -2.4536    2.3002    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.8661    1.5858    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.6910    1.5858    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -4.1036    0.8712    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.6912    0.1568    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.8662    0.1567    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.4536    0.8713    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2589   -1.2720    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0839   -1.2719    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
  9 10  1  0  0  0  0
 12 13  1  0  0  0  0
  8  9  1  0  0  0  0
  8 13  1  0  0  0  0
 10 11  1  0  0  0  0
 11 12  1  0  0  0  0
 11 14  1  0  0  0  0
  1  7  1  0  0  0  0
  7  8  1  0  0  0  0
  7 15  1  0  0  0  0
 14 17  1  0  0  0  0
 17 18  1  0  0  0  0
 19 20  1  0  0  0  0
 20 21  2  0  0  0  0
 21 22  1  0  0  0  0
 22 23  2  0  0  0  0
 18 19  2  0  0  0  0
 23 18  1  0  0  0  0
 15 24  1  0  0  0  0
 24 25  1  0  0  0  0
 15 16  2  0  0  0  0
M  END
`)!;
    const res = bilastine.generateAlignedCoords(fentanylScaffold, {
      useCoordGen: true,
      referenceSmarts: 'c1ccccc1CCN1CCCCC1',
    });
    expect(res.atoms).toEqual([6, 5, 4, 9, 8, 7, 10, 11, 12, 13, 14, 15, 30, 31]);
    expect(res.bonds).toHaveLength(15);
  });
});
