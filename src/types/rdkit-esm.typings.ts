import type {
  CxSmilesField,
  PropertyPickleOptionsKeys,
  RDKitGetSmilesOptions,
  RDKitGetMolOpt,
  RDKitRxnDetails,
} from './rdkit-minimalib-json-typings';

/** Wrapper-level CX SMILES options with ergonomic `fields` array */
export type RDKitGetCxSmilesOptions = RDKitGetSmilesOptions & {
  /** CX extension fields to include. Omit for all fields (default). Empty array for none. */
  fields: CxSmilesField[];
  /** Restore bond direction option. Accepts `true`, `'true'`, or `'clear'`. */
  restoreBondDirOption: true | 'true' | 'clear';
};

export type RDKitGetUint8ArrayOptions = {
  /** Properties to include in the binary export (pickle)
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
  /** Switch between RDKit's built-in coordinate generator and CoordGen. */
  preferCoordgen: boolean;
  /** Use the legacy stereo perception algorithm. */
  useLegacyStereoPerception: boolean;
  /** Perceive chirality on non-tetrahedral stereocenters (square-planar, trigonal-bipyramidal, etc.). */
  allowNonTetrahedralChirality: boolean;
  /** When true, RDKit error messages also appear in the console (uses set_log_tee).
   *  Default: false (capture-only when a fail listener is set). */
  enableLogging: boolean;
};

export type RDKitParseOperation = 'getMol' | 'getQMol' | 'getRxn';

export type RDKitParseErrorEvent = {
  input: string | Uint8Array;
  message: string;
  operation: RDKitParseOperation;
};

export type RDKitFailCallback = (event: RDKitParseErrorEvent) => void;

export type RDKitEvents = {
  addErrorListener(callback: RDKitFailCallback): () => void;
};

export type RDKitGetMolOptions = RDKitGetMolOpt & { throwOnError: boolean };
export type RDKitGetQMolOptions = { throwOnError: boolean };
export type RDKitGetRxnOptions = RDKitRxnDetails & { throwOnError: boolean };

export type RDKitMmpaFragsOptions = {
  /** Minimum number of bonds to simultaneously cut. */
  minCuts: number;
  /** Maximum number of bonds to simultaneously cut. */
  maxCuts: number;
  /**
   * Fragmentation is aborted when the molecule has more cuttable bonds
   * than this limit. Prevents combinatorial explosion on highly connected molecules.
   */
  fragmentableBondLimit: number;
};

export type RDKitCondenseAbbreviationsOptions = {
  /** @default 0.4 */
  maxCoverage: number;
  /** @default false */
  useLinkers: boolean;
};
