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

export type RDKitGetMolBlockOpt = {
  /** @default true */
  includeStereo: boolean;
  /** @default true */
  kekulize: boolean;
  /** @default false */
  useMolBlockWedging: boolean;
  /** @default false */
  addChiralHs: boolean;
};

export type RDKitGetMCSOpt = {
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
