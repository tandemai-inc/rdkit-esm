/**
 * Manually generated typings for the RDKit module functions responses and parameters
 */

type RDKitDescriptorNames =
  | 'exactmw'
  | 'amw'
  | 'lipinskiHBA'
  | 'lipinskiHBD'
  | 'NumRotatableBonds'
  | 'NumHBD'
  | 'NumHBA'
  | 'NumHeavyAtoms'
  | 'NumAtoms'
  | 'NumHeteroatoms'
  | 'NumAmideBonds'
  | 'FractionCSP3'
  | 'NumRings'
  | 'NumAromaticRings'
  | 'NumAliphaticRings'
  | 'NumSaturatedRings'
  | 'NumHeterocycles'
  | 'NumAromaticHeterocycles'
  | 'NumSaturatedHeterocycles'
  | 'NumAliphaticHeterocycles'
  | 'NumSpiroAtoms'
  | 'NumBridgeheadAtoms'
  | 'NumAtomStereoCenters'
  | 'NumUnspecifiedAtomStereoCenters'
  | 'labuteASA'
  | 'tpsa'
  | 'CrippenClogP'
  | 'CrippenMR'
  | 'chi0v'
  | 'chi1v'
  | 'chi2v'
  | 'chi3v'
  | 'chi4v'
  | 'chi0n'
  | 'chi1n'
  | 'chi2n'
  | 'chi3n'
  | 'chi4n'
  | 'hallKierAlpha'
  | 'kappa1'
  | 'kappa2'
  | 'kappa3'
  | 'Phi';
export type RDKitDescriptors = Record<RDKitDescriptorNames, number>;

export type RDKitJsonAtom = {
  chg: number;
  /** Implicit Hydrogens count */
  impHs: number;
  isotope: number;
  nRad: number;
  stereo: 'unspecified' | 'cw' | 'ccw' | 'other';
  z: number;
};

export type RDKitJsonBond = {
  /** Bond order */
  bo: number;
  stereo: 'unspecified' | 'cis' | 'trans' | 'either';
  stereoAtoms: [number, number];
  atoms: [number, number];
};

export type RDKitJsonExtension = {
  aromaticAtoms?: number[];
  aromaticBonds?: number[];
  atomRings?: number[][];
  cipCodes: [number, 'R' | 'S'][];
  cipRanks: number[];
  formatVersion: number;
  name: 'rdkitRepresentation';
  toolkitVersion: string;
};

export type RDKitJsonConformer2D = {
  dim: 2;
  coords: [number, number][];
};
export type RDKitJsonConformer3D = {
  dim: 3;
  coords: [number, number, number][];
};

export type RDKitJsonMolecule = {
  atoms: Partial<RDKitJsonAtom>[];
  bonds: (Partial<RDKitJsonBond> & Pick<RDKitJsonBond, 'atoms'>)[];
  conformers?: RDKitJsonConformer2D[] | RDKitJsonConformer3D[];
  extensions: RDKitJsonExtension[];
  name: string;
};

export type RDKitJson = {
  defaults: {
    atom: RDKitJsonAtom;
    bond: RDKitJsonBond;
  };
  molecules: RDKitJsonMolecule[];
};

export type DrawColour = [number, number, number, number?];
export type ColourPalette = { [k: number]: DrawColour };

export type RDKitDepictionDetails = {
  /** Drawing width in pixels */
  width: number;
  /** Drawing height in pixels */
  height: number;
  /** X offset for drawing origin in pixels */
  offsetx: number;
  /** Y offset for drawing origin in pixels */
  offsety: number;
  /** Toggles replacing 2H with D and 3H with T */
  atomLabelDeuteriumTritium: boolean;
  /** Draws "breaks" at dummy atoms */
  dummiesAreAttachments: boolean;
  /** Draws circles under highlighted atoms */
  circleAtoms: boolean;
  /** Split bonds into per-atom segments; most useful for dynamic manipulation of drawing, especially for SVG */
  splitBonds: boolean;
  /** Default highlight color */
  highlightColour: DrawColour;
  /** Highlight by drawing an outline *underneath* the molecule */
  continuousHighlight: boolean;
  /** Fill the areas used to highlight atoms and atom regions */
  fillHighlights: boolean;
  /** Default highlight radius if nothing given for a particular atom; units are Angstrom */
  highlightRadius: number;
  /** If positive, used as a cutoff (in pixels) for highlighting close contacts */
  flagCloseContactsDist: number;
  /** Toggles inclusion of atom tags in the output; does not make sense for all renderers */
  includeAtomTags: boolean;
  /** Toggles clearing the background before drawing a molecule */
  clearBackground: boolean;
  /** Color to be used while clearing the background */
  backgroundColour: DrawColour;
  /** Color to be used for query bonds */
  queryColour: DrawColour;
  /** Font size (in pixels) to be used for the legend (if present) */
  legendFontSize: number;
  /** Fraction of the draw panel to be used for the legend if present */
  legendFraction: number;
  /** Maximum size in pixels for font in drawn molecule; -1 means no max */
  maxFontSize: number;
  /** Minimum size in pixels for font in drawn molecule; -1 means no min */
  minFontSize: number;
  /** Font size to use, in pixels; default -1 means not fixed. If set, always used irrespective of scale, minFontSize and maxFontSize */
  fixedFontSize: number;
  /** Scales font relative to atom labels for atom and bond annotation */
  annotationFontScale: number;
  /** Name of font file for freetype rendering; if given, over-rides default (BuiltinTelexRegular). Can also be BuiltinRobotoRegular */
  fontFile: string;
  /** Color to be used for the legend (if present) */
  legendColour: DrawColour;
  /** Offset for the extra lines in a multiple bond, as a fraction of mean bond length */
  multipleBondOffset: number;
  /** Fraction of empty space to leave around the molecule */
  padding: number;
  /** Fraction of empty space to leave around each component in a reaction drawing */
  componentPadding: number;
  /** Additional padding to leave around atom labels; expressed as a fraction of the font size */
  additionalAtomLabelPadding: number;
  /** Replacement labels for atoms */
  atomLabels: Record<number, string>;
  /** Disables inclusion of atom labels in the rendering */
  noAtomLabels: boolean;
  /** Atom regions */
  atomRegions: number[][];
  /** Color to be used for the symbols and arrows in reactions */
  symbolColour: DrawColour;
  /** Color to be used for annotations */
  annotationColour: DrawColour;
  /** Color to be used for atom indices and notes */
  atomNoteColour: DrawColour;
  /** Color to be used for bond indices and notes */
  bondNoteColour: DrawColour;
  /** Default line width when drawing bonds */
  bondLineWidth: number;
  /** Whether to apply scale() to the bond width */
  scaleBondWidth: boolean;
  /** Whether to apply scale() to bond highlight widths */
  scaleHighlightBondWidth: boolean;
  /** Multiplier for standard bond width used for highlighting */
  highlightBondWidthMultiplier: number;
  /** Call prepareMolForDrawing() on each molecule passed to drawMolecules() */
  prepareMolsBeforeDrawing: boolean;
  /** Defines 10 default colors for highlighting atoms and bonds or reactants in reactions */
  highlightColourPalette: DrawColour[];
  /** The palette used to assign colors to atoms based on atomic number */
  atomColourPalette: ColourPalette;
  /** Fixes scale to this fraction of draw window width so an average bond is this fraction of the width; -1.0 means no fix */
  fixedScale: number;
  /** Fixes the bond length (and hence the scale) to always be this number of pixels; -1.0 means no fix. If both fixedScale and fixedBondLength are > 0, fixedScale wins */
  fixedBondLength: number;
  /** Angle in degrees to rotate coords by about centre before drawing */
  rotate: number;
  /** Adds atom indices to drawings */
  addAtomIndices: boolean;
  /** Adds bond indices to drawings */
  addBondIndices: boolean;
  /** Adds isotope labels to non-dummy atoms */
  isotopeLabels: boolean;
  /** Adds isotope labels to dummy atoms */
  dummyIsotopeLabels: boolean;
  /** Adds E/Z and R/S stereo annotations to drawings */
  addStereoAnnotation: boolean;
  /** Show CIP codes for 'or' and 'and' StereoGroups that are normally hidden */
  showAllCIPCodes: boolean;
  /** Forces atom highlights always to be circles; default (false) puts ellipses round longer labels */
  atomHighlightsAreCircles: boolean;
  /** Highlight style for multi-colour highlights */
  multiColourHighlightStyle: 'CIRCLEANDLINE' | 'LASSO';
  /** Moves the centre of the drawn molecule to (0,0) */
  centreMoleculesBeforeDrawing: boolean;
  /** Which elements should be included when computing drawing extents; bitmask of DrawElement flags (PRESHAPES=1, BONDS=2, ATOMLABELS=4, HIGHLIGHTS=8, ANNOTATIONS=16, RADICALS=32, POSTSHAPES=64, ALL=0x7fffffff) */
  drawingExtentsInclude: number;
  /** Draw terminal methyl and related groups as CH3 */
  explicitMethyl: boolean;
  /** Include radicals in the drawing; can be useful to turn off for reactions and queries */
  includeRadicals: boolean;
  /** When possible, include metadata about molecules and reactions in the output to allow them to be reconstructed */
  includeMetadata: boolean;
  /** Simulate hand-drawn lines for bonds; when combined with a font like Comic-Sans or Comic-Neue, gives xkcd-like drawings */
  comicMode: boolean;
  /** Multiplier for standard bond width used for variable attachment points */
  variableBondWidthMultiplier: number;
  /** Radius value to use for atoms involved in variable attachment points */
  variableAtomRadius: number;
  /** Colour to use for variable attachment points */
  variableAttachmentColour: DrawColour;
  /** Add a molecule annotation with "ABS" if the chiral flag is set */
  includeChiralFlagLabel: boolean;
  /** If all specified stereocenters are in a single StereoGroup, show a molecule-level annotation instead of the individual labels */
  simplifiedStereoGroupLabel: boolean;
  /** If true, double bonds with unspecified stereo are drawn crossed; potential stereocenters with unspecified stereo are drawn with a wavy bond */
  unspecifiedStereoIsUnknown: boolean;
  /** If true, wedged and dashed bonds are drawn using symbolColour rather than inheriting their colour from the atoms */
  singleColourWedgeBonds: boolean;
  /** If the molecule came from a MolBlock, prefer the wedging information it provides; if false, use RDKit rules */
  useMolBlockWedging: boolean;
  /** Scaling factor used for pixels-to-angstrom conversion when auto scaling is being used */
  scalingFactor: number;
  /** When > 0, sets the baseFontSize for text drawing; reference: default DrawText::baseFontSize is 0.6 */
  baseFontSize: number;
  /** When drawing multiple molecules with DrawMolecules, forces them to use the same scale */
  drawMolsSameScale: boolean;
  /** Replace any-atom, any-hetero, any-halo queries with complex query symbols A, Q, X, M, optionally followed by H if hydrogen is included (except for AH, which stays *) */
  useComplexQueryAtomSymbols: boolean;
  /** If true, puts brackets round atom lists in query atoms */
  bracketsAroundAtomLists: boolean;
  /** Atom indices to highlight */
  atoms: number[];
  /** Bond indices to highlight */
  bonds: number[];
  /** Per-atom highlight colors, keyed by atom index */
  highlightAtomColors: Record<number, DrawColour>;
  /** Per-bond highlight colors, keyed by bond index */
  highlightBondColors: Record<number, DrawColour>;
  /** If true, highlighted hetero atoms are drawn in standard colours rather than black */
  standardColoursForHighlightedAtoms: boolean;
  // Drawing call parameters (parsed from the details JSON by common.h, not part of MolDrawOptions)
  /** Caption text to display below the molecule (distinct from legendFontSize/legendColour which control its appearance) */
  legend: string;
  /** Panel width in pixels for multi-panel or grid drawings */
  panelWidth: number;
  /** Panel height in pixels for multi-panel or grid drawings */
  panelHeight: number;
  /** Disable freetype font rendering and use the built-in font instead */
  noFreetype: boolean;
  /** Pre-kekulize the molecule before drawing */
  kekulize: boolean;
  /** Add chiral hydrogen atoms before drawing */
  addChiralHs: boolean;
  /** Control bond wedging in the drawing */
  wedgeBonds: boolean;
  /** Force use of existing coordinates rather than generating new ones */
  forceCoords: boolean;
  /** Draw wavy bonds for double bonds with unspecified stereo */
  wavyBonds: boolean;
  /** Return atom drawing coordinates in the output JSON
   * IMPORTANT: this changes the output format in the case of get_svg...()
   */
  returnDrawCoords: boolean;
};

export type RDKitRxnDepictionDetails = RDKitDepictionDetails & {
  highlightByReactant: boolean;
  highlightColorsReactants: DrawColour[];
};

export type RDKitStereoTags = {
  CIP_atoms: [number, '(S)' | '(R)' | '(?)'][];
  CIP_bonds: [number, number, string][];
};

export type RDKitRxnDetails = {
  sanitize: boolean;
  useSmiles: boolean;
  removeHs: boolean;
  strictParsing: boolean;
  adjustReactants: boolean;
  mergeQueryHs: boolean;
};

export type RDKitSubstructMatch = {
  atoms: number[];
  bonds: number[];
};

export type RDKitGetMolOpt = {
  kekulize: boolean;
  setAromaticity: boolean;
  fastFindRings: boolean;
  mappedDummiesAreRGroups: boolean;
  sanitize: boolean;
  removeHs: boolean;
  assignStereo: boolean;
  mergeQueryHs: boolean;
  /** Assign chiral types from molfile parity flags */
  assignChiralTypesFromMolParity: boolean;
  /** Convert mapped dummy atoms to query atoms */
  makeDummiesQueries: boolean;
  /** Apply strict parsing rules to CXSMILES input */
  strictCXSMILES: boolean;
  /** Apply strict parsing rules to Molfile input */
  strictParsing: boolean;
};

export type RDKitGetMolBlockOptions = {
  /** @default true */
  includeStereo: boolean;
  /** @default true */
  kekulize: boolean;
  /** @default false */
  useMolBlockWedging: boolean;
  /** @default false */
  addChiralHs: boolean;
  /** @default 'AUTO' */
  forceMDLVersion: 'AUTO' | 'V2000' | 'V3000';
};

export type RDKitGetSmilesOptions = {
  /** Include stereochemistry and isotope information @default true */
  doIsomericSmiles: boolean;
  /**
   * Kekulize the molecule before generating the SMILES and output
   * single/double bonds. NOTE that the output is not canonical and that this
   * will throw an exception if the molecule cannot be kekulized.
   * @default false
   */
  doKekule: boolean;
  /**
   * Make sure the SMILES starts at the specified atom. The resulting SMILES
   * is not canonical and the value of the canonical parameter will be ignored.
   * @default -1
   */
  rootedAtAtom: number;
  /** Generate canonical SMILES @default true */
  canonical: boolean;
  /** Include symbols for all bonds @default false */
  allBondsExplicit: boolean;
  /** Provide hydrogen counts for every atom @default false */
  allHsExplicit: boolean;
  /**
   * Randomize the output order. The resulting SMILES is not canonical and
   * the value of the canonical parameter will be ignored.
   * @default false
   */
  doRandom: boolean;
};

/**
 * Raw CX SMILES options as accepted by the RDKit MinimalLib JSON API.
 * Each `CX_*` flag is a boolean that enables the corresponding CX extension field.
 */
export type RDKitGetCXSmilesRawOptions = RDKitGetSmilesOptions & CXSmilesOptions;

type CXSmilesOptions = { [K in CxSmilesField as `CX_${K}`]: boolean } & {
  /** @default RestoreBondDirOptionClear */
  restoreBondDirOption: 'RestoreBondDirOptionTrue' | 'RestoreBondDirOptionClear';
};

/** CX extension field names (without the `CX_` prefix) */
export type CxSmilesField =
  | 'NONE'
  | 'ATOM_LABELS'
  | 'MOLFILE_VALUES'
  | 'COORDS'
  | 'RADICALS'
  | 'ATOM_PROPS'
  | 'LINKNODES'
  | 'ENHANCEDSTEREO'
  | 'SGROUPS'
  | 'POLYMER'
  | 'BOND_CFG'
  | 'BOND_ATROPISOMER'
  | 'COORDINATE_BONDS'
  | 'HYDROGEN_BONDS'
  | 'ZERO_BONDS'
  | 'ALL'
  | 'ALL_BUT_COORDS';

export type RDKitGetMolAsPickleOptions = {
  propertyFlags: Partial<{ [K in PropertyPickleOptionsKeys]: boolean }>;
};

export type PropertyPickleOptionsKeys =
  | 'NoProps' // no data pickled, single precision coordinates
  | 'MolProps' // only public non computed properties
  | 'AtomProps'
  | 'BondProps'
  // | 'QueryAtomData' // DEPRECATED, same as AtomProps when set
  | 'PrivateProps'
  | 'ComputedProps'
  | 'AllProps' // all data pickled
  | 'CoordsAsDouble' // save coordinates in double precision
  | 'NoConformers'; // do not include conformers or associated properties

export type RDKitGetMCSOptions = {
  MaximizeBonds: boolean;
  Threshold: number;
  Timeout: number;
  InitialSeed: string;

  MatchValences: boolean;
  MatchChiralTag: boolean;
  MatchFormalCharge: boolean;
  /**
   * @alias BondRingMatchesRingOnly
   */
  RingMatchesRingOnly: boolean;
  AtomRingMatchesRingOnly: boolean;
  BondRingMatchesRingOnly: boolean;
  MaxDistance: number;
  AtomCompleteRingsOnly: boolean;
  BondCompleteRingsOnly: boolean;
  /**
   * @alias BondCompleteRingsOnly
   */
  CompleteRingsOnly: boolean;
  MatchFusedRings: boolean;
  MatchFusedRingsStrict: boolean;
  MatchStereo: boolean;
  StoreAll: boolean;
  AtomCompare: 'Elements' | 'Any' | 'Isotopes' | 'AnyHeavy';
  BondCompare: 'Order' | 'Any' | 'OrderExact';
};

export type RDKitMCSResult = {
  numAtoms: number;
  numBonds: number;
  canceled: boolean;
  /**
   * Can be an array iff option `StoreAll` is set to true
   */
  smarts: string | string[];
};

export type RDKitMorganFPOptions = {
  /** @default 2 */
  radius: number;
  /** @default 2048 */
  nBits: number;
  /** @default false */
  useCountSimulation: boolean;
  /** @default false */
  useChirality: boolean;
  /** @default true */
  useBondTypes: boolean;
  /** @default false */
  includeRedundantEnvironments: boolean;
  /** @default false */
  onlyNonzeroInvariants: boolean;
};

export type RDKitPatternFPOptions = {
  /** @default 2048 */
  nBits: number;
  /** @default false */
  tautomericFingerprint: boolean;
};

export type RDKitTopologicalTorsionFPOptions = {
  /** @default 2048 */
  nBits: number;
  /** @default false */
  useChirality: boolean;
  /** @default 4 */
  torsionAtomCount: number;
  /** @default true */
  useCountSimulation: boolean;
};

export type RDKitRdkitFpOptions = {
  /** @default 2048 */
  nBits: number;
  /** @default 2 */
  nBitsPerHash: number;
  /** @default 1 */
  minPath: number;
  /** @default 7 */
  maxPath: number;
  /** @default true */
  useBondOrder: boolean;
  /** @default true */
  branchedPaths: boolean;
  /** @default false */
  useCountSimulation: boolean;
  /** @default true */
  useHs: boolean;
};

export type RDKitAtomPairFPOptions = {
  /** @default 2048 */
  nBits: number;
  /** @default false */
  useChirality: boolean;
  /** @default 1 */
  minLength: number;
  /** @default 30 */
  maxLength: number;
  /** @default true */
  useCountSimulation: boolean;
  /** @default true */
  use2D: boolean;
};

export type RDKitRemoveHsOptions = {
  /** @default false — hydrogens that have no bonds */
  removeDegreeZero: boolean;
  /** @default false — hydrogens with two (or more) bonds */
  removeHigherDegrees: boolean;
  /** @default false — hydrogens with bonds only to other hydrogens */
  removeOnlyHNeighbors: boolean;
  /** @default false — hydrogens with non-default isotopes */
  removeIsotopes: boolean;
  /** @default false — removes isotopic Hs, tracks them via _isotopicHs property */
  removeAndTrackIsotopes: boolean;
  /** @default false — hydrogens with at least one dummy-atom neighbor */
  removeDummyNeighbors: boolean;
  /** @default false — hydrogens defining bond stereochemistry */
  removeDefiningBondStereo: boolean;
  /** @default true — hydrogens with wedged bonds */
  removeWithWedgedBond: boolean;
  /** @default false — hydrogens with queries defined */
  removeWithQuery: boolean;
  /** @default true — mapped hydrogens */
  removeMapped: boolean;
  /** @default true — hydrogens in SubstanceGroups */
  removeInSGroups: boolean;
  /** @default true — display warnings for Hs that are not removed */
  showWarnings: boolean;
  /** @default true @deprecated — equivalent of !implicitOnly */
  removeNonimplicit: boolean;
  /** @default false @deprecated */
  updateExplicitCount: boolean;
  /** @default false — remove hydrides */
  removeHydrides: boolean;
  /** @default false — remove Hs bonded to atoms with non-tetrahedral stereochemistry */
  removeNontetrahedralNeighbors: boolean;
};

export type RDKitAlignedCoordsOptions = {
  useCoordGen: boolean;
  referenceSmarts: string;
  allowRGroups: boolean;
  acceptFailure: boolean;
  alignOnly: boolean;
};

export type RDKitMolZipOptions = {
  Label: string;
  AtomSymbols: string[];
  AtomProperty: string;
  EnforceValenceRules: boolean;
  GenerateCoordinates: boolean;
  AlignCoordinates: boolean;
};

export type RDKitGetRgdOptions = {
  labels:
    | 'IsotopeLabels'
    | 'AtomMapLabels'
    | 'MDLRGroupLabels'
    | 'DummyAtomLabels'
    | 'AtomIndexLabels'
    | 'AutoDetect'
    | 'RelabelDuplicateLabels';
  /**
   * choose where the rlabels are stored on the decomposition
   * @default "AtomMap | MDLRGroup"
   * */
  rgroupLabelling: 'AtomMap' | 'Isotope' | 'MDLRGroup';
  alignment: 'None' | 'NoAlignment' | 'MCS';
  scoreMethod: 'Match' | 'FingerprintVariance';
  matchingStrategy: 'Greedy' | 'GreedyChunks' | 'Exhaustive' | 'NoSymmetrization' | 'GA';
  /**
   * only allow rgroup decomposition at the specified rgroups
   */
  onlyMatchAtRGroups: boolean;
  removeAllHydrogenRGroupsAndLabels: boolean;
  removeHydrogensPostMatch: boolean;
  allowNonTerminalRGroups: boolean;
  doTautomers: boolean;
  doEnumeration: boolean;
  allowMultipleRGroupsOnUnlabelled: boolean;
  allowMultipleCoresInSameMol: boolean;
  includeTargetMolInResults: boolean;
  timeout: number;
  chunkSize: number;
};
