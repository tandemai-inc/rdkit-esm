import type {
  RDKitModule,
  SubstructLibrary as RawSubstructLibrary,
  JSMol,
} from './types/rdkit-minimalib-typings';
import type {
  SubstructLibraryOptions,
  SubstructLibraryAddOptions,
  SubstructLibrarySearchOptions,
} from './types/rdkit-esm.typings.ts';
import { Mol } from './mol.ts';
import { Fingerprint } from './fingerprints/fingerprint.ts';

export type SubstructLibraryEntry = {
  /** Index in the library */
  index: number;
  /** RDKit-canonical SMILES */
  smiles: string;
  /** Pattern fingerprint used for pre-screening */
  patternFp: Fingerprint;
  /**
   * Lazily creates a Mol from the stored SMILES.
   * Returns null if the molecule is invalid.
   *
   * **WARNING:** The caller is responsible for explicitly deleting this
   * object (via `.delete()` or `using`) to avoid memory leaks.
   */
  get mol(): Mol | null;
  delete(): void;
  [Symbol.dispose](): void;
};

/** Result of a {@link SubstructLibraryWrapper.getMatches} call */
export type SubstructLibrarySearchResult = {
  /** Matching molecule indices */
  readonly indices: Uint32Array;
  /** Number of matches (same as `indices.length`) */
  readonly count: number;
  /** Iterate over the matching library entries */
  [Symbol.iterator](): Iterator<SubstructLibraryEntry>;
};

class SubstructLibraryEntryImpl implements SubstructLibraryEntry {
  readonly index: number;
  readonly smiles: string;
  readonly patternFp: Fingerprint;
  private readonly module: RDKitModule;
  private _cachedMol: Mol | null | undefined;

  constructor(i: number, smiles: string, patternFpU8: Uint8Array, module: RDKitModule) {
    this.index = i;
    this.smiles = smiles;
    this.patternFp = new Fingerprint(patternFpU8, undefined, 'Pattern');
    this.module = module;
  }

  get mol(): Mol | null {
    if (this._cachedMol !== undefined) return this._cachedMol;
    const jsMol = this.module.get_mol(this.smiles);
    this._cachedMol = jsMol ? new Mol(jsMol, this.module) : null;
    return this._cachedMol;
  }

  delete(): void {
    if (!this._cachedMol) return;
    this._cachedMol.delete();
    this._cachedMol = null;
  }

  [Symbol.dispose](): void {
    this.delete();
  }
}

/**
 * A collection of molecules for efficient batch substructure searching.
 *
 * Molecules are stored as canonical SMILES with pre-computed pattern
 * fingerprints used to pre-screen candidates before full substructure matching.
 *
 * @example
 * ```ts
 * using lib = rdkit.createSubstructLibrary();
 * for (const smi of smilesList) lib.add(smi);
 * const result = lib.getMatches('C1CCCCN1');
 * console.log(result.count, Array.from(result.indices));
 * ```
 */
export class SubstructLibraryWrapper implements Disposable {
  protected readonly lib: RawSubstructLibrary;
  protected readonly module: RDKitModule;

  /** use {@link RDKit.createSubstructLibraryWrapper} */
  constructor(module: RDKitModule, options?: SubstructLibraryOptions) {
    this.module = module;
    if (options?.disableFingerprints) {
      this.lib = new module.SubstructLibrary(0);
    } else if (options?.nBits !== undefined) {
      this.lib = new module.SubstructLibrary(options.nBits);
    } else {
      this.lib = new module.SubstructLibrary();
    }
  }

  /**
   * Add a molecule to the library.
   * - `Mol` instance: added via `add_mol` (already parsed and sanitized)
   * - `string`: treated as SMILES; validated unless `options.trusted` is set
   *
   * @returns the index of the added molecule, or -1 on failure
   */
  add(mol: Mol | string, options?: SubstructLibraryAddOptions): number {
    if (mol instanceof Mol) {
      return this.lib.add_mol(mol.jsMol);
    }
    if (options?.trusted) {
      return this.lib.add_trusted_smiles(mol);
    }
    return this.lib.add_smiles(mol);
  }

  /**
   * Add a molecule with a pre-computed pattern fingerprint.
   * Skips both SMILES validation and fingerprint computation.
   *
   * @param smiles RDKit-canonical SMILES string
   * @param fp pre-computed pattern fingerprint (a `Fingerprint` object)
   * @returns the index of the added molecule
   */
  addPrecomputed(smiles: string, fp: Fingerprint): number {
    return this.lib.add_trusted_smiles_and_pattern_fp(smiles, fp.fpU8);
  }

  /**
   * Returns the entry at index `i`: stored SMILES, pattern fingerprint, and a lazy mol getter.
   *
   * The `mol` getter lazily allocates a WASM object on first access.
   * **WARNING:** The caller is responsible for deleting it via `.delete()` or `using`.
   *
   * @example Iterate for serialization:
   * ```ts
   * for (let i = 0; i < lib.size; i++) {
   *   const { smiles, patternFp } = lib.at(i);
   * }
   * ```
   */
  at(i: number): SubstructLibraryEntry {
    const smiles = this.lib.get_trusted_smiles(i);
    const u8 = this.lib.get_pattern_fp_as_uint8array(i);
    return new SubstructLibraryEntryImpl(i, smiles, u8, this.module);
  }

  /**
   * Runs a substructure search and returns a result object with `count`,
   * `indices`, and an iterator that yields {@link SubstructLibraryEntry} objects.
   *
   * @param query `Mol` instance or SMARTS string
   */
  getMatches(
    query: Mol | string,
    options?: SubstructLibrarySearchOptions,
  ): SubstructLibrarySearchResult {
    const [qmol, shouldDelete] = this.resolveQuery(query);

    const opts = { useChirality: false, maxResults: -1, ...options };
    const indices = this.lib.get_matches_as_uint32array(
      qmol,
      opts.useChirality,
      0,
      opts.maxResults,
    );
    if (shouldDelete) qmol.delete();

    const lib = this;
    return {
      indices,
      get count() {
        return indices.length;
      },
      *[Symbol.iterator]() {
        for (const i of indices) {
          yield lib.at(i);
        }
      },
    };
  }

  /** Number of molecules in the library */
  get size(): number {
    return this.lib.size();
  }

  delete(): void {
    this.lib.delete();
  }

  [Symbol.dispose](): void {
    this.delete();
  }

  /** SMARTS strings resolve to a QueryMol that must be deleted internally */
  private resolveQuery(query: Mol | string): [JSMol, boolean] {
    if (query instanceof Mol) {
      return [query.jsMol, false];
    }
    const qmol = this.module.get_qmol(query);
    if (!qmol) {
      throw new Error(`Invalid SMARTS query: ${query}`);
    }
    return [qmol, true];
  }
}
