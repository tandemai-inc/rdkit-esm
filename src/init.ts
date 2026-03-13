import initRDKitModule from '../MinimalLib/dist/RDKit_minimal.js';
// @ts-expect-error -- Vite/Rolldown ?url import directive
import wasmUrl from '../MinimalLib/dist/RDKit_minimal.wasm?url';

import { RDKit } from './rdkit.ts';

const ENVIRONMENT_IS_NODE =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

/**
 * Resolves the WASM URL for the current environment.
 * In browsers, uses `import.meta.url` to resolve the WASM filename relative
 * to the JS bundle's location — works regardless of where the page is served.
 */
function resolveWasmUrl(): string {
  const url = wasmUrl as string;
  return new URL(url, import.meta.url).href;
}

/**
 * In Node the emscripten module is compiled for web/worker only,
 * so `fetch` / XHR are unavailable. Read the WASM binary from disk
 * and hand it to the module via `wasmBinary`.
 */
async function loadWasmBinary(): Promise<ArrayBuffer | undefined> {
  if (!ENVIRONMENT_IS_NODE) return undefined;
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const { dirname, resolve } = await import('node:path');
  // Resolve the .wasm path relative to this source file, not via the ?url
  // import which produces a root-relative path that new URL() misinterprets.
  const thisDir = dirname(fileURLToPath(import.meta.url));
  const wasmPath = resolve(thisDir, '../MinimalLib/dist/RDKit_minimal.wasm');
  const buf = await readFile(wasmPath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/** Options for initializing the RDKit module */
export interface InitRDKitOptions {
  /**
   * Custom function to locate the WASM file.
   * By default, the WASM file is resolved relative to the bundled JS output
   * using the Vite/Rolldown `?url` import.
   */
  locateFile: () => string;
}

/**
 * Initializes the RDKit WASM module and returns a typed wrapper.
 *
 * @param options - Initialization options
 * @params constructor - Advanced use only. Optional custom constructor to allow extending the RDKit class
 * @returns A promise that resolves to the RDKit wrapper
 *
 * @example
 * ```ts
 * const rdkit = await initRDKit();
 * const mol = rdkit.getMol('c1ccccc1');
 * ```
 *
 * @example with custom constructor
 * ```ts
 * class ExtendedRDKit extends RDKit {
 *   constructor(mod: RDKitModule) {
 *     super(mod);
 *     console.log("ExtendedRDKit initialized. Version:", this.version);
 *   }
 * }
 *
 * const initExtendedRDKit = async () => {
 *   const rdkit = await initRDKit({}, ExtendedRDKit);
 *   return rdkit;
 * };
 * ```
 */
export async function initRDKit(options?: Partial<InitRDKitOptions>): Promise<RDKit>;
export async function initRDKit<T extends typeof RDKit>(
  options: Partial<InitRDKitOptions> | undefined,
  constructor: T,
): Promise<InstanceType<T>>;
export async function initRDKit(
  options?: Partial<InitRDKitOptions>,
  constructor: typeof RDKit = RDKit,
): Promise<RDKit> {
  const locateFile = options?.locateFile ?? (() => resolveWasmUrl());
  const wasmBinary = await loadWasmBinary();

  const mod = await initRDKitModule({ locateFile, wasmBinary });

  return new constructor(mod);
}
