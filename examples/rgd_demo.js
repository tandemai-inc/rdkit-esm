/** @import { RDKit, Mol, RGDRow, RDKitDepictionDetails, MolCollection } from '../dist/index.js' */
import { initRDKit } from '../dist/index.js';

/** @type {RDKit} */
const rdkit = await initRDKit();

document.getElementById('loading').textContent = '';
document.getElementById('version').textContent = `RDKit ${rdkit.version()}`;

const NAME = '_Name';
const RGROUP_TARGET_ATOMS = '_rgroupTargetAtoms';
const RGROUP_TARGET_BONDS = '_rgroupTargetBonds';
const HIGHLIGHT_RADIUS = 0.4;
const HIGHLIGHT_LINEWIDTH_MULTIPLIER = 2;
const USE_COORDGEN = true;

// Okabe-Ito colormap (https://jfly.uni-koeln.de/color/)
const COLORS = [
  [230, 159, 0],
  [86, 180, 233],
  [0, 158, 115],
  [240, 228, 66],
  [0, 114, 178],
  [213, 94, 0],
  [204, 121, 167],
].map((t) => t.map((v) => v / 255));

const LABELS = ['R1', 'R2', 'R3', 'R4'];

const smiArray = [
  ['Cc1ccc2c(c3ccnc(Nc4cccc(c4)C(F)(F)F)n3)c(nn2n1)c5ccc(F)cc5', 'CHEMBL182493'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc(F)c(F)c4)n3)c(nn2n1)c5ccc(F)cc5', 'CHEMBL182326'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc5OCCOc5c4)n3)c(nn2n1)c6ccc(F)cc6', 'CHEMBL183064'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc(Cl)c(c4)C(F)(F)F)n3)c(nn2n1)c5ccc(F)cc5', 'CHEMBL361038'],
  ['C1CC1c2nn3ncccc3c2c4ccnc(Nc5ccccc5)n4', 'CHEMBL362296'],
  ['Fc1ccc(Nc2nccc(n2)c3c(nn4ncccc34)C5CC5)cc1F', 'CHEMBL185516'],
  ['C1CCC(CC1)c2nn3ncccc3c2c4ccnc(Nc5ccccc5)n4', 'CHEMBL273870'],
  ['Fc1ccc(Nc2nccc(n2)c3c(nn4ncccc34)C5CCCCC5)cc1F', 'CHEMBL185044'],
  ['COCCOc1cnn2ncc(c3ccnc(Nc4cccc(OC)c4)n3)c2c1', 'CHEMBL180593'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc(F)c(F)c4)n3)c(nn2n1)c5ccccc5', 'CHEMBL364197'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc(Cl)c(c4)C(F)(F)F)n3)c(nn2n1)c5ccccc5', 'CHEMBL186010'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc5OCCOc5c4)n3)c(nn2n1)c6ccccc6', 'CHEMBL361723'],
  ['Cc1ccc2c(c3ccnc(Nc4ccccc4)n3)c(nn2n1)c5cccc(c5)C(F)(F)F', 'CHEMBL364539'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc(F)c(F)c4)n3)c(nn2n1)c5cccc(c5)C(F)(F)F', 'CHEMBL186195'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc(Cl)c(c4)C(F)(F)F)n3)c(nn2n1)c5cccc(c5)C(F)(F)F', 'CHEMBL184657'],
  ['Cc1ccc2c(c3ccnc(Nc4ccc5OCCOc5c4)n3)c(nn2n1)c6cccc(c6)C(F)(F)F', 'CHEMBL189617'],
];

/**
 * @param {boolean} useSvg
 */
function render(useSvg) {
  const tableDiv = document.getElementById('tableDiv');
  if (!tableDiv) return;
  tableDiv.innerHTML = '';

  // Create core with special options for R-group labels
  const core = rdkit.getMol('c1cc(-c2c([*:1])nn3nc([*:2])ccc23)nc(N(c2ccc([*:4])c([*:3])c2))n1', {
    makeDummiesQueries: true,
    mappedDummiesAreRGroups: true,
  });
  if (!core) return;

  // Create molecules and tag them with names
  /** @type {MolCollection} */
  const mols = rdkit.getMolCollection();
  for (const [smi, chemblId] of smiArray) {
    const mol = rdkit.getMol(smi);
    if (mol) {
      mol.setProp(NAME, chemblId);
      mols.push(mol);
    }
  }

  try {
    core.setNewCoords(USE_COORDGEN);

    // Run R-Group Decomposition via the wrapper one-shot API
    const rows = rdkit.getRGD(core, mols, { includeTargetMolInResults: true });
    if (!rows) return;

    const table = generateTable(rows, core, {
      labels: LABELS,
      nPerRow: 4,
      width: 250,
      height: 200,
      useSvg,
    });
    tableDiv.appendChild(table);

    // Clean up all Mol instances in the rows
    for (const row of rows) {
      for (const mol of Object.values(row)) {
        mol.delete();
      }
    }
  } finally {
    core.delete();
    for (const mol of mols) {
      mol.delete();
    }
    mols.delete();
  }
}

/**
 * Build the highlight details for a single molecule row.
 * @param {RGDRow} row
 * @param {Mol} core
 * @param {{ labels: string[], width: number, height: number, useSvg: boolean }} opts
 * @returns {HTMLDivElement}
 */
function generateStructureDiv(row, core, { labels, width, height, useSvg }) {
  const div = document.createElement('div');
  const mol = row['Mol'];
  if (!mol) return div;

  /** @type {Record<number, number[][]>} */
  const highlightAtomMultipleColors = {};
  /** @type {Record<number, number[][]>} */
  const highlightBondMultipleColors = {};
  /** @type {Record<number, number>} */
  const highlightAtomRadii = {};
  /** @type {Record<number, number>} */
  const highlightLineWidthMultipliers = {};

  for (let i = 0; i < labels.length; i++) {
    const rgroup = row[labels[i]];
    if (!rgroup) continue;

    const targetAtoms = rgroup.hasProp(RGROUP_TARGET_ATOMS)
      ? JSON.parse(rgroup.getProp(RGROUP_TARGET_ATOMS))
      : [];
    const targetBonds = rgroup.hasProp(RGROUP_TARGET_BONDS)
      ? JSON.parse(rgroup.getProp(RGROUP_TARGET_BONDS))
      : [];
    const color = COLORS[i % COLORS.length];

    for (const idx of targetAtoms) {
      if (!highlightAtomMultipleColors[idx]) highlightAtomMultipleColors[idx] = [];
      highlightAtomMultipleColors[idx].push(color);
      highlightAtomRadii[idx] = HIGHLIGHT_RADIUS;
    }
    for (const idx of targetBonds) {
      if (!highlightBondMultipleColors[idx]) highlightBondMultipleColors[idx] = [];
      highlightBondMultipleColors[idx].push(color);
      highlightLineWidthMultipliers[idx] = HIGHLIGHT_LINEWIDTH_MULTIPLIER;
    }
  }

  mol.generateAlignedCoords(core, {
    useCoordGen: USE_COORDGEN,
    allowRGroups: true,
  });

  /** @type {Partial<RDKitDepictionDetails>} */
  const details = {
    width,
    height,
    highlightAtomMultipleColors,
    highlightBondMultipleColors,
    highlightAtomRadii,
    highlightLineWidthMultipliers,
  };

  if (useSvg) {
    div.innerHTML = mol.getSvg(details);
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    mol.drawToCanvas(canvas, details);
    div.appendChild(canvas);
  }

  const legendText = mol.hasProp(NAME) ? mol.getProp(NAME) : '';
  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.textContent = legendText;
  div.appendChild(legend);

  return div;
}

/**
 * Build the grid table of decomposed molecules.
 * @param {RGDRow[]} rows
 * @param {Mol} core
 * @param {{ nPerRow: number, labels: string[], width: number, height: number, useSvg: boolean }} opts
 * @returns {HTMLTableElement}
 */
function generateTable(rows, core, { nPerRow, ...opts }) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  /** @type {HTMLTableRowElement | undefined} */
  let tr;
  rows.forEach((row, i) => {
    if (!(i % nPerRow)) {
      tr = document.createElement('tr');
      tbody.appendChild(tr);
    }
    const td = document.createElement('td');
    if (tr) tr.appendChild(td);
    td.appendChild(generateStructureDiv(row, core, opts));
  });
  return table;
}

// Bind output mode toggle
for (const radio of document.querySelectorAll('input[name="output"]')) {
  radio.addEventListener('change', () => {
    const checked = /** @type {HTMLInputElement} */ (
      document.querySelector('input[name="output"]:checked')
    );
    render(checked.value === 'svg');
  });
}

// Initial render
render(true);
