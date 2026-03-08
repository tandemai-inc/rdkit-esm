import type { JSMol, RDKitModule } from './types/rdkit-typings.d.ts';
import type {
  RDKitGetMolBlockOpt,
  RDKitDepictionDetails,
  RDKitSubstructMatch,
  RDKitDescriptors,
  RDKitJson,
} from './types/rdkit-json-based-typings.d.ts';

/**
 * A wrapper around RDKit's JSMol object providing a typed, camelCase API.
 *
 * @remarks
 * Mol instances are created via RDKit.getMol or RDKit.getQMol,
 * not directly by consumers. The underlying `jsMol` is accessible for advanced use cases.
 *
 * Implements `Disposable` for use with the `using` keyword:
 * ```ts
 * using mol = rdkit.getMol('c1ccccc1')!;
 * const svg = mol.getSvg();
 * // mol is automatically deleted when the scope exits
 * ```
 */
export class Mol implements Disposable {
  #jsMol: JSMol | null;
  #module: RDKitModule;

  constructor(jsMol: JSMol, module: RDKitModule) {
    this.#jsMol = jsMol;
    this.#module = module;
  }

  /**
   * The underlying JSMol object for direct access to the raw API.
   * @throws If the molecule has been deleted.
   */
  get jsMol(): JSMol {
    if (!this.#jsMol) {
      throw new Error('Mol has been deleted');
    }
    return this.#jsMol;
  }

  /**
   * Resolves a substructure query argument to a JSMol.
   * If the query is a string, creates a temporary query molecule.
   * @returns A tuple of [jsMol, shouldDelete] where shouldDelete indicates
   *          whether the caller is responsible for deleting the JSMol.
   */
  private resolveQuery(query: Mol | string): [JSMol, boolean] {
    if (query instanceof Mol) {
      return [query.jsMol, false];
    }
    const qmol = this.#module.get_qmol(query);
    if (!qmol) {
      throw new Error(`Invalid SMARTS query: ${query}`);
    }
    return [qmol, true];
  }

  // -- String representations --

  /** Returns the canonical SMILES string */
  getSmiles(): string {
    return this.jsMol.get_smiles();
  }

  /** Returns the Chemaxon Extended SMILES string */
  getCxSmiles(): string {
    return this.jsMol.get_cxsmiles();
  }

  /** Returns the SMARTS string */
  getSmarts(): string {
    return this.jsMol.get_smarts();
  }

  /**
   * Returns the V2000 Molfile string
   * @param options - Molblock generation options
   */
  getMolblock(options?: Partial<RDKitGetMolBlockOpt>): string {
    const mol = this.jsMol;
    return options
      ? mol.get_molblock(JSON.stringify(options))
      : mol.get_molblock();
  }

  /**
   * Returns the V3000 Molfile string
   * @param options - Molblock generation options
   */
  getV3KMolblock(options?: Partial<RDKitGetMolBlockOpt>): string {
    const mol = this.jsMol;
    return options
      ? mol.get_v3Kmolblock(JSON.stringify(options))
      : mol.get_v3Kmolblock();
  }

  /**
   * Returns the InChI string
   * @param args - Optional InChI CLI arguments
   * @example mol.getInchi("-FixedH -RecMet -SaveOpt -SUU -SLUUD")
   */
  getInchi(args?: string): string {
    const mol = this.jsMol;
    return args ? mol.get_inchi(args) : mol.get_inchi();
  }

  /** Returns the parsed JSON representation of the molecule */
  getJson(): RDKitJson {
    return JSON.parse(this.jsMol.get_json()) as RDKitJson;
  }

  // -- SVG --

  /**
   * Returns an SVG depiction of the molecule
   *
   * @param options - Drawing options including dimensions and highlighting.
   *   When omitted, uses RDKit defaults (250×200).
   *
   * @example
   * // Default SVG
   * const svg = mol.getSvg();
   *
   * // Custom size with atom indices
   * const svg = mol.getSvg({ width: 400, height: 300, addAtomIndices: true });
   *
   * // With atom highlighting
   * const svg = mol.getSvg({ atoms: [0, 1, 2], highlightColour: [1, 0, 0, 1] });
   */
  getSvg(options?: Partial<RDKitDepictionDetails>): string {
    const mol = this.jsMol;
    if (!options) return mol.get_svg();
    return mol.get_svg_with_highlights(JSON.stringify(options));
  }

  // -- Substructure --

  /**
   * Returns the first substructure match
   *
   * @param query - A Mol instance or a SMARTS string to use as query
   * @returns The matched atom and bond indices
   */
  getSubstructMatch(query: Mol | string): RDKitSubstructMatch {
    const mol = this.jsMol;
    const [qmol, shouldDelete] = this.resolveQuery(query);
    try {
      return JSON.parse(mol.get_substruct_match(qmol)) as RDKitSubstructMatch;
    } finally {
      if (shouldDelete) qmol.delete();
    }
  }

  /**
   * Returns all substructure matches
   *
   * @param query - A Mol instance or a SMARTS string to use as query
   * @returns An array of matched atom and bond indices
   */
  getSubstructMatches(query: Mol | string): RDKitSubstructMatch[] {
    const mol = this.jsMol;
    const [qmol, shouldDelete] = this.resolveQuery(query);
    try {
      return JSON.parse(
        mol.get_substruct_matches(qmol),
      ) as RDKitSubstructMatch[];
    } finally {
      if (shouldDelete) qmol.delete();
    }
  }

  // -- Descriptors --

  /** Returns molecular descriptors as a typed object */
  getDescriptors(): RDKitDescriptors {
    return JSON.parse(this.jsMol.get_descriptors()) as RDKitDescriptors;
  }

  // -- Fingerprints --

  /**
   * Returns the Morgan fingerprint as a bit string
   * @param options - Fingerprint options
   * @param options.radius - Fingerprint radius
   * @param options.nBits - Fingerprint length
   */
  getMorganFp(options?: { radius?: number; nBits?: number }): string {
    const mol = this.jsMol;
    return options
      ? mol.get_morgan_fp(JSON.stringify(options))
      : mol.get_morgan_fp();
  }

  // -- Properties --

  /**
   * Checks whether the molecule has a given property
   * @param key - Property name
   */
  hasProp(key: string): boolean {
    return this.jsMol.has_prop(key);
  }

  /**
   * Gets a property value from the molecule
   * @param key - Property name
   */
  getProp(key: string): string {
    return this.jsMol.get_prop(key);
  }

  /**
   * Sets a property on the molecule
   * @param key - Property name
   * @param val - Property value
   */
  setProp(key: string, val: string): boolean {
    return this.jsMol.set_prop(key, val);
  }

  /**
   * Clears a property from the molecule
   * @param key - Property name
   */
  clearProp(key: string): boolean {
    return this.jsMol.clear_prop(key);
  }

  // -- Molecule info --

  /** Returns true if the molecule's structure is valid */
  isValid(): boolean {
    return this.jsMol.is_valid();
  }

  /** Returns the number of atoms in the molecule */
  getNumAtoms(): number {
    return this.jsMol.get_num_atoms();
  }

  /** Returns the number of bonds in the molecule */
  getNumBonds(): number {
    return this.jsMol.get_num_bonds();
  }

  // -- Lifecycle --

  /**
   * Deletes the underlying C++ molecule object from memory.
   *
   * @see {@link https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#memory-management | Emscripten docs}
   */
  delete(): void {
    this.#jsMol?.delete();
    this.#jsMol = null;
  }

  /** Disposable support — allows use with the `using` keyword */
  [Symbol.dispose](): void {
    this.delete();
  }
}
