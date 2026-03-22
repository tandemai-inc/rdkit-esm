import type {
  CxSmilesField,
  PropertyPickleOptionsKeys,
  RDKitGetSmilesOptions,
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

export interface RDKitConfigureOptions {
  /** Switch between RDKit's built-in coordinate generator and CoordGen. */
  preferCoordgen: boolean;
  /** Use the legacy stereo perception algorithm. */
  useLegacyStereoPerception: boolean;
  /** Perceive chirality on non-tetrahedral stereocenters (square-planar, trigonal-bipyramidal, etc.). */
  allowNonTetrahedralChirality: boolean;
}

export type RDKitCondenseAbbreviationsOptions = {
  /** @default 0.4 */
  maxCoverage: number;
  /** @default false */
  useLinkers: boolean;
};
