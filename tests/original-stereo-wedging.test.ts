/**
 * Tests ported from the original RDKit MinimalLib test suite (tests.js).
 * These cover stereochemistry, CIP labeling, and wedging bond behavior.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

type Coord2D = [number, number];

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract bond start/end coords from an SVG string
// Looks for lines like: <path class='... atom-X atom-Y ...' d='M x1,y1 L x2,y2' .../>
// Returns [[x1, y1], [x2, y2]] as numbers
// ─────────────────────────────────────────────────────────────────────────────
function extractBondCoords(svg: string, bondDetail: string): [Coord2D, Coord2D] {
  const lines = svg.split('\n').filter((line) => line.includes(bondDetail));
  expect(lines.length).toBe(1);
  const m = lines[0].match(/^.*\s+d='M\s+([^,]+),([^ ]+)\s+L\s+([^,]+),([^ ]+)'.*$/)!;
  return [
    [Number(m[1]), Number(m[2])],
    [Number(m[3]), Number(m[4])],
  ];
}

function angleDegBetweenVectors(v1: Coord2D, v2: Coord2D): number {
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const mag = Math.sqrt((v1[0] ** 2 + v1[1] ** 2) * (v2[0] ** 2 + v2[1] ** 2));
  return (180 / Math.PI) * Math.acos(dot / mag);
}

// ─────────────────────────────────────────────────────────────────────────────
// test_sketcher_services
// ─────────────────────────────────────────────────────────────────────────────

describe('test_sketcher_services', () => {
  it('getStereoTags returns CIP labels for atoms and bonds', () => {
    using mol = rdkit.getMol('C[C@](F)(Cl)/C=C/C(F)Br')!;
    const tags = mol.getStereoTags();
    expect(tags.CIP_atoms).toEqual([
      [1, '(S)'],
      [6, '(?)'],
    ]);
    expect(tags.CIP_bonds).toEqual([[4, 5, '(E)']]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_legacy_stereochem
// ─────────────────────────────────────────────────────────────────────────────

describe('test_legacy_stereochem', () => {
  afterAll(() => {
    rdkit.configure({ useLegacyStereoPerception: false });
  });

  it('legacy stereo perception gives different SMILES than new perception', () => {
    rdkit.configure({ useLegacyStereoPerception: true });
    using mol1 = rdkit.getMol('O[C@@]1(C)C/C(/C1)=C(/C)\\CC')!;
    expect(mol1.getSmiles()).toBe('CCC(C)=C1CC(C)(O)C1');

    rdkit.configure({ useLegacyStereoPerception: false });
    using mol2 = rdkit.getMol('O[C@@]1(C)C/C(/C1)=C(/C)\\CC')!;
    expect(mol2.getSmiles()).toBe('CC/C(C)=C1\\C[C@](C)(O)C1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_allow_non_tetrahedral_chirality
// ─────────────────────────────────────────────────────────────────────────────

const NON_TETRAHEDRAL_CTAB = `
  Mrv2108 09132105183D

  5  4  0  0  0  0            999 V2000
   -1.2500    1.4518    0.0000 Pt  0  0  0  0  0  0  0  0  0  0  0  0
   -1.2500    2.2768    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
   -0.4250    1.4518    0.0000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
   -2.0750    1.4518    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
   -1.2500    0.6268    0.0000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
  1  4  1  0  0  0  0
  1  5  1  0  0  0  0
M  END
`;

describe('test_allow_non_tetrahedral_chirality', () => {
  afterAll(() => {
    rdkit.configure({ allowNonTetrahedralChirality: false });
  });

  it('allowNonTetrahedralChirality:true includes SP3 chirality in SMILES', () => {
    rdkit.configure({ allowNonTetrahedralChirality: true });
    using mol = rdkit.getMol(NON_TETRAHEDRAL_CTAB)!;
    expect(mol.getSmiles()).toBe('[F][Pt@SP3]([F])([Cl])[Cl]');
  });

  it('allowNonTetrahedralChirality:false omits SP3 chirality in SMILES', () => {
    rdkit.configure({ allowNonTetrahedralChirality: false });
    using mol = rdkit.getMol(NON_TETRAHEDRAL_CTAB)!;
    expect(mol.getSmiles()).toBe('[F][Pt]([F])([Cl])[Cl]');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_assign_cip_labels
// ─────────────────────────────────────────────────────────────────────────────

describe('test_assign_cip_labels', () => {
  const getTextSection = (svg: string) =>
    svg
      .split('\n')
      .map((line) => line.replace(/^<text.+>([^<]*)<\/text>$/, '$1'))
      .join('');

  afterAll(() => {
    rdkit.configure({ useLegacyStereoPerception: false });
  });

  it('legacy stereo perception + addStereoAnnotation: sulfinyl shows (S)', () => {
    rdkit.configure({ useLegacyStereoPerception: true });
    using mol = rdkit.getMol('C/C=C/c1ccccc1[S@@](C)=O')!;
    const svg = mol.getSVG({ noFreetype: true, addStereoAnnotation: true });
    expect(getTextSection(svg)).toContain('(S)');
    expect(getTextSection(svg)).not.toContain('(R)');
  });

  it('new stereo perception + addStereoAnnotation: sulfinyl shows neither (S) nor (R)', () => {
    rdkit.configure({ useLegacyStereoPerception: false });
    using mol = rdkit.getMol('C/C=C/c1ccccc1[S@@](C)=O')!;
    const svg = mol.getSVG({ noFreetype: true, addStereoAnnotation: true });
    expect(getTextSection(svg)).not.toContain('(S)');
    expect(getTextSection(svg)).not.toContain('(R)');
  });

  it('assignCIPLabels:true + addStereoAnnotation: sulfinyl shows (R) with new perception', () => {
    rdkit.configure({ useLegacyStereoPerception: false });
    using mol = rdkit.getMol('C/C=C/c1ccccc1[S@@](C)=O', { assignCIPLabels: true })!;
    const svg = mol.getSVG({ noFreetype: true, addStereoAnnotation: true });
    expect(getTextSection(svg)).not.toContain('(S)');
    expect(getTextSection(svg)).toContain('(R)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_assign_chiral_tags_from_mol_parity
// ─────────────────────────────────────────────────────────────────────────────

const ARTEMISININ_CTAB = `68827
  -OEChem-03262404452D

 20 23  0     1  0  0  0  0  0999 V2000
    4.3177    0.4203    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    5.7899    1.1100    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    6.4870   -0.3207    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    4.5402    1.3953    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    7.4004   -1.8275    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    4.6664   -0.2988    0.0000 C   0  0  2  0  0  0  0  0  0  0  0  0
    3.7655    0.1351    0.0000 C   0  0  2  0  0  0  0  0  0  0  0  0
    4.7603   -1.3362    0.0000 C   0  0  1  0  0  0  0  0  0  0  0  0
    2.8959   -0.4383    0.0000 C   0  0  1  0  0  0  0  0  0  0  0  0
    5.5674    0.1351    0.0000 C   0  0  1  0  0  0  0  0  0  0  0  0
    3.9042   -1.9296    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.5430    1.1100    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.9657   -1.4776    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.6389   -1.8668    0.0000 C   0  0  2  0  0  0  0  0  0  0  0  0
    5.1664    1.8919    0.0000 C   0  0  2  0  0  0  0  0  0  0  0  0
    4.1664    1.8919    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0000    0.0059    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.5237   -1.3465    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.6330   -2.8668    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.3890    2.8668    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  4  1  0  0  0  0
  6  1  1  0  0  0  0
  2 10  1  0  0  0  0
  2 15  1  0  0  0  0
  3 10  1  0  0  0  0
  3 18  1  0  0  0  0
  4 15  1  0  0  0  0
  5 18  2  0  0  0  0
  6  7  1  0  0  0  0
  6  8  1  0  0  0  0
  6 10  1  0  0  0  0
  7  9  1  0  0  0  0
  7 12  1  0  0  0  0
  8 11  1  0  0  0  0
  8 14  1  0  0  0  0
  9 13  1  0  0  0  0
  9 17  1  0  0  0  0
 11 13  1  0  0  0  0
 12 16  1  0  0  0  0
 14 18  1  0  0  0  0
 14 19  1  0  0  0  0
 15 16  1  0  0  0  0
 15 20  1  0  0  0  0
M  END
`;

describe('test_assign_chiral_tags_from_mol_parity', () => {
  it('without assignChiralTypesFromMolParity: artemisinin has no stereo in SMILES', () => {
    using mol = rdkit.getMol(ARTEMISININ_CTAB)!;
    expect(mol.getSmiles()).toBe('CC1CCC2C(C)C(=O)OC3OC4(C)CCC1C32OO4');
  });

  it('with assignChiralTypesFromMolParity:true: artemisinin has full stereo in SMILES', () => {
    using mol = rdkit.getMol(ARTEMISININ_CTAB, { assignChiralTypesFromMolParity: true })!;
    expect(mol.getSmiles()).toBe(
      'C[C@@H]1CC[C@H]2[C@@H](C)C(=O)O[C@@H]3O[C@@]4(C)CC[C@@H]1[C@]32OO4',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_add_chiral_hs
// ─────────────────────────────────────────────────────────────────────────────

const CHIRAL_H_MOL_MB = `
  MJ201100

 18 21  0  0  1  0  0  0  0  0999 V2000
   -0.8540   -1.4441    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3019   -0.8310    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.5185   -0.9172    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.8540   -0.1635    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.6825    0.6434    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.1379    0.7296    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5504    1.4441    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -0.4734   -0.0239    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.2409    0.3885    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6609   -1.2726    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.2130   -1.8857    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.9580   -2.6703    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.1511   -2.8419    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.5990   -2.2287    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.0201   -1.7143    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.5720   -2.3275    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.3171   -3.1121    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.5100   -3.2835    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
  2  3  1  0  0  0  0
  4  3  1  0  0  0  0
  4  5  1  0  0  0  0
  6  5  1  0  0  0  0
  6  7  1  1  0  0  0
  6  8  1  0  0  0  0
  8  9  1  1  0  0  0
  8  2  1  0  0  0  0
  4  9  1  1  0  0  0
  2  1  1  1  0  0  0
 10 11  1  0  0  0  0
 11 12  2  0  0  0  0
 12 13  1  0  0  0  0
 13 14  2  0  0  0  0
  1 10  2  0  0  0  0
  1 14  1  0  0  0  0
 15 16  2  0  0  0  0
 16 17  1  0  0  0  0
 11 15  1  0  0  0  0
 17 18  2  0  0  0  0
 12 18  1  0  0  0  0
M  END
`;

const QUINOLINE_SCAFFOLD_MB = `
  MJ201100

 10 11  0  0  1  0  0  0  0  0999 V2000
   -8.1001    2.8219    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
   -8.8145    2.4094    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.8145    1.5843    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.1001    1.1718    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.3856    1.5843    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.3856    2.4094    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.6711    1.1718    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.9566    1.5842    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.9566    2.4092    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.6711    2.8218    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  7  8  2  0  0  0  0
  8  9  1  0  0  0  0
  9 10  2  0  0  0  0
  5  7  1  0  0  0  0
 10  6  1  0  0  0  0
  1  2  2  0  0  0  0
  6  1  1  0  0  0  0
M  END
`;

describe('test_add_chiral_hs', () => {
  it('default SVG includes chiral H atoms (atom-17/18/19)', () => {
    using mol = rdkit.getMol(CHIRAL_H_MOL_MB)!;
    const svg = mol.getSVG({ width: 350, height: 300 });
    expect(svg).toContain("width='350px'");
    expect(svg).toContain("height='300px'");
    expect(svg).toContain('</svg>');
    expect(svg).toContain('atom-17');
    expect(svg).toContain('atom-18');
    expect(svg).toContain('atom-19');
  });

  it('addChiralHs:false + useMolBlockWedging:true + wedgeBonds:false hides chiral H atoms', () => {
    using mol = rdkit.getMol(CHIRAL_H_MOL_MB)!;
    const svg = mol.getSVG({
      width: 350,
      height: 300,
      useMolBlockWedging: true,
      wedgeBonds: false,
      addChiralHs: false,
    });
    expect(svg).toContain("width='350px'");
    expect(svg).toContain("height='300px'");
    expect(svg).toContain('</svg>');
    expect(svg).toContain('atom-17');
    expect(svg).not.toContain('atom-18');
    expect(svg).not.toContain('atom-19');
  });

  it('default getMolblock uses RDKit wedging (different from original)', () => {
    using mol = rdkit.getMol(CHIRAL_H_MOL_MB)!;
    const mbRDKit = mol.getMolblock();
    expect(mbRDKit).not.toBe(CHIRAL_H_MOL_MB);
    expect(mol.getMolblock()).toContain('4  3  1  6');
  });

  it('getMolblock with useMolBlockWedging:true preserves original wedging (no RDKit recomputation)', () => {
    using mol = rdkit.getMol(CHIRAL_H_MOL_MB)!;
    const mbOrig = mol.getMolblock({ useMolBlockWedging: true });
    // useMolBlockWedging preserves the original wedge direction but normalizes the format
    expect(mbOrig).not.toContain('4  3  1  6');
    expect(mbOrig).toContain('6  7  1  1');
  });

  it('alignOnly:true with quinoline scaffold preserves molblock wedging (inverted)', () => {
    using mol = rdkit.getMol(CHIRAL_H_MOL_MB)!;
    using quinoline = rdkit.getMol(QUINOLINE_SCAFFOLD_MB)!;
    using molCopy = mol.copy()!;
    const result = molCopy.generateAlignedCoords(quinoline, {
      acceptFailure: false,
      alignOnly: true,
    });
    expect(result.atoms.length).toBeGreaterThan(0);
    const molblock = molCopy.getMolblock({ useMolBlockWedging: true });
    // Inverted wedging: some "down" wedge bonds (stereo=6)
    expect(molblock.split('\n').some((l) => l.match(/^ [1 ]\d [1 ]\d  [12]  6 *$/))).toBe(true);
    // No "up" wedge bonds (stereo=1)
    expect(molblock.split('\n').some((l) => l.match(/^ [1 ]\d [1 ]\d  [12]  1 *$/))).toBe(false);
    expect(molblock).not.toContain('4  3  1  6');
    expect(molblock).toContain('6  7  1  6');
  });

  it('alignOnly:false with quinoline scaffold clears wedging, recomputes (has both up and down)', () => {
    using mol = rdkit.getMol(CHIRAL_H_MOL_MB)!;
    using quinoline = rdkit.getMol(QUINOLINE_SCAFFOLD_MB)!;
    using molCopy = mol.copy()!;
    const result = molCopy.generateAlignedCoords(quinoline, { acceptFailure: false });
    expect(result.atoms.length).toBeGreaterThan(0);
    const molblock = molCopy.getMolblock({ useMolBlockWedging: true });
    expect(molblock.split('\n').some((l) => l.match(/^ [1 ]\d [1 ]\d  [12]  6 *$/))).toBe(true);
    expect(molblock.split('\n').some((l) => l.match(/^ [1 ]\d [1 ]\d  [12]  1 *$/))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_wedged_bond_atropisomer
// ─────────────────────────────────────────────────────────────────────────────

const ATROPISOMER_V3K = `
  Mrv2311 05242408162D

  0  0  0     0  0            999 V3000
M  V30 BEGIN CTAB
M  V30 COUNTS 14 15 0 0 0
M  V30 BEGIN ATOM
M  V30 1 C 2.0006 -1.54 0 0
M  V30 2 N 2.0006 -3.08 0 0
M  V30 3 C 0.6669 -3.85 0 0
M  V30 4 C -0.6668 -3.08 0 0
M  V30 5 C -0.6668 -1.54 0 0
M  V30 6 C -2.0006 -0.77 0 0
M  V30 7 C 0.6669 -0.77 0 0
M  V30 8 C 0.6669 0.77 0 0
M  V30 9 C -0.6668 1.54 0 0
M  V30 10 C -2.0006 0.77 0 0
M  V30 11 C -0.6668 3.08 0 0
M  V30 12 C 0.6669 3.85 0 0
M  V30 13 C 2.0006 3.08 0 0
M  V30 14 C 2.0006 1.54 0 0
M  V30 END ATOM
M  V30 BEGIN BOND
M  V30 1 1 1 2
M  V30 2 2 2 3
M  V30 3 1 3 4
M  V30 4 2 4 5
M  V30 5 1 5 6
M  V30 6 1 7 5 CFG=3
M  V30 7 2 7 1
M  V30 8 1 7 8
M  V30 9 2 8 9
M  V30 10 1 9 10
M  V30 11 1 9 11
M  V30 12 2 11 12
M  V30 13 1 12 13
M  V30 14 2 13 14
M  V30 15 1 8 14
M  V30 END BOND
M  V30 END CTAB
M  END
`;

describe('test_wedged_bond_atropisomer', () => {
  it('atropisomer bond-5 is rendered as many thin lines (1px, not 2px)', () => {
    using mol = rdkit.getMol(ATROPISOMER_V3K)!;
    const svg = mol.getSVG({ useMolBlockWedging: true, noFreetype: true });
    const thinPaths = svg.match(
      /<path class='bond-5 atom-6 atom-4'.*style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:1\.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' \/>/g,
    );
    expect(thinPaths).not.toBeNull();
    expect(thinPaths!.length).toBeGreaterThan(6);
    const thickPaths = svg.match(
      /<path class='bond-5 atom-6 atom-4'.*style='fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:2\.0px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1' \/>/g,
    );
    expect(thickPaths).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_get_molblock_use_molblock_wedging
// ─────────────────────────────────────────────────────────────────────────────

const WEDGED_MB = `
     RDKit          2D

  9 10  0  0  1  0  0  0  0  0999 V2000
    1.4885   -4.5513    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    2.0405   -3.9382    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.8610   -4.0244    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.1965   -3.2707    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.0250   -2.4637    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2045   -2.3775    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.7920   -1.6630    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    1.8690   -3.1311    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.5834   -2.7186    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
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

describe('test_get_molblock_use_molblock_wedging', () => {
  it('default getMolblock produces different wedging than original', () => {
    using mol = rdkit.getMol(WEDGED_MB)!;
    const mbRDKit = mol.getMolblock();
    expect(mbRDKit).not.toBe(WEDGED_MB);
  });

  it('getMolblock with useMolBlockWedging:true returns original wedging', () => {
    using mol = rdkit.getMol(WEDGED_MB)!;
    const mbOrig = mol.getMolblock({ useMolBlockWedging: true });
    expect(mbOrig).toBe(WEDGED_MB);
  });

  it('getMolblock after useMolBlockWedging call is still consistent with RDKit wedging', () => {
    using mol = rdkit.getMol(WEDGED_MB)!;
    const mbRDKit = mol.getMolblock();
    mol.getMolblock({ useMolBlockWedging: true }); // call useMolBlockWedging once
    const mbRDKitPost = mol.getMolblock();
    expect(mbRDKitPost).not.toBe(WEDGED_MB);
    expect(mbRDKit).toBe(mbRDKitPost);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Shared test data for wedging scaffold tests
// ─────────────────────────────────────────────────────────────────────────────

const WEDGED_MOL_MB = `
     RDKit          2D

 29 34  0  0  1  0  0  0  0  0999 V2000
    1.3719    5.1304    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.5985    3.7907    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.9482    3.7907    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7216    5.1304    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.2685    5.1304    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.8994    3.5835    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.5597    4.3569    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.5597    5.9038    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.8994    6.6771    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.2389    5.9038    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.5784    6.6771    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
   -5.2389    4.3569    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3719    2.4510    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.5985    1.1115    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3719   -0.2276    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.9188   -0.2276    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6921    1.1115    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.9188    2.4510    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.2389    1.1115    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0124   -0.2276    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.2389   -1.5673    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6921   -1.5673    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    3.8996   -5.0201    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.2391   -4.2467    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.5777   -6.5331    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.9909   -5.9040    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0124   -2.9070    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.3306   -6.6772    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.5784   -5.0201    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  1  1  1
  2  3  1  0
  3  4  1  0
  5  4  1  6
  5  6  1  0
  6  7  1  0
  7  8  1  0
  9  8  1  1
  5  9  1  0
  9 10  1  0
 10 11  1  1
 10 12  1  0
  6 12  1  1
  2 13  1  0
 13 14  2  0
 14 15  1  0
 15 16  2  0
 16 17  1  0
 17 18  2  0
 13 18  1  0
 17 19  1  0
 19 20  1  0
 20 21  1  0
 21 22  1  0
 16 22  1  0
 23 24  1  0
 23 25  1  0
 25 26  1  0
 24 27  1  0
 27 26  1  0
 26 28  1  0
 24 29  1  0
 28 29  1  0
 21 27  1  0
M  END
`;

const INVERTED_WEDGES = `  2  1  1  6
  2  3  1  0
  3  4  1  0
  5  4  1  1
  5  6  1  0
  6  7  1  0
  7  8  1  0
  9  8  1  6
  5  9  1  0
  9 10  1  0
 10 11  1  6
 10 12  1  0
  6 12  1  6
  2 13  1  0
 13 14  2  0
 14 15  1  0
 15 16  2  0
 16 17  1  0
 17 18  2  0
 13 18  1  0
 17 19  1  0
 19 20  1  0
 20 21  1  0
 21 22  1  0
 16 22  1  0
 23 24  1  0
 23 25  1  0
 25 26  1  0
 24 27  1  0
 27 26  1  0
 26 28  1  0
 24 29  1  0
 28 29  1  0
 21 27  1  0
`;

// ─────────────────────────────────────────────────────────────────────────────
// test_wedging_all_within_scaffold
// ─────────────────────────────────────────────────────────────────────────────

const SCAFFOLD_ALL_WITHIN_MB = `
     RDKit          2D

 13 14  0  0  1  0  0  0  0  0999 V2000
   -1.6549    2.5755    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8814    1.2358    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.6653    1.2358    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.4385    2.5755    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.9854    2.5755    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6161    1.0286    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2766    1.8019    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2766    3.3487    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6161    4.1222    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.9558    3.3487    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.2953    4.1222    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
    4.9558    1.8019    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6549   -0.1037    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  1  1  0
  2  3  1  0
  3  4  1  0
  5  4  1  1
  5  6  1  0
  6  7  1  6
  7  8  1  0
  9  8  1  6
  5  9  1  0
  9 10  1  0
 10 11  1  6
 10 12  1  0
  6 12  1  0
  2 13  1  6
M  END
`;

describe('test_wedging_all_within_scaffold', () => {
  it('alignOnly:true — aligns, inverts wedging, narrow bridge angle (~10-15°)', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_ALL_WITHIN_MB)!;
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: false,
      alignOnly: true,
    });
    expect(result.atoms.length).toBeGreaterThan(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    const svg = molCopy.getSVG({
      width: 350,
      height: 300,
      useMolBlockWedging: true,
      wedgeBonds: false,
      addChiralHs: false,
    });
    const [xy23, xy26] = extractBondCoords(svg, 'atom-23 atom-26');
    const [, xy25] = extractBondCoords(svg, 'atom-26 atom-25');
    const v1: Coord2D = [xy23[0] - xy26[0], xy23[1] - xy26[1]];
    const v2: Coord2D = [xy25[0] - xy26[0], xy25[1] - xy26[1]];
    const theta = angleDegBetweenVectors(v1, v2);
    expect(theta).toBeGreaterThan(10);
    expect(theta).toBeLessThan(15);
    expect(mb).toContain(INVERTED_WEDGES);
  });

  it('alignOnly:false — aligns, inverts wedging, wide bridge angle (~105-110°)', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_ALL_WITHIN_MB)!;
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, { acceptFailure: false });
    expect(result.atoms.length).toBeGreaterThan(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    const svg = molCopy.getSVG({
      width: 350,
      height: 300,
      useMolBlockWedging: true,
      wedgeBonds: false,
      addChiralHs: false,
    });
    const [xy23, xy26] = extractBondCoords(svg, 'atom-23 atom-26');
    const [, xy25] = extractBondCoords(svg, 'atom-26 atom-25');
    const v1: Coord2D = [xy23[0] - xy26[0], xy23[1] - xy26[1]];
    const v2: Coord2D = [xy25[0] - xy26[0], xy25[1] - xy26[1]];
    const theta = angleDegBetweenVectors(v1, v2);
    expect(theta).toBeGreaterThan(105);
    expect(theta).toBeLessThan(110);
    expect(mb).toContain(INVERTED_WEDGES);
  });

  it('useCoordGen:true — aligns, clears original wedging, very wide bridge angle (~145-150°)', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_ALL_WITHIN_MB)!;
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: false,
      useCoordGen: true,
    });
    expect(result.atoms.length).toBeGreaterThan(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    const svg = molCopy.getSVG({
      width: 350,
      height: 300,
      useMolBlockWedging: true,
      wedgeBonds: false,
      addChiralHs: false,
    });
    const [xy23, xy26] = extractBondCoords(svg, 'atom-23 atom-26');
    const [, xy25] = extractBondCoords(svg, 'atom-26 atom-25');
    const v1: Coord2D = [xy23[0] - xy26[0], xy23[1] - xy26[1]];
    const v2: Coord2D = [xy25[0] - xy26[0], xy25[1] - xy26[1]];
    const theta = angleDegBetweenVectors(v1, v2);
    expect(theta).toBeGreaterThan(145);
    expect(theta).toBeLessThan(150);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_wedging_outside_scaffold
// ─────────────────────────────────────────────────────────────────────────────

const SCAFFOLD_OUTSIDE_MB = `
     RDKit          2D

  9 10  0  0  1  0  0  0  0  0999 V2000
   -0.8816    0.5663    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.6651    0.5663    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2958   -0.9804    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0435   -0.2072    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.0435    1.3395    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2958    2.1129    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.6355    1.3395    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.9750    2.1129    0.0000 F   0  0  0  0  0  0  0  0  0  0  0  0
    2.6355   -0.2072    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  1  1  1
  2  3  1  0
  3  4  1  6
  4  5  1  0
  6  5  1  6
  2  6  1  0
  6  7  1  0
  7  8  1  6
  7  9  1  0
  3  9  1  0
M  END
`;

describe('test_wedging_outside_scaffold', () => {
  it('alignOnly:true — aligns, inverts wedging, narrow bridge angle (~10-15°)', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_OUTSIDE_MB)!;
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: false,
      alignOnly: true,
    });
    expect(result.atoms.length).toBeGreaterThan(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    const svg = molCopy.getSVG({
      width: 350,
      height: 300,
      useMolBlockWedging: true,
      wedgeBonds: false,
      addChiralHs: false,
    });
    const [xy23, xy26] = extractBondCoords(svg, 'atom-23 atom-26');
    const [, xy25] = extractBondCoords(svg, 'atom-26 atom-25');
    const v1: Coord2D = [xy23[0] - xy26[0], xy23[1] - xy26[1]];
    const v2: Coord2D = [xy25[0] - xy26[0], xy25[1] - xy26[1]];
    const theta = angleDegBetweenVectors(v1, v2);
    expect(theta).toBeGreaterThan(10);
    expect(theta).toBeLessThan(15);
    expect(mb).toContain(INVERTED_WEDGES);
  });

  it('alignOnly:false — aligns, clears original wedging, wide bridge angle (~105-110°)', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_OUTSIDE_MB)!;
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, { acceptFailure: false });
    expect(result.atoms.length).toBeGreaterThan(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    const svg = molCopy.getSVG({
      width: 350,
      height: 300,
      useMolBlockWedging: true,
      wedgeBonds: false,
      addChiralHs: false,
    });
    const [xy23, xy26] = extractBondCoords(svg, 'atom-23 atom-26');
    const [, xy25] = extractBondCoords(svg, 'atom-26 atom-25');
    const v1: Coord2D = [xy23[0] - xy26[0], xy23[1] - xy26[1]];
    const v2: Coord2D = [xy25[0] - xy26[0], xy25[1] - xy26[1]];
    const theta = angleDegBetweenVectors(v1, v2);
    expect(theta).toBeGreaterThan(105);
    expect(theta).toBeLessThan(110);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });

  it('useCoordGen:true — aligns, clears original wedging, very wide bridge angle (~145-150°)', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_OUTSIDE_MB)!;
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: false,
      useCoordGen: true,
    });
    expect(result.atoms.length).toBeGreaterThan(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    const svg = molCopy.getSVG({
      width: 350,
      height: 300,
      useMolBlockWedging: true,
      wedgeBonds: false,
      addChiralHs: false,
    });
    const [xy23, xy26] = extractBondCoords(svg, 'atom-23 atom-26');
    const [, xy25] = extractBondCoords(svg, 'atom-26 atom-25');
    const v1: Coord2D = [xy23[0] - xy26[0], xy23[1] - xy26[1]];
    const v2: Coord2D = [xy25[0] - xy26[0], xy25[1] - xy26[1]];
    const theta = angleDegBetweenVectors(v1, v2);
    expect(theta).toBeGreaterThan(145);
    expect(theta).toBeLessThan(150);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// test_wedging_if_no_match
// ─────────────────────────────────────────────────────────────────────────────

const SCAFFOLD_NO_MATCH_MB = `
     RDKit          2D

 13 14  0  0  1  0  0  0  0  0999 V2000
   -1.6549    2.5755    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
   -0.8814    1.2358    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.6653    1.2358    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.4385    2.5755    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.9854    2.5755    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6161    1.0286    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2766    1.8019    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.2766    3.3487    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6161    4.1222    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.9558    3.3487    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.2953    4.1222    0.0000 Cl  0  0  0  0  0  0  0  0  0  0  0  0
    4.9558    1.8019    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.6549   -0.1037    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  1  1  0
  2  3  1  0
  3  4  1  0
  5  4  1  1
  5  6  1  0
  6  7  1  6
  7  8  1  0
  9  8  1  6
  5  9  1  0
  9 10  1  0
 10 11  1  6
 10 12  1  0
  6 12  1  0
  2 13  1  6
M  END
`;

describe('test_wedging_if_no_match', () => {
  it('alignOnly:false + acceptFailure:false — molblock unchanged, no inverted wedges', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_NO_MATCH_MB)!;
    const origMolBlock = wedgedMol.getMolblock({ useMolBlockWedging: true });
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: false,
      alignOnly: true,
    });
    expect(result.atoms).toHaveLength(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    expect(mb).toBe(origMolBlock);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });

  it('alignOnly:true + acceptFailure:true — molblock changed, no inverted wedges', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_NO_MATCH_MB)!;
    const origMolBlock = wedgedMol.getMolblock({ useMolBlockWedging: true });
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: true,
      alignOnly: true,
    });
    expect(result.atoms).toHaveLength(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    expect(mb).not.toBe(origMolBlock);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });

  it('alignOnly:false + acceptFailure:false — molblock unchanged, no inverted wedges', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_NO_MATCH_MB)!;
    const origMolBlock = wedgedMol.getMolblock({ useMolBlockWedging: true });
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, { acceptFailure: false });
    expect(result.atoms).toHaveLength(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    expect(mb).toBe(origMolBlock);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });

  it('alignOnly:false + acceptFailure:true — molblock changed, no inverted wedges', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_NO_MATCH_MB)!;
    const origMolBlock = wedgedMol.getMolblock({ useMolBlockWedging: true });
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, { acceptFailure: true });
    expect(result.atoms).toHaveLength(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    expect(mb).not.toBe(origMolBlock);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });

  it('useCoordGen:true + acceptFailure:false — molblock unchanged, no inverted wedges', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_NO_MATCH_MB)!;
    const origMolBlock = wedgedMol.getMolblock({ useMolBlockWedging: true });
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: false,
      useCoordGen: true,
    });
    expect(result.atoms).toHaveLength(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    expect(mb).toBe(origMolBlock);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });

  it('useCoordGen:true + acceptFailure:true — molblock changed, no inverted wedges', () => {
    using wedgedMol = rdkit.getMol(WEDGED_MOL_MB)!;
    using scaffold = rdkit.getMol(SCAFFOLD_NO_MATCH_MB)!;
    const origMolBlock = wedgedMol.getMolblock({ useMolBlockWedging: true });
    using molCopy = wedgedMol.copy()!;
    const result = molCopy.generateAlignedCoords(scaffold, {
      acceptFailure: true,
      useCoordGen: true,
    });
    expect(result.atoms).toHaveLength(0);
    const mb = molCopy.getMolblock({ useMolBlockWedging: true });
    expect(mb).not.toBe(origMolBlock);
    expect(mb).not.toContain(INVERTED_WEDGES);
  });
});
