import { Mol } from './mol.ts';
import { fromMolArraytoMolList, fromStringArraytoMolList, isMolArray } from './mol-array.ts';
import { Reaction } from './reaction.ts';
import type { RDKitModule, MolList, JSMol } from './types/rdkit-minimalib-typings';
import { decomposeRGroups, type RGDRow } from './rgd.ts';
import type {
  RDKitGetMolOpt,
  RDKitGetMCSOptions,
  RDKitMCSResult,
  RDKitRxnDetails,
  RDKitGetRgdOptions,
} from './types/rdkit-minimalib-json-typings';

/** Result of a Maximum Common Substructure (MCS) computation */
export interface MCSResult {
  numAtoms: number;
  numBonds: number;
  canceled: boolean;
  /** SMARTS string(s) — an array when the `StoreAll` option is used */
  smarts: string | string[];
  /**
   * Lazily creates a query Mol from the first SMARTS.
   * Returns null if SMARTS is empty.
   *
   * **WARNING:** The caller is responsible for explicitly deleting this
   * object (via `.delete()` or `using`) to avoid memory leaks.
   */
  get qmol(): Mol | null;
}

/**
 * The main RDKit wrapper providing a typed, camelCase API over the WASM module.
 *
 * Instances are created via {@link initRDKit}, not directly by consumers.
 *
 * @example
 * ```ts
 * const rdkit = await initRDKit();
 * const mol = rdkit.getMol('c1ccccc1');
 * ```
 */
export class RDKit {
  #mod: RDKitModule;

  /** @internal */
  constructor(mod: RDKitModule) {
    this.#mod = mod;
  }

  /**
   * Creates a molecule from a variety of input formats.
   *
   * @param input - SMILES, SMARTS, MolFile, or JSON string
   * @param options - Molecule parsing options
   * @returns A Mol instance, or null if the input is invalid
   */
  getMol(input: string | Uint8Array, options?: Partial<RDKitGetMolOpt>): Mol | null {
    let jsMol: JSMol | null;
    if (input instanceof Uint8Array) {
      if (options) {
        console.warn('Options are ignored when getMol is called with a binary input (pikkle).');
      }
      jsMol = this.#mod.get_mol_from_uint8array(input);
    } else {
      jsMol = options
        ? this.#mod.get_mol(input, JSON.stringify(options))
        : this.#mod.get_mol(input);
    }

    if (!jsMol) return null;

    return new Mol(jsMol, this.#mod);
  }

  /**
   * Creates a query molecule from a SMARTS string.
   *
   * @param input - SMARTS string
   * @returns A Mol instance, or null if the input is invalid
   */
  getQMol(input: string): Mol | null {
    const jsMol = this.#mod.get_qmol(input);
    if (!jsMol) {
      return null;
    }
    return new Mol(jsMol, this.#mod);
  }

  /**
   * Computes the Maximum Common Substructure (MCS) of a set of molecules.
   *
   * @param mols - An array of Mol instances or SMILES strings
   * @param options - MCS algorithm options
   * @returns An MCSResult with match info and a lazy `qmol` getter
   */
  getMCS(mols: Mol[] | string[], options?: Partial<RDKitGetMCSOptions>): MCSResult {
    let molList: MolList;

    if (mols.length < 2) {
      throw new Error('getMCS requires at least 2 molecules');
    }

    if (isMolArray(mols)) {
      molList = fromMolArraytoMolList(mols, this.#mod);
    } else {
      molList = fromStringArraytoMolList(mols, this.#mod);
    }

    if (molList.size() < 2) {
      molList.delete();
      throw new Error('getMCS requires at least 2 valid molecules');
    }

    const json = options
      ? this.#mod.get_mcs_as_json(molList, JSON.stringify(options))
      : this.#mod.get_mcs_as_json(molList);

    molList.delete();

    const parsed = JSON.parse(json) as RDKitMCSResult;
    let cachedQmol: Mol | null | undefined;
    const mod = this.#mod;

    return {
      ...parsed,
      get qmol(): Mol | null {
        if (cachedQmol !== undefined) return cachedQmol;
        const s = Array.isArray(parsed.smarts) ? parsed.smarts[0] : parsed.smarts;
        if (!s) {
          cachedQmol = null;
          return null;
        }
        const jsMol = mod.get_qmol(s);
        cachedQmol = jsMol ? new Mol(jsMol, mod) : null;
        return cachedQmol;
      },
    };
  }

  /**
   * Creates a Reaction from a reaction SMARTS, SMILES, or RXN block.
   *
   * @param input - Reaction SMARTS, SMILES, or RXN block string
   * @param options - Reaction parsing options
   * @returns A Reaction instance, or null if the input is invalid
   */
  getRxn(input: string, options?: Partial<RDKitRxnDetails>): Reaction | null {
    try {
      const jsRxn = options
        ? this.#mod.get_rxn(input, JSON.stringify(options))
        : this.#mod.get_rxn(input);
      if (!jsRxn) return null;
      return new Reaction(jsRxn, this.#mod);
    } catch {
      return null;
    }
  }

  /**
   * Performs R-Group Decomposition on a set of molecules against one or more cores.
   *
   * **WARNING:** The caller is responsible for deleting each `Mol` in the
   * returned rows (via `.delete()` or `using`) to avoid memory leaks.
   *
   * @param core - Core structure(s): a SMARTS string, an array of SMARTS strings,
   *   a Mol instance, or an array of Mol instances
   * @param molecules - Molecules to decompose: an array of SMILES strings or Mol instances
   * @param options - R-Group decomposition options
   * @returns An array of rows, one per molecule. Each row maps R-group labels
   *   (`Core`, `R1`, `R2`, …) to Mol instances.
   */
  getRGD(
    core: string | string[] | Mol | Mol[],
    molecules: string[] | Mol[],
    options?: Partial<RDKitGetRgdOptions>,
  ): RGDRow[] | null {
    return decomposeRGroups(core, molecules, options, this.#mod);
  }

  molzip(mol1: Mol, mol2: Mol): Mol | null {
    const jsMol = this.#mod.molzip(mol1.jsMol, mol2.jsMol);
    if (!jsMol) return null;
    return new Mol(jsMol, this.#mod);
  }

  /** Returns the RDKit version string */
  get version(): string {
    return this.#mod.version();
  }

  /** The underlying RDKitModule for direct access to the raw API */
  get module(): RDKitModule {
    return this.#mod;
  }
}
