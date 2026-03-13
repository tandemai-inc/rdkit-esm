/** @import { RDKit, Mol, RDKitDepictionDetails, RDKitSubstructMatch, RDKitDescriptors } from '../dist/index.js' */
import { initRDKit } from '../dist/index.js';

/** @type {RDKit} */
const rdkit = await initRDKit();

document.getElementById('loading').textContent = '';
document.getElementById('version').textContent = `RDKit ${rdkit.version}`;

const smilesInput = /** @type {HTMLInputElement} */ (document.getElementById('smiles-input'));
const smartsInput = /** @type {HTMLInputElement} */ (document.getElementById('smarts-input'));
const drawingDiv = /** @type {HTMLDivElement} */ (document.getElementById('drawing'));
const canSmilesDiv = /** @type {HTMLDivElement} */ (document.getElementById('can-smiles'));
const errorDiv = /** @type {HTMLDivElement} */ (document.getElementById('error'));
const descriptorsDiv = /** @type {HTMLDivElement} */ (document.getElementById('descriptors'));
const fingerprintDiv = /** @type {HTMLDivElement} */ (document.getElementById('fingerprint'));

/** @type {(keyof RDKitDepictionDetails)[]} */
const checkboxIds = ['addAtomIndices', 'addBondIndices', 'explicitMethyl', 'addStereoAnnotation'];

/**
 * Reads drawing options from the form checkboxes and legend input.
 * @returns {Partial<RDKitDepictionDetails>}
 */
function getDrawingOptions() {
  /** @type {Partial<RDKitDepictionDetails>} */
  const opts = {};
  for (const id of checkboxIds) {
    if (/** @type {HTMLInputElement} */ (document.getElementById(id)).checked) {
      opts[id] = true;
    }
  }
  const legend = /** @type {HTMLInputElement} */ (document.getElementById('legend')).value.trim();
  if (legend) opts.legend = legend;
  return opts;
}

/**
 * Parses the current SMILES input, renders the molecule SVG,
 * highlights any substructure match from the SMARTS input,
 * and displays descriptors and fingerprint.
 */
function update() {
  const smiles = smilesInput.value.trim();
  const smarts = smartsInput.value.trim();

  errorDiv.textContent = '';
  drawingDiv.innerHTML = '';
  canSmilesDiv.textContent = '';
  descriptorsDiv.innerHTML = '';
  fingerprintDiv.textContent = '';

  if (!smiles) return;

  /** @type {Mol | null} */
  const mol = rdkit.getMol(smiles);
  if (!mol) {
    errorDiv.textContent = 'Invalid SMILES';
    return;
  }

  try {
    canSmilesDiv.textContent = mol.getSmiles();

    // Build SVG options from checkboxes
    const opts = getDrawingOptions();

    // If SMARTS is provided, get substructure match and merge for highlighting
    if (smarts) {
      try {
        /** @type {RDKitSubstructMatch} */
        const match = mol.getSubstructMatch(smarts);
        if (match.atoms.length > 0) {
          opts.atoms = match.atoms;
          opts.bonds = match.bonds;
        }
      } catch {
        errorDiv.textContent = 'Invalid SMARTS query';
      }
    }

    const svg = mol.getSVG(Object.keys(opts).length > 0 ? opts : undefined);
    drawingDiv.innerHTML = svg;

    // Descriptors
    /** @type {RDKitDescriptors} */
    const desc = mol.getDescriptors();
    descriptorsDiv.innerHTML = [
      `<b>AMW:</b> ${desc.amw.toFixed(2)}`,
      `<b>Exact MW:</b> ${desc.exactmw.toFixed(4)}`,
      `<b>CLogP:</b> ${desc.CrippenClogP.toFixed(2)}`,
      `<b>HBA:</b> ${desc.NumHBA}`,
      `<b>HBD:</b> ${desc.NumHBD}`,
      `<b>Aromatic rings:</b> ${desc.NumAromaticRings}`,
      `<b>Heavy atoms:</b> ${desc.NumHeavyAtoms}`,
    ].join(' &middot; ');

    // Morgan fingerprint
    const fp = mol.getMorganFp({ radius: 2, nBits: 128 });
    fingerprintDiv.textContent = `MFP2 (r=2): ${fp}`;
  } finally {
    mol.delete();
  }
}

// Bind events
smilesInput.addEventListener('input', update);
smartsInput.addEventListener('input', update);
for (const id of checkboxIds) {
  document.getElementById(id)?.addEventListener('change', update);
}
document.getElementById('legend')?.addEventListener('input', update);

// Initial render
update();
