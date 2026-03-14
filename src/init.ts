import initRDKitModule from '../MinimalLib/dist/RDKit_minimal.js';
// @ts-expect-error -- Vite/Rolldown ?url import directive
import wasmUrl from '../MinimalLib/dist/RDKit_minimal.wasm?url';

import { RDKit } from './rdkit.ts';

/**
 * Resolves the WASM URL for the current environment.
 * In browsers, uses `import.meta.url` to resolve the WASM filename relative
 * to the JS bundle's location — works regardless of where the page is served.
 */
function resolveWasmUrl(): string {
  const url = wasmUrl as string;
  return new URL(url, import.meta.url).href;
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
  const moduleArgs: Record<string, unknown> = { locateFile };

  // The emscripten module is compiled for web/worker only — in Node there is
  // no fetch/XHR so we read the WASM binary from disk and pass it directly.
  if (typeof process !== 'undefined' && process.versions?.node) {
    const fs = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const wasmFileUrl = locateFile();
    let wasmPath = wasmFileUrl.startsWith('file://')
      ? fileURLToPath(wasmFileUrl)
      : wasmFileUrl;
    // In dev (vitest), the ?url import returns a root-relative path like
    // /MinimalLib/dist/RDKit_minimal.wasm which new URL() maps to the
    // filesystem root. Fall back to resolving from cwd in that case.
    if (!fs.existsSync(wasmPath)) {
      const { join } = await import('node:path');
      wasmPath = join(process.cwd(), wasmPath);
    }
    moduleArgs.wasmBinary = fs.readFileSync(wasmPath);
  }

  const mod = await initRDKitModule(moduleArgs);

  return new constructor(mod);
}
