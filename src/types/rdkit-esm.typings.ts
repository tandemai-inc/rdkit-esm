import type {
  CxSmilesField,
  PropertyPickleOptionsKeys,
  RDKitGetSmilesOptions,
  RDKitGetMolOpt,
  RDKitRxnDetails,
  RDKitDepictionDetails,
  RDKitMinimizeDetails,
  RDKitMinimizeResult,
  RDKitGenerateConformersDetails,
  RDKitGenerateConformersResult,
} from './rdkit-minimalib-json-typings';

/**
 * Wrapper-level CX SMILES options with ergonomic `fields` array
 */
export type RDKitGetCxSmilesOptions = RDKitGetSmilesOptions & {
  /**
   * CX extension fields to include. Omit for all fields (default). Empty array for none.
   */
  fields: CxSmilesField[];
  /**
   * Restore bond direction option. Accepts `true`, `'true'`, or `'clear'`.
   */
  restoreBondDirOption: true | 'true' | 'clear';
};

export type RDKitGetUint8ArrayOptions = {
  /**
   * Properties to include in the binary export (pickle)
   * @default: when `properties` is omitted, all data properties are included except the computed properties.
   */
  properties: PropertyPickleOptionsKeys[];
};

// The following is not exposed
// export type AbbreviationDefinition = {
//     label: string;
//     smarts: string;
//   } | {
//     label: string;
//     smarts: string;
//     displayLabel: string;
//     displayLabelW: string;
//   }

export type RDKitConfigureOptions = {
  /**
   * Switch between RDKit's built-in coordinate generator and CoordGen.
   */
  preferCoordgen: boolean;
  /**
   * Use the legacy stereo perception algorithm.
   */
  useLegacyStereoPerception: boolean;
  /**
   * Perceive chirality on non-tetrahedral stereocenters (square-planar, trigonal-bipyramidal, etc.).
   */
  allowNonTetrahedralChirality: boolean;
  /** When true, RDKit error messages also appear in the console (uses set_log_tee).
   *  Default: false (capture-only when a fail listener is set). */
  enableLogging: boolean;
};

export type RDKitParseOperation = 'getMol' | 'getQMol' | 'getRxn';

/** `Mol` computations that report failures through the error listener */
export type RDKitMolOperation = 'getForceFieldEnergy' | 'minimize' | 'generateConformers';

export type RDKitOperation = RDKitParseOperation | RDKitMolOperation;

export type RDKitParseErrorEvent = {
  /** Parsed input for parse operations; the molecule's SMILES for `Mol` operations */
  input: string | Uint8Array;
  message: string;
  operation: RDKitOperation;
};

export type RDKitFailCallback = (event: RDKitParseErrorEvent) => void;

export type RDKitEvents = {
  addErrorListener(callback: RDKitFailCallback): () => void;
};

export type RDKitGetMolOptions = RDKitGetMolOpt & { throwOnError: boolean };
export type RDKitGetQMolOptions = { throwOnError: boolean };
export type RDKitGetRxnOptions = RDKitRxnDetails & { throwOnError: boolean };

export type RDKitGetSVGOptions = Omit<RDKitDepictionDetails, 'returnDrawCoords'>;

export type RDKitMmpaFragsOptions = {
  /**
   * Minimum number of bonds to simultaneously cut.
   */
  minCuts: number;
  /**
   * Maximum number of bonds to simultaneously cut.
   */
  maxCuts: number;
  /**
   * Fragmentation is aborted when the molecule has more cuttable bonds
   * than this limit. Prevents combinatorial explosion on highly connected molecules.
   */
  fragmentableBondLimit: number;
};

export type SubstructLibraryOptions = {
  /**
   * Pattern fingerprint bit size for pre-screening.
   * Larger values reduce false positives at the cost of memory.
   * Ignored if `disableFingerprints` is true.
   * Default: WASM default (2048).
   */
  nBits?: number;
  /**
   * Disable fingerprint pre-screening (brute-force matching only).
   * Overrides `nBits`. Useful for tiny libraries or testing.
   * Internally passes `numBits=0` to the WASM constructor.
   */
  disableFingerprints?: boolean;
};

export type SubstructLibraryAddOptions = {
  /**
   * Skip SMILES validation and sanitization.
   * Use only with RDKit-canonical SMILES strings (e.g. from a previous `getSmiles()` call).
   * Improves add performance on large libraries.
   */
  trusted?: boolean;
};

export type SubstructLibrarySearchOptions = {
  /**
   * Enable chiral substructure searching.
   * Default: false
   */
  useChirality?: boolean;
  /**
   * Stop after finding this many matches.
   * Default: no limit.
   */
  maxResults?: number;
  // numThreads intentionally omitted — the WASM build has no pthread support.
};

export type RDKitCondenseAbbreviationsOptions = {
  /**
   * @default 0.4
   */
  maxCoverage: number;
  /**
   * @default false
   */
  useLinkers: boolean;
};

// -- Force field and conformers --

export type RDKitForceFieldEnergyOptions = { throwOnError: boolean };

export type RDKitMinimizeOptions = Omit<RDKitMinimizeDetails, 'job'> & { throwOnError: boolean };

export type RDKitMinimizationFrame = {
  /** Force-field energy in kcal/mol */
  energy: number;
  /** Atom coordinates in Å, in the same shape as `Mol.getCoords()` */
  coords: [number, number, number][];
};

export type RDKitMinimization = Omit<RDKitMinimizeResult, 'frames'> & {
  /**
   * Minimization trajectory, in order: the starting geometry, one frame every
   * `snapshotFrequency` iterations (plus the converged geometry when the minimizer
   * converges), and the final geometry. Consecutive identical frames are not repeated.
   */
  frames: RDKitMinimizationFrame[];
};

export type RDKitGenerateConformersOptions = RDKitGenerateConformersDetails & {
  throwOnError: boolean;
};

export type RDKitConformers = Omit<RDKitGenerateConformersResult, 'conformers'> & {
  /** Atom coordinates in Å of each conformer, in the same shape as `Mol.getCoords()` */
  conformers: [number, number, number][][];
};
