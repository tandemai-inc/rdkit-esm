import { Mol } from './mol.ts';
import { fromMolArraytoMolList, fromStringArraytoMolList, isMolArray } from './mol-array.ts';
import { Reaction } from './reaction.ts';
import { SubstructLibraryWrapper } from './substruct-library.ts';
import type { RDKitModule, MolList, JSMol, JSReaction } from './types/rdkit-minimalib-typings';
import { decomposeRGroups, type RGDResult } from './rgd.ts';
import type {
  RDKitGetMCSOptions,
  RDKitMCSResult,
  RDKitGetRgdOptions,
  RDKitMolZipOptions,
} from './types/rdkit-minimalib-json-typings';
import { computeFingerprintSimilarity } from './fingerprints/bitops.ts';
import { RDKitLogger, RDKitParseError } from './logger.ts';
import type {
  RDKitConfigureOptions,
  RDKitEvents,
  RDKitFailCallback,
  RDKitGetMolOptions,
  RDKitGetQMolOptions,
  RDKitGetRxnOptions,
  SubstructLibraryOptions,
} from './types/rdkit-esm.typings.ts';

/** Result of a Maximum Common Substructure (MCS) computation */
export interface MCSResult extends Disposable {
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
  delete(): void;
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
  protected readonly mod: RDKitModule;
  protected readonly logger: RDKitLogger;
  readonly events: RDKitEvents;

  /** @internal */
  constructor(mod: RDKitModule) {
    this.mod = mod;
    this.logger = new RDKitLogger(mod);
    this.events = {
      addErrorListener: (cb: RDKitFailCallback) => this.logger.addCallback(cb),
    };
  }

  /**
   * Creates a molecule from a variety of input formats.
   *
   * @param input - SMILES, SMARTS, MolFile, or JSON string
   * @param options - Molecule parsing options
   * @returns A Mol instance, or null if the input is invalid.
   *   Pass `{ throwOnError: true }` to throw a {@link RDKitParseError} instead.
   */
  getMol(input: string | Uint8Array): Mol | null;
  getMol(
    input: string | Uint8Array,
    options: Partial<RDKitGetMolOptions> & { throwOnError: true },
  ): Mol;
  getMol(input: string | Uint8Array, options?: Partial<RDKitGetMolOptions>): Mol | null;
  getMol(input: string | Uint8Array, options?: Partial<RDKitGetMolOptions>): Mol | null {
    const { throwOnError = false, ...wasmOptions } = options ?? {};
    this.logger.reset(throwOnError);

    let jsMol: JSMol | null;
    const hasOptions = Object.keys(wasmOptions).length > 0;
    if (input instanceof Uint8Array) {
      if (hasOptions) {
        console.warn('Options are ignored when getMol is called with a binary input (pikkle).');
      }
      jsMol = this.mod.get_mol_from_uint8array(input);
    } else {
      jsMol = hasOptions
        ? this.mod.get_mol(input, JSON.stringify(wasmOptions))
        : this.mod.get_mol(input);
    }

    if (!jsMol) {
      this.logger.handleError(input, 'getMol');
      return null;
    }
    return new Mol(jsMol, this.mod);
  }

  /**
   * Creates a query molecule from a SMARTS string.
   *
   * @param input - SMARTS string
   * @returns A Mol instance, or null if the input is invalid.
   *   Pass `{ throwOnError: true }` to throw a {@link RDKitParseError} instead.
   */
  getQMol(input: string): Mol | null;
  getQMol(input: string, options: Partial<RDKitGetQMolOptions> & { throwOnError: true }): Mol;
  getQMol(input: string, options?: Partial<RDKitGetQMolOptions>): Mol | null;
  getQMol(input: string, options?: Partial<RDKitGetQMolOptions>): Mol | null {
    const { throwOnError = false } = options ?? {};
    this.logger.reset(throwOnError);

    const jsMol = this.mod.get_qmol(input);
    if (!jsMol) {
      this.logger.handleError(input, 'getQMol');
      return null;
    }
    return new Mol(jsMol, this.mod);
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
      molList = fromMolArraytoMolList(mols, this.mod);
    } else {
      molList = fromStringArraytoMolList(mols, this.mod);
    }

    if (molList.size() < 2) {
      molList.delete();
      throw new Error('getMCS requires at least 2 valid molecules');
    }

    const json = options
      ? this.mod.get_mcs_as_json(molList, JSON.stringify(options))
      : this.mod.get_mcs_as_json(molList);

    molList.delete();

    const parsed = JSON.parse(json) as RDKitMCSResult;
    let cachedQmol: Mol | null | undefined;
    const mod = this.mod;

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
      delete() {
        if (cachedQmol && !cachedQmol.isDeleted) {
          cachedQmol.delete();
        }
      },
      [Symbol.dispose]() {
        if (cachedQmol && !cachedQmol.isDeleted) {
          cachedQmol.delete();
        }
      },
    };
  }

  /**
   * Creates a Reaction from a reaction SMARTS, SMILES, or RXN block.
   *
   * @param input - Reaction SMARTS, SMILES, or RXN block string
   * @param options - Reaction parsing options
   * @returns A Reaction instance, or null if the input is invalid.
   *   Pass `{ throwOnError: true }` to throw a {@link RDKitParseError} instead.
   */
  getRxn(input: string, options: Partial<RDKitGetRxnOptions> & { throwOnError: true }): Reaction;
  getRxn(input: string, options?: Partial<RDKitGetRxnOptions>): Reaction | null;
  getRxn(input: string, options?: Partial<RDKitGetRxnOptions>): Reaction | null {
    const { throwOnError = false, ...wasmOptions } = options ?? {};
    this.logger.reset(throwOnError);

    let jsRxn: JSReaction | null = null;
    try {
      jsRxn =
        Object.keys(wasmOptions).length > 0
          ? this.mod.get_rxn(input, JSON.stringify(wasmOptions))
          : this.mod.get_rxn(input);
    } catch {
      jsRxn = null;
    }

    if (!jsRxn) {
      this.logger.handleError(input, 'getRxn');
      return null;
    }
    return new Reaction(jsRxn, this.mod);
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
  ): RGDResult | null {
    return decomposeRGroups(core, molecules, options, this.mod);
  }

  /**
   * Creates an empty {@link SubstructLibraryWrapper} for batch substructure searching.
   *
   * @example
   * ```ts
   * using lib = rdkit.createSubstructLibrary();
   * for (const smi of smilesList) lib.add(smi);
   * const result = lib.getMatches('C1CCCCN1'); // SMARTS query
   * console.log(result.count, Array.from(result.indices));
   * ```
   */
  createSubstructLibrary(options?: SubstructLibraryOptions): SubstructLibraryWrapper {
    return new SubstructLibraryWrapper(this.mod, options);
  }

  molzip(mol1: Mol, mol2: Mol, options?: Partial<RDKitMolZipOptions>): Mol | null {
    const jsMol = options
      ? this.mod.molzip(mol1.jsMol, mol2.jsMol, JSON.stringify(options))
      : this.mod.molzip(mol1.jsMol, mol2.jsMol);
    if (!jsMol) return null;
    return new Mol(jsMol, this.mod);
  }

  computeFingerprintsSimilarity(...args: Parameters<typeof computeFingerprintSimilarity>): number {
    return computeFingerprintSimilarity(...args);
  }

  /**
   * Applies global configuration options to the RDKit module.
   *
   * @param options - One or more options to configure
   */
  configure(options: Partial<RDKitConfigureOptions>): void {
    const {
      preferCoordgen,
      useLegacyStereoPerception,
      allowNonTetrahedralChirality,
      enableLogging,
    } = options;
    if (preferCoordgen !== undefined) this.mod.prefer_coordgen(preferCoordgen);
    if (useLegacyStereoPerception !== undefined)
      this.mod.use_legacy_stereo_perception(useLegacyStereoPerception);
    if (allowNonTetrahedralChirality !== undefined)
      this.mod.allow_non_tetrahedral_chirality(allowNonTetrahedralChirality);
    if (enableLogging !== undefined) this.logger.setEnableLogging(enableLogging);
  }

  /** Returns the RDKit version string */
  get version(): string {
    return this.mod.version();
  }

  /** The underlying RDKitModule for direct access to the raw API */
  get module(): RDKitModule {
    return this.mod;
  }
}
