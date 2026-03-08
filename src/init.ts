import initRDKitModule from './minimalib/RDKit_minimal.js';
// @ts-expect-error -- Vite/Rolldown ?url import directive
import wasmUrl from './minimalib/RDKit_minimal.wasm?url';

import { Mol } from './mol.ts';
import type { RDKitModule } from './types/rdkit-typings.d.ts';
import type { RDKitGetMolOpt } from './types/rdkit-json-based-typings.d.ts';

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
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null;
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

  /** Returns the RDKit version string */
  version(): string;

  /** The underlying RDKitModule for direct access to the raw API */
  readonly module: RDKitModule;
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
      const jsMol = opts
        ? mod.get_mol(input, JSON.stringify(opts))
        : mod.get_mol(input);
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

    version(): string {
      return mod.version();
    },

    get module() {
      return mod;
    },
  };
}
