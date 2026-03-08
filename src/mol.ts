import type { JSMol, RDKitModule } from './types/rdkit-typings.d.ts';
import type {
  RDKitGetMolBlockOpt,
  RDKitDepictionDetails,
  RDKitSubstructMatch,
  RDKitDescriptors,
  RDKitJson,
  RDKitStereoTags,
  RDKitRemoveHsOptions,
  RDKitAlignedCoordsOpt,
  RDKitMorganFPOptions,
  RDKitPatternFPOptions,
  RDKitTopologicalTorsionFPOptions,
  RDKitRdkitFpOptions,
  RDKitAtomPairFPOptions,
} from './types/rdkit-json-based-typings.d.ts';
import { MolCollection } from './mol-list.ts';

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

  /** Returns the Chemaxon Extended SMARTS string */
  getCxSmarts(): string {
    return this.jsMol.get_cxsmarts();
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

  /** Returns an unsigned integer array representation of the molecule */
  getAsUint8Array(): Uint8Array {
    return this.jsMol.get_as_uint8array();
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
   */
  getMorganFp(options?: Partial<RDKitMorganFPOptions>): string {
    const mol = this.jsMol;
    return options
      ? mol.get_morgan_fp(JSON.stringify(options))
      : mol.get_morgan_fp();
  }

  /** Returns the pattern fingerprint as a bit string */
  getPatternFp(options?: Partial<RDKitPatternFPOptions>): string {
    const mol = this.jsMol;
    return options
      ? mol.get_pattern_fp(JSON.stringify(options))
      : mol.get_pattern_fp();
  }

  /** Returns the topological torsion fingerprint as a bit string */
  getTopologicalTorsionFp(
    options?: Partial<RDKitTopologicalTorsionFPOptions>,
  ): string {
    const mol = this.jsMol;
    return options
      ? mol.get_topological_torsion_fp(JSON.stringify(options))
      : mol.get_topological_torsion_fp();
  }

  /** Returns the RDKit fingerprint as a bit string */
  getRdkitFp(options?: Partial<RDKitRdkitFpOptions>): string {
    const mol = this.jsMol;
    return options
      ? mol.get_rdkit_fp(JSON.stringify(options))
      : mol.get_rdkit_fp();
  }

  /** Returns the atom pair fingerprint as a bit string */
  getAtomPairFp(options?: Partial<RDKitAtomPairFPOptions>): string {
    const mol = this.jsMol;
    return options
      ? mol.get_atom_pair_fp(JSON.stringify(options))
      : mol.get_atom_pair_fp();
  }

  /** Returns the MACCS fingerprint as a bit string (fixed 167-bit) */
  getMaccsFp(): string {
    return this.jsMol.get_maccs_fp();
  }

  /** Returns the Morgan fingerprint as a Uint8Array */
  getMorganFpAsUint8Array(options?: Partial<RDKitMorganFPOptions>): Uint8Array {
    const mol = this.jsMol;
    return options
      ? mol.get_morgan_fp_as_uint8array(JSON.stringify(options))
      : mol.get_morgan_fp_as_uint8array();
  }

  /** Returns the pattern fingerprint as a Uint8Array */
  getPatternFpAsUint8Array(
    options?: Partial<RDKitPatternFPOptions>,
  ): Uint8Array {
    const mol = this.jsMol;
    return options
      ? mol.get_pattern_fp_as_uint8array(JSON.stringify(options))
      : mol.get_pattern_fp_as_uint8array();
  }

  /** Returns the topological torsion fingerprint as a Uint8Array */
  getTopologicalTorsionFpAsUint8Array(
    options?: Partial<RDKitTopologicalTorsionFPOptions>,
  ): Uint8Array {
    const mol = this.jsMol;
    return options
      ? mol.get_topological_torsion_fp_as_uint8array(JSON.stringify(options))
      : mol.get_topological_torsion_fp_as_uint8array();
  }

  /** Returns the RDKit fingerprint as a Uint8Array */
  getRdkitFpAsUint8Array(options?: Partial<RDKitRdkitFpOptions>): Uint8Array {
    const mol = this.jsMol;
    return options
      ? mol.get_rdkit_fp_as_uint8array(JSON.stringify(options))
      : mol.get_rdkit_fp_as_uint8array();
  }

  /** Returns the atom pair fingerprint as a Uint8Array */
  getAtomPairFpAsUint8Array(
    options?: Partial<RDKitAtomPairFPOptions>,
  ): Uint8Array {
    const mol = this.jsMol;
    return options
      ? mol.get_atom_pair_fp_as_uint8array(JSON.stringify(options))
      : mol.get_atom_pair_fp_as_uint8array();
  }

  /** Returns the MACCS fingerprint as a Uint8Array */
  getMaccsFpAsUint8Array(): Uint8Array {
    return this.jsMol.get_maccs_fp_as_uint8array();
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

  /**
   * Returns the list of property names
   * @param options - Filter options
   */
  getPropList(options?: {
    includePrivate?: boolean;
    includeComputed?: boolean;
  }): string[] {
    const mol = this.jsMol;
    const sl = options
      ? mol.get_prop_list(
          options.includePrivate ?? false,
          options.includeComputed ?? false,
        )
      : mol.get_prop_list();
    const result: string[] = [];
    for (let i = 0; i < sl.size(); i++) {
      result.push(sl.get(i));
    }
    sl.delete();
    return result;
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

  /** Returns 0 if no coords, 2 for 2D, 3 for 3D */
  hasCoords(): 0 | 2 | 3 {
    return this.jsMol.has_coords();
  }

  /** Returns stereo tags (CIP codes) for the molecule */
  getStereoTags(): RDKitStereoTags {
    return JSON.parse(this.jsMol.get_stereo_tags()) as RDKitStereoTags;
  }

  // -- Aromatic / Kekule --

  /** Returns the V2000 Molfile representation of the aromatic form */
  getAromaticForm(): string {
    return this.jsMol.get_aromatic_form();
  }

  /** Returns the V2000 Molfile representation of the Kekule form */
  getKekuleForm(): string {
    return this.jsMol.get_kekule_form();
  }

  /** Converts the molecule to aromatic form in place */
  convertToAromaticForm(): void {
    this.jsMol.convert_to_aromatic_form();
  }

  /** Converts the molecule to Kekule form in place */
  convertToKekuleForm(): void {
    this.jsMol.convert_to_kekule_form();
  }

  // -- Hydrogen methods --

  /**
   * Returns a V2000 Molfile string with explicit hydrogens removed
   * @param options - Options controlling which hydrogens to remove
   */
  removeHs(options?: Partial<RDKitRemoveHsOptions>): string {
    const mol = this.jsMol;
    return options
      ? mol.remove_hs(JSON.stringify(options))
      : mol.remove_hs();
  }

  /**
   * Removes explicit hydrogens from the molecule in place
   * @param options - Options controlling which hydrogens to remove
   */
  removeHsInPlace(options?: Partial<RDKitRemoveHsOptions>): boolean {
    const mol = this.jsMol;
    return options
      ? mol.remove_hs_in_place(JSON.stringify(options))
      : mol.remove_hs_in_place();
  }

  /** Returns a V2000 Molfile string with explicit hydrogens added */
  addHs(): string {
    return this.jsMol.add_hs();
  }

  /** Adds explicit hydrogens to the molecule in place */
  addHsInPlace(): boolean {
    return this.jsMol.add_hs_in_place();
  }

  // -- Coordinate generation --

  /**
   * Generates new 2D coordinates for the molecule
   * @param useCoordGen - Use the CoordGen algorithm
   */
  setNewCoords(useCoordGen?: boolean): boolean {
    const mol = this.jsMol;
    return useCoordGen !== undefined
      ? mol.set_new_coords(useCoordGen)
      : mol.set_new_coords();
  }

  /**
   * Returns a V2000 Molfile string with newly generated coordinates
   * @param useCoordGen - Use the CoordGen algorithm
   */
  getNewCoords(useCoordGen?: boolean): string {
    const mol = this.jsMol;
    return useCoordGen !== undefined
      ? mol.get_new_coords(useCoordGen)
      : mol.get_new_coords();
  }

  /**
   * Aligns molecule coordinates with a template molecule
   * @param template - Template molecule to align to
   * @param options - Alignment options
   */
  generateAlignedCoords(
    template: Mol,
    options?: Partial<RDKitAlignedCoordsOpt>,
  ): string {
    return this.jsMol.generate_aligned_coords(
      template.jsMol,
      JSON.stringify(options ?? {}),
    );
  }

  // -- Depiction --

  /**
   * Normalizes the depiction of the molecule
   * @param options - Normalization options
   */
  normalizeDepiction(options?: {
    canonicalize?: number;
    scaleFactor?: number;
  }): number {
    const mol = this.jsMol;
    if (!options) return mol.normalize_depiction();
    const { canonicalize, scaleFactor } = options;
    if (scaleFactor !== undefined && canonicalize !== undefined) {
      return mol.normalize_depiction(canonicalize, scaleFactor);
    }
    if (canonicalize !== undefined) {
      return mol.normalize_depiction(canonicalize);
    }
    return mol.normalize_depiction();
  }

  /**
   * Straightens the depiction of the molecule
   * @param smallRotation - Only apply small rotations
   */
  straightenDepiction(smallRotation?: boolean): void {
    this.jsMol.straighten_depiction(smallRotation);
  }

  // -- Abbreviations --

  /**
   * Condenses functional group abbreviations in the molecule
   * @param options - Abbreviation options
   */
  condenseAbbreviations(options?: {
    maxCoverage?: number;
    useLinkers?: boolean;
  }): string {
    const mol = this.jsMol;
    if (!options) return mol.condense_abbreviations();
    const { maxCoverage, useLinkers } = options;
    if (maxCoverage !== undefined && useLinkers !== undefined) {
      return mol.condense_abbreviations(maxCoverage, useLinkers);
    }
    return mol.condense_abbreviations();
  }

  // -- Canvas drawing --

  /**
   * Draws the molecule to an HTML5 canvas
   * @param canvas - Target canvas element
   * @param width - Width in pixels
   * @param height - Height in pixels
   */
  drawToCanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
  ): void;
  /**
   * Draws the molecule to an HTML5 canvas with highlighting options
   * @param canvas - Target canvas element
   * @param options - Drawing options including dimensions and highlighting
   */
  drawToCanvas(
    canvas: HTMLCanvasElement,
    options: Partial<RDKitDepictionDetails>,
  ): void;
  drawToCanvas(
    canvas: HTMLCanvasElement,
    widthOrOptions: number | Partial<RDKitDepictionDetails>,
    height?: number,
  ): void {
    const mol = this.jsMol;
    if (typeof widthOrOptions === 'number') {
      mol.draw_to_canvas(canvas, widthOrOptions, height!);
    } else {
      mol.draw_to_canvas_with_highlights(
        canvas,
        JSON.stringify(widthOrOptions),
      );
    }
  }

  /**
   * Draws the molecule to an HTML5 canvas with an offset
   * @param canvas - Target canvas element
   * @param offsetX - Horizontal offset in pixels
   * @param offsetY - Vertical offset in pixels
   * @param width - Width in pixels
   * @param height - Height in pixels
   */
  drawToCanvasWithOffset(
    canvas: HTMLCanvasElement,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number,
  ): void {
    this.jsMol.draw_to_canvas_with_offset(canvas, offsetX, offsetY, width, height);
  }

  // -- Fragments --

  /**
   * Returns the disconnected fragments of the molecule
   * @returns An object with fragment-to-atom mappings and a MolCollection of fragments
   */
  getFrags(): {
    frags: number[];
    fragsMolAtomMapping: number[][];
    mols: MolCollection;
  } {
    const result = this.jsMol.get_frags();
    const parsed = JSON.parse(result.mappings) as {
      frags: number[];
      fragsMolAtomMapping: number[][];
    };
    return {
      ...parsed,
      mols: new MolCollection(result.molList, this.#module),
    };
  }

  // -- Copy --

  /** Returns a copy of the molecule */
  copy(): Mol {
    return new Mol(this.jsMol.copy(), this.#module);
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
