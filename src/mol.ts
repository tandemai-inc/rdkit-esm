import type { JSMol, RDKitModule } from './types/rdkit-minimalib-typings';
import type {
  RDKitGetMolBlockOptions,
  RDKitDepictionDetails,
  RDKitSubstructMatch,
  RDKitDescriptors,
  RDKitJson,
  RDKitStereoTags,
  RDKitRemoveHsOptions,
  RDKitMorganFPOptions,
  RDKitPatternFPOptions,
  RDKitTopologicalTorsionFPOptions,
  RDKitRdkitFpOptions,
  RDKitAtomPairFPOptions,
  RDKitAlignedCoordsOptions,
  RDKitGetSmilesOptions,
  RDKitMolZipOptions,
  RDKitGetFragsOptions,
} from './types/rdkit-minimalib-json-typings';
import { MolArray } from './mol-array.ts';
import type { InChI_Flags } from './types/inchi';
import type {
  RDKitGetCxSmilesOptions,
  RDKitGetUint8ArrayOptions,
  RDKitCondenseAbbreviationsOptions,
  RDKitMmpaFragsOptions,
} from './types/rdkit-esm.typings.ts';
import { DEFAULT_MAX_COVERAGE, DEFAULT_USE_LINKERS } from './abbreviations/abbreviations.ts';
import { buildCxSmilesRawOptions } from './formats/cxsmiles.ts';
import { buildGetMolAsUint8ArrayOptions } from './formats/pickle.ts';
import { Fingerprint } from './fingerprints/fingerprint.ts';

export type MMPAFragmentation = {
  /**
   * Core fragment with dummy atoms ([*:n]) at cut points.
   *
   * @remarks For single-cut fragmentations, this is the largest fragment
   * after splitting the combined sidechains mol. This differs from the
   * raw RDKit result, which returns no core for single-cut pairs.
   */
  core: Mol;
  /**
   * Sidechains fragment with dummy atoms ([*:n]) at cut points.
   * For 2+ cut, this is the combined sidechains mol returned by RDKit.
   * For single-cut, this is the smallest fragment after splitting.
   * Distinct sidechains can be obtained with `sidechains.getFrags()`.
   * `molzip(core, sidechains)` reconstructs the original molecule.
   */
  sidechains: Mol;
};

export type RDKitMmpaFragsResult = {
  /** Core fragments. */
  cores: MolArray;
  /** Sidechains fragments. */
  sidechains: MolArray;
  /** Number of fragmentations. */
  readonly length: number;
  /** Iterate over fragmentations by index. */
  [Symbol.iterator](): Iterator<MMPAFragmentation>;
  delete(): void;
  [Symbol.dispose](): void;
};

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
 * const svg = mol.getSVG();
 * // mol is automatically deleted when the scope exits
 * ```
 */
export class Mol implements Disposable {
  protected _jsMol: JSMol | null;
  protected module: RDKitModule;

  constructor(jsMol: JSMol, module: RDKitModule) {
    this._jsMol = jsMol;
    this.module = module;
  }

  /**
   * The underlying JSMol object for direct access to the raw API.
   * @throws If the molecule has been deleted.
   */
  get jsMol(): JSMol {
    if (!this._jsMol) {
      throw new Error('Mol has been deleted');
    }
    return this._jsMol;
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
    const qmol = this.module.get_qmol(query);
    if (!qmol) {
      throw new Error(`Invalid SMARTS query: ${query}`);
    }
    return [qmol, true];
  }

  // -- String representations --

  /** Returns the canonical SMILES string */
  getSmiles(options?: Partial<RDKitGetSmilesOptions>): string {
    return options ? this.jsMol.get_smiles(JSON.stringify(options)) : this.jsMol.get_smiles();
  }

  /** Returns the Chemaxon Extended SMILES string */
  getCxSmiles(options?: Partial<RDKitGetCxSmilesOptions>): string {
    if (!options) return this.jsMol.get_cxsmiles();
    return this.jsMol.get_cxsmiles(JSON.stringify(buildCxSmilesRawOptions(options)));
  }

  /** Returns the SMARTS string */
  getSmarts(options?: Partial<RDKitGetSmilesOptions>): string {
    return options ? this.jsMol.get_smarts(JSON.stringify(options)) : this.jsMol.get_smarts();
  }

  /** Returns the Chemaxon Extended SMARTS string */
  getCxSmarts(options?: Partial<RDKitGetCxSmilesOptions>): string {
    if (!options) return this.jsMol.get_cxsmarts();
    return this.jsMol.get_cxsmarts(JSON.stringify(buildCxSmilesRawOptions(options)));
  }

  /**
   * Returns the V2000 Molfile string
   * @param options - Molblock generation options
   */
  getMolblock(options?: Partial<RDKitGetMolBlockOptions>): string {
    const mol = this.jsMol;
    return options ? mol.get_molblock(JSON.stringify(options)) : mol.get_molblock();
  }

  /**
   * Returns the V3000 Molfile string
   * @param options - Molblock generation options
   */
  getV2KMolblock(options?: Partial<RDKitGetMolBlockOptions>): string {
    const mol = this.jsMol;
    return options ? mol.get_v2Kmolblock(JSON.stringify(options)) : mol.get_v2Kmolblock();
  }

  /**
   * Returns the V3000 Molfile string
   * @param options - Molblock generation options
   */
  getV3KMolblock(options?: Partial<RDKitGetMolBlockOptions>): string {
    const mol = this.jsMol;
    return options ? mol.get_v3Kmolblock(JSON.stringify(options)) : mol.get_v3Kmolblock();
  }

  /**
   * Returns the InChI string
   * @param args - Optional InChI CLI arguments
   * @example mol.getInchi(["FixedH", "RecMet", "SaveOpt", "SUU", "SLUUD"])
   */
  getInchi(args?: InChI_Flags[]): string {
    const mol = this.jsMol;
    return args ? mol.get_inchi(`-${args.join(' -')}`) : mol.get_inchi();
  }

  /**
   * Returns the InChIKey string
   * @param args - Optional InChI CLI arguments
   * @example mol.getInchi(["FixedH", "RecMet", "SaveOpt", "SUU", "SLUUD"])
   */
  getInchikey(args?: InChI_Flags[]): string {
    const inchi = this.getInchi(args);
    return this.module.get_inchikey_for_inchi(inchi);
  }

  /**
   * Returns the serialized JSON representation of the molecule
   * Based on the CommonChem specifications @link https://github.com/CommonChem/CommonChem
   * */
  getJSON(): RDKitJson {
    return JSON.parse(this.jsMol.get_json()) as RDKitJson;
  }

  /** Returns a binary representation of the molecule (pickle) as an unsigned integer array */
  getAsUint8Array(options?: Partial<RDKitGetUint8ArrayOptions>): Uint8Array {
    if (options?.properties) {
      const rawOptions = buildGetMolAsUint8ArrayOptions(options.properties);
      return this.jsMol.get_as_uint8array(JSON.stringify(rawOptions));
    }
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
   * const svg = mol.getSVG();
   *
   * // Custom size with atom indices
   * const svg = mol.getSVG({ width: 400, height: 300, addAtomIndices: true });
   *
   * // With atom highlighting
   * const svg = mol.getSVG({ atoms: [0, 1, 2], highlightColour: [1, 0, 0, 1] });
   */
  getSVG(options?: Partial<RDKitDepictionDetails>): string {
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
      const matchJson = mol.get_substruct_match(qmol);
      if (matchJson === '{}') {
        return { atoms: [], bonds: [] }; // special case: no match returns '{}'!
      }
      return JSON.parse(matchJson);
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
      const matchesJson = mol.get_substruct_matches(qmol);
      if (!matchesJson.startsWith('[')) {
        return []; // special case: no matches returns '{}'!
      }
      return JSON.parse(matchesJson);
    } finally {
      if (shouldDelete) qmol.delete();
    }
  }

  // -- Descriptors --

  /** Returns molecular descriptors as a typed object */
  getDescriptors(): RDKitDescriptors | null {
    try {
      return JSON.parse(this.jsMol.get_descriptors()); // fails with dummy atoms and returns invalid JSON
    } catch {
      return null;
    }
  }

  // -- Fingerprints --

  /**
   * Returns the Morgan fingerprint as a bit string
   * @param options - Fingerprint options
   */
  getMorganFp(options?: Partial<RDKitMorganFPOptions>) {
    const mol = this.jsMol;
    const u8 = options
      ? mol.get_morgan_fp_as_uint8array(JSON.stringify(options))
      : mol.get_morgan_fp_as_uint8array();
    return new Fingerprint(u8, options?.nBits, 'Morgan');
  }

  /** Returns the pattern fingerprint as a bit string */
  getPatternFp(options?: Partial<RDKitPatternFPOptions>) {
    const mol = this.jsMol;
    const u8 = options
      ? mol.get_pattern_fp_as_uint8array(JSON.stringify(options))
      : mol.get_pattern_fp_as_uint8array();
    return new Fingerprint(u8, options?.nBits, 'Pattern');
  }

  /** Returns the topological torsion fingerprint as a bit string */
  getTopologicalTorsionFp(options?: Partial<RDKitTopologicalTorsionFPOptions>) {
    const mol = this.jsMol;
    const u8 = options
      ? mol.get_topological_torsion_fp_as_uint8array(JSON.stringify(options))
      : mol.get_topological_torsion_fp_as_uint8array();
    return new Fingerprint(u8, options?.nBits, 'TopologicalTorsion');
  }

  /** Returns the RDKit fingerprint as a bit string */
  getRdkitFp(options?: Partial<RDKitRdkitFpOptions>) {
    const mol = this.jsMol;
    const u8 = options
      ? mol.get_rdkit_fp_as_uint8array(JSON.stringify(options))
      : mol.get_rdkit_fp_as_uint8array();
    return new Fingerprint(u8, options?.nBits, 'RDKit');
  }

  /** Returns the atom pair fingerprint as a bit string */
  getAtomPairFp(options?: Partial<RDKitAtomPairFPOptions>) {
    const mol = this.jsMol;
    const u8 = options
      ? mol.get_atom_pair_fp_as_uint8array(JSON.stringify(options))
      : mol.get_atom_pair_fp_as_uint8array();
    return new Fingerprint(u8, options?.nBits, 'AtomPair');
  }

  /** Returns the MACCS fingerprint as a bit string (fixed 167-bit) */
  getMaccsFp() {
    const u8 = this.jsMol.get_maccs_fp_as_uint8array();
    return new Fingerprint(u8, 167, 'MACCS');
  }

  // -- Properties --

  /**
   * Parses a property value string, attempting JSON.parse first.
   * Returns the parsed value on success, or the raw string on failure.
   */
  private parsePropValue(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Checks whether the molecule has a given property
   * @param key - Property name
   */
  hasProp(key: string): boolean {
    return this.jsMol.has_prop(key);
  }

  /**
   * Gets a property value from the molecule.
   * Attempts to parse the raw string as JSON; returns the raw string if parsing fails.
   * @param key - Property name
   */
  getProp(key: string): any {
    return this.parsePropValue(this.jsMol.get_prop(key));
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
   * Returns a map of all property names to their parsed values.
   * Values are parsed from JSON when possible, otherwise returned as raw strings.
   * @param options - Filter options
   */
  getPropMap(options?: { includePrivate?: boolean; includeComputed?: boolean }): Map<string, any> {
    const mol = this.jsMol;
    const sl = options
      ? mol.get_prop_list(options.includePrivate ?? true, options.includeComputed ?? true)
      : mol.get_prop_list();
    const result = new Map<string, any>();
    for (let i = 0; i < sl.size(); i++) {
      const key = sl.get(i);
      result.set(key, this.getProp(key));
    }
    sl.delete();
    return result;
  }

  // -- Molecule info --

  /** Returns the number of atoms in the molecule */
  get numAtoms(): number {
    return this.jsMol.get_num_atoms();
  }

  /** Returns the number of heavy atoms in the molecule (excluding hydrogens and dummy atoms) */
  get numHeavyAtoms(): number {
    return this.jsMol.get_num_atoms(true);
  }

  /** Returns the number of bonds in the molecule */
  get numBonds(): number {
    return this.jsMol.get_num_bonds();
  }

  /** Returns 0 if no coords, 2 for 2D, 3 for 3D */
  hasCoords(): 0 | 2 | 3 {
    return this.jsMol.has_coords();
  }

  /** Returns the coordinates of each atom in the molecule as an array of [x, y, z] tuples */
  getCoords(): [number, number, number][] {
    return this.jsMol.get_coords();
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
    return options ? mol.remove_hs(JSON.stringify(options)) : mol.remove_hs();
  }

  /**
   * Removes explicit hydrogens from the molecule in place
   * @param options - Options controlling which hydrogens to remove
   */
  removeHsInPlace(options?: Partial<RDKitRemoveHsOptions>): boolean {
    const mol = this.jsMol;
    return options ? mol.remove_hs_in_place(JSON.stringify(options)) : mol.remove_hs_in_place();
  }

  /** Returns a V2000 Molfile string with explicit hydrogens added */
  addHs(): string {
    return this.jsMol.add_hs();
  }

  /** Adds explicit hydrogens to the molecule in place */
  addHsInPlace(): boolean {
    return this.jsMol.add_hs_in_place();
  }

  combineWith(other: Mol, options?: { offset: [number, number, number] }): void {
    const mol = this.jsMol;
    if (options) {
      mol.combine_with(other.jsMol, JSON.stringify(options));
    } else {
      this.jsMol.combine_with(other.jsMol);
    }
  }

  zipWith(other: Mol, options?: RDKitMolZipOptions): void {
    const mol = this.jsMol;
    const newMol = options
      ? this.module.molzip(mol, other.jsMol, JSON.stringify(options))
      : this.module.molzip(mol, other.jsMol);
    if (!newMol || !newMol.is_valid()) return;
    mol.delete();
    this._jsMol = newMol;
  }

  // -- Coordinate generation --

  /**
   * Generates new 2D coordinates for the molecule
   * @param useCoordGen - Use the CoordGen algorithm
   */
  setNewCoords(useCoordGen?: boolean): boolean {
    const mol = this.jsMol;
    return useCoordGen !== undefined ? mol.set_new_coords(useCoordGen) : mol.set_new_coords();
  }

  /**
   * Returns a V2000 Molfile string with newly generated coordinates
   * @param useCoordGen - Use the CoordGen algorithm
   */
  getNewCoords(useCoordGen?: boolean): string {
    const mol = this.jsMol;
    return useCoordGen !== undefined ? mol.get_new_coords(useCoordGen) : mol.get_new_coords();
  }

  /**
   * Aligns molecule coordinates with a template molecule
   * @param template - Template molecule to align to
   * @param options - Alignment options
   */
  generateAlignedCoords(
    template: Mol,
    options?: Partial<RDKitAlignedCoordsOptions>,
  ): RDKitSubstructMatch {
    const matchJson = this.jsMol.generate_aligned_coords(
      template.jsMol,
      JSON.stringify(options ?? {}),
    );
    if (matchJson === '' || matchJson === '{}') {
      return { atoms: [], bonds: [] }; // special case: no match returns '{}'!
    }
    return JSON.parse(matchJson);
  }

  // -- Depiction --

  /**
   * Normalizes the depiction of the molecule
   * @param options - Normalization options
   */
  normalizeDepiction(options?: { canonicalize?: number; scaleFactor?: number }): number {
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
  condenseAbbreviations(options?: Partial<RDKitCondenseAbbreviationsOptions>): RDKitSubstructMatch {
    const mol = this.jsMol;
    const { maxCoverage = DEFAULT_MAX_COVERAGE, useLinkers = DEFAULT_USE_LINKERS } = options ?? {};
    const raw = mol.condense_abbreviations(maxCoverage, useLinkers);

    return JSON.parse(raw) as RDKitSubstructMatch;
  }

  // -- Canvas drawing --

  drawToCanvas(canvas: HTMLCanvasElement, options?: Partial<RDKitDepictionDetails>): void {
    const mol = this.jsMol;
    if (options) {
      mol.draw_to_canvas_with_highlights(canvas, JSON.stringify(options));
    } else {
      mol.draw_to_canvas(canvas, -1, -1);
    }
  }

  // -- Fragments --

  /**
   * Returns the disconnected fragments of the molecule
   * @warning The `mols` array contains new `Mol` instances that must be
   * manually deleted by the caller to avoid memory leaks.
   * @returns An object with atom/fragment mappings and a `MolArray` of fragments
   */
  getFrags(options?: Partial<RDKitGetFragsOptions>) {
    const { mappings, molList } = options
      ? this.jsMol.get_frags(JSON.stringify(options))
      : this.jsMol.get_frags();
    const parsed = JSON.parse(mappings) as {
      frags: number[];
      fragsMolAtomMapping: number[][];
    };

    const mols = new MolArray();
    for (let i = 0; i < molList.size(); i++) {
      const jsMol = molList.at(i);
      if (jsMol) mols.push(new Mol(jsMol, this.module));
    }
    molList.delete();

    return {
      mappings: {
        atomToFrag: parsed.frags,
        fragToAtoms: parsed.fragsMolAtomMapping,
      },
      mols,
      delete: () => mols.delete(),
      [Symbol.dispose]() {
        mols.delete();
      },
    };
  }

  /**
   * Performs MMPA (Matched Molecular Pairs Analysis) fragmentation.
   *
   * Each fragmentation yields a `core` and `sidechains` mol, both with dummy
   * atoms ([*:n]) at cut points. `mol.zipWith(fragmentation.sidechain, fragmentation.core)`
   * reconstructs the original molecule.
   *
   * @throws If `minCuts < 1` or `maxCuts < minCuts`.
   *
   * @warning The returned `RDKitMmpaFragsResult` contains new `Mol` instances
   * that must be deleted by the caller to avoid memory leaks.
   */
  getMmpaFrags(options: RDKitMmpaFragsOptions): RDKitMmpaFragsResult {
    const { minCuts, maxCuts, fragmentableBondLimit } = options;
    if (minCuts < 1) throw new Error('getMmpaFrags: minCuts must be at least 1');
    if (maxCuts < minCuts)
      throw new Error(`getMmpaFrags: maxCuts (${maxCuts}) must be >= minCuts (${minCuts})`);

    const raw = this.jsMol.get_mmpa_frags(minCuts, maxCuts, fragmentableBondLimit);

    const cores = new MolArray();
    const sidechains = new MolArray();
    const fragmentations: MMPAFragmentation[] = [];

    if (raw?.cores && raw?.sidechains) {
      const n = raw.cores.size();
      for (let i = 0; i < n; i++) {
        const rawCore = raw.cores.at(i);
        const rawSidechain = raw.sidechains.at(i);
        if (!rawSidechain) continue;

        if (rawCore) {
          // 2+ cut: core and sidechains come directly from RDKit
          const core = new Mol(rawCore, this.module);
          const sidechain = new Mol(rawSidechain, this.module);
          cores.push(core);
          sidechains.push(sidechain);
          fragmentations.push({ core, sidechains: sidechain });
        } else {
          // 1-cut: RDKit returns no core; split combined sidechains mol
          // Largest fragment (by atom count) becomes core, smallest becomes sidechains
          const combined = new Mol(rawSidechain, this.module);
          const { mols: frags } = combined.getFrags();
          combined.delete();
          frags.sort((a, b) => b.numAtoms - a.numAtoms);
          const core = frags[0];
          const sidechain = frags[1];
          cores.push(core);
          sidechains.push(sidechain);
          fragmentations.push({ core, sidechains: sidechain });
        }
      }
      raw.cores.delete();
      raw.sidechains.delete();
    }

    return {
      cores,
      sidechains,
      get length() {
        return fragmentations.length;
      },
      *[Symbol.iterator]() {
        yield* fragmentations;
      },
      delete() {
        cores.delete();
        sidechains.delete();
      },
      [Symbol.dispose]() {
        cores.delete();
        sidechains.delete();
      },
    };
  }

  // -- Copy --

  /** Returns a copy of the molecule */
  copy(): Mol {
    return new Mol(this.jsMol.copy(), this.module);
  }

  // -- Lifecycle --

  /** Returns true if the underlying C++ object has been deleted */
  get isDeleted(): boolean {
    return this._jsMol === null || this._jsMol.isDeleted();
  }

  /**
   * Deletes the underlying C++ molecule object from memory.
   *
   * @see {@link https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html#memory-management | Emscripten docs}
   */
  delete(): void {
    this._jsMol?.delete();
    this._jsMol = null;
  }

  /** Disposable support — allows use with the `using` keyword */
  [Symbol.dispose](): void {
    this.delete();
  }
}
