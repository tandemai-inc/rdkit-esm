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

export type RDKitAtom = {
  chg: number;
  /** Implicit Hydrogens count */
  impHs: number;
  isotope: number;
  nRad: number;
  stereo: 'unspecified' | 'cw' | 'ccw' | 'other';
  z: number;
};

export type RDKitBond = {
  /** Bond order */
  bo: number;
  stereo: 'unspecified' | 'cis' | 'trans' | 'either';
  stereoAtoms: [number, number];
  atoms: [number, number];
};

type RDKitExtension = {
  aromaticAtoms?: number[];
  aromaticBonds?: number[];
  atomRings?: number[][];
  cipCodes: [number, 'R' | 'S'][];
  cipRanks: number[];
  formatVersion: number;
  name: 'rdkitRepresentation';
  toolkitVersion: string;
};

type RDKitConformer2D = {
  dim: 2;
  coords: [number, number][];
};
type RDKitConformer3D = {
  dim: 3;
  coords: [number, number, number][];
};

type RDKitMolecule = {
  atoms: Partial<RDKitAtom>[];
  bonds: (Partial<RDKitBond> & Pick<RDKitBond, 'atoms'>)[];
  conformers?: RDKitConformer2D[] | RDKitConformer3D[];
  extensions: RDKitExtension[];
  name: string;
};

export type RDKitJson = {
  defaults: {
    atom: RDKitAtom;
    bond: RDKitBond;
  };
  molecules: RDKitMolecule[];
};

type DrawColour = [number, number, number, number?];
type ColourPalette = { [k: number]: DrawColour };

export type RDKitDepictionDetails = {
  width: number;
  height: number;
  offsetx: number;
  offsety: number;
  atomLabelDeuteriumTritium: boolean;
  dummiesAreAttachments: boolean;
  circleAtoms: boolean;
  splitBonds: boolean;
  highlightColour: DrawColour;
  continuousHighlight: boolean;
  fillHighlights: boolean;
  highlightRadius: number;
  flagCloseContactsDist: number;
  includeAtomTags: boolean;
  clearBackground: boolean;
  backgroundColour: DrawColour;
  legendFontSize: number;
  legendFraction: number;
  maxFontSize: number;
  minFontSize: number;
  fixedFontSize: number;
  annotationFontScale: number;
  fontFile: string;
  legendColour: DrawColour;
  multipleBondOffset: number;
  padding: number;
  additionalAtomLabelPadding: number;
  atomLabels: Record<number, string>;
  noAtomLabels: boolean;
  atomRegions: number[][];
  symbolColour: DrawColour;
  annotationColour: DrawColour;
  bondLineWidth: number;
  scaleBondWidth: number;
  scaleHighlightBondWidth: boolean;
  highlightBondWidthMultiplier: number;
  prepareMolsBeforeDrawing: boolean;
  highlightColourPalette: DrawColour[];
  atomColourPalette: ColourPalette;
  fixedScale: number;
  fixedBondLength: number;
  rotate: number;
  addAtomIndices: boolean;
  addBondIndices: boolean;
  isotopeLabels: boolean;
  dummyIsotopeLabels: boolean;
  addStereoAnnotation: boolean;
  atomHighlightsAreCircles: boolean;
  centreMoleculesBeforeDrawing: boolean;
  explicitMethyl: boolean;
  includeRadicals: boolean;
  includeMetadata: boolean;
  comicMode: boolean;
  variableBondWidthMultiplier: number;
  variableAtomRadius: number;
  variableAttachmentColour: DrawColour;
  includeChiralFlagLabel: boolean;
  simplifiedStereoGroupLabel: boolean;
  unspecifiedStereoIsUnknown: boolean;
  singleColourWedgeBonds: boolean;
  useMolBlockWedging: boolean;
  scalingFactor: number;
  baseFontSize: number;
  drawMolsSameScale: boolean;
  atoms: number[];
  bonds: number[];
  highlightAtomColors: Record<number, DrawColour>;
  highlightBondColors: Record<number, DrawColour>;
  standardColoursForHighlightedAtoms: boolean;
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
  /**
   * @alias BondCompleteRingsOnly
   */
  CompleteRingsOnly: boolean;
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
