import type { JSMol, MolList, RDKitModule } from './types/rdkit-minimalib-typings';
import type { RDKitGetRgdOptions } from './types/rdkit-minimalib-json-typings';
import { Mol } from './mol.ts';
import { fromMolArraytoMolList, fromStringArraytoMolList, isMolArray } from './mol-array.ts';

/**
 * A row from R-Group Decomposition, mapping labels like `Core`, `R1`, `R2`, …
 * to Mol instances.
 */
export type RGDRow = Record<string, Mol>;

/**
 * Performs R-Group Decomposition on a set of molecules against one or more cores.
 *
 * This is a one-shot helper that handles all the boilerplate of the raw RDKit
 * RGD API: creating the decomposition object, adding molecules, processing,
 * extracting rows, and cleaning up intermediate objects.
 *
 * **WARNING:** The caller is responsible for deleting each `Mol` in the
 * returned rows (via `.delete()` or `using`) to avoid memory leaks.
 *
 * @param core - Core structure(s): a SMARTS string, an array of SMARTS strings,
 *   a Mol instance, or an array of Mol instances
 * @param molecules - Molecules to decompose: an array of SMILES strings or Mol instances
 * @param options - R-Group decomposition options
 * @param module - The RDKit WASM module
 * @returns An array of rows, one per molecule. Each row maps R-group labels
 *   (`Core`, `R1`, `R2`, …) to Mol instances.
 */
export function decomposeRGroups(
  core: string | string[] | Mol | Mol[],
  molecules: string[] | Mol[],
  options: Partial<RDKitGetRgdOptions> | undefined,
  module: RDKitModule,
): RGDRow[] | null {
  // Resolve core to JSMol or MolList
  let resolvedCore: JSMol | MolList;
  let deleteCore = false;

  if (typeof core === 'string') {
    const qmol = module.get_qmol(core);
    if (!qmol || !qmol.is_valid()) {
      return null;
    }
    resolvedCore = qmol;
    deleteCore = true;
  } else if (core instanceof Mol) {
    resolvedCore = core.jsMol;
  } else if (isMolArray(core)) {
    resolvedCore = fromMolArraytoMolList(core, module);
    deleteCore = true;
  } else {
    resolvedCore = fromStringArraytoMolList(core, module, true); // isQuery
    deleteCore = true;
  }

  // Create RGD — always pass options JSON (empty object if none provided)
  const rgd = module.get_rgd(resolvedCore, JSON.stringify(options ?? {}));

  // Add molecules
  if (isMolArray(molecules)) {
    for (const mol of molecules) {
      rgd.add(mol.jsMol);
    }
  } else {
    for (const s of molecules) {
      const jsMol = module.get_mol(s);
      if (jsMol && jsMol.is_valid()) {
        rgd.add(jsMol);
      }
      jsMol?.delete();
    }
  }

  rgd.process();

  // Extract rows and wrap JSMol values as Mol
  const rawRows = rgd.get_rgroups_as_rows();
  const result: RGDRow[] = rawRows.map((row: Record<string, JSMol>) => {
    const wrappedRow: RGDRow = {};
    for (const [label, jsMol] of Object.entries(row)) {
      wrappedRow[label] = new Mol(jsMol, module);
    }
    return wrappedRow;
  });

  // Cleanup
  rgd.delete();
  if (deleteCore) {
    resolvedCore.delete();
  }

  return result;
}
