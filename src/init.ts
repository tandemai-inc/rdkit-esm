import initRDKitModule from './minimalib/RDKit_minimal.js';
// @ts-expect-error -- Vite/Rolldown ?url import directive
import wasmUrl from './minimalib/RDKit_minimal.wasm?url';

import { Mol } from './mol.ts';
import { MolCollection } from './mol-list.ts';
import { Reaction } from './reaction.ts';
import type { RDKitModule } from './types/rdkit-typings.d.ts';
import type {
  RDKitGetMolOpt,
  RDKitGetMCSOpt,
  RDKitMCSResult,
  RDKitRxnDetails,
} from './types/rdkit-json-based-typings.d.ts';

/**
 * Resolves the WASM URL for the current environment.
 * In browsers, uses `import.meta.url` to resolve the WASM filename relative
 * to the JS bundle's location — works regardless of where the page is served.
 * In Node.js (e.g. vitest), the `?url` import returns a root-relative path
 * like `/src/minimalib/RDKit_minimal.wasm` which needs to be joined with cwd.
 */
function resolveWasmUrl(): string {
  const url = wasmUrl as string;
  const isNode =
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
  if (isNode && url.startsWith('/') && !url.startsWith('//')) {
    return process.cwd() + url;
  }
  return new URL(url, import.meta.url).href;
}

/** Options for initializing the RDKit module */
export interface InitRDKitOptions {
  /**
   * Custom function to locate the WASM file.
   * By default, the WASM file is resolved relative to the bundled JS output
   * using the Vite/Rolldown `?url` import.
   */
  locateFile?: () => string;
}

/** The main RDKit wrapper interface returned by {@link initRDKit} */
export interface RDKit {
  /**
   * Creates a molecule from a variety of input formats.
   *
   * @param input - SMILES, SMARTS, MolFile, or JSON string
   * @param options - Molecule parsing options
   * @returns A Mol instance, or null if the input is invalid
   */
  getMol(input: string, options?: Partial<RDKitGetMolOpt>): Mol | null;

  /**
   * Creates a query molecule from a SMARTS string.
   *
   * @param input - SMARTS string
   * @returns A Mol instance, or null if the input is invalid
   */
  getQMol(input: string): Mol | null;

  /**
   * Creates a MolCollection, optionally populated from SMILES strings.
   *
   * @param smiles - Optional array of SMILES strings to populate the collection.
   *   Invalid SMILES are silently skipped.
   * @returns A new MolCollection instance
   */
  getMolCollection(smiles?: string[]): MolCollection;

  /**
   * Computes the Maximum Common Substructure (MCS) of a set of molecules.
   *
   * @param mols - A MolCollection or an array of SMILES strings
   * @param options - MCS algorithm options
   * @returns An MCSResult with match info and a lazy `qmol` getter
   */
  getMCS(mols: MolCollection | string[], options?: Partial<RDKitGetMCSOpt>): MCSResult;

  /**
   * Creates a Reaction from a reaction SMARTS, SMILES, or RXN block.
   *
   * @param input - Reaction SMARTS, SMILES, or RXN block string
   * @param options - Reaction parsing options
   * @returns A Reaction instance, or null if the input is invalid
   */
  getRxn(input: string, options?: Partial<RDKitRxnDetails>): Reaction | null;

  /** Returns the RDKit version string */
  version(): string;

  /** The underlying RDKitModule for direct access to the raw API */
  readonly module: RDKitModule;
}

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
 * Initializes the RDKit WASM module and returns a typed wrapper.
 *
 * @param options - Initialization options
 * @returns A promise that resolves to the RDKit wrapper
 *
 * @example
 * ```ts
 * const rdkit = await initRDKit();
 * const mol = rdkit.getMol('c1ccccc1');
 * ```
 */
export async function initRDKit(options?: InitRDKitOptions): Promise<RDKit> {
  const locateFile = options?.locateFile ?? (() => resolveWasmUrl());

  const mod = await initRDKitModule({ locateFile });

  return {
    getMol(input: string, opts?: Partial<RDKitGetMolOpt>): Mol | null {
      const jsMol = opts ? mod.get_mol(input, JSON.stringify(opts)) : mod.get_mol(input);
      if (!jsMol || !jsMol.is_valid()) {
        jsMol?.delete();
        return null;
      }
      return new Mol(jsMol, mod);
    },

    getQMol(input: string): Mol | null {
      const jsMol = mod.get_qmol(input);
      if (!jsMol) {
        return null;
      }
      return new Mol(jsMol, mod);
    },

    getMolCollection(input?: string[]): MolCollection {
      if (input) {
        return MolCollection.fromArray(input, mod);
      }
      return new MolCollection(new mod.MolList(), mod);
    },

    getMCS(mols: MolCollection | string[], options?: Partial<RDKitGetMCSOpt>): MCSResult {
      const isArray = Array.isArray(mols);
      const collection = isArray ? MolCollection.fromArray(mols, mod) : mols;

      const json = options
        ? mod.get_mcs_as_json(collection.molList, JSON.stringify(options))
        : mod.get_mcs_as_json(collection.molList);

      if (isArray) {
        collection.delete();
      }

      const parsed = JSON.parse(json) as RDKitMCSResult;
      let cachedQmol: Mol | null | undefined;

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
    },

    getRxn(input: string, options?: Partial<RDKitRxnDetails>): Reaction | null {
      try {
        const jsRxn = options ? mod.get_rxn(input, JSON.stringify(options)) : mod.get_rxn(input);
        if (!jsRxn) return null;
        return new Reaction(jsRxn, mod);
      } catch {
        return null;
      }
    },

    version(): string {
      return mod.version();
    },

    get module() {
      return mod;
    },
  };
}
