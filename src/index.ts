export { initRDKit } from './init.ts';
export type { InitRDKitOptions } from './init.ts';
export { RDKit } from './rdkit.ts';
export type { MCSResult } from './rdkit.ts';
export { RDKitParseError } from './logger.ts';
export type {
  RDKitConfigureOptions,
  RDKitParseErrorEvent,
  RDKitParseOperation,
  RDKitFailCallback,
  RDKitEvents,
  RDKitGetMolOptions,
  RDKitGetQMolOptions,
  RDKitGetRxnOptions,
} from './types/rdkit-esm.typings.ts';
export type { RGDRow } from './rgd.ts';
export { Mol } from './mol.ts';
export { MolArray } from './mol-array.ts';
export { Reaction } from './reaction.ts';
export { Fingerprint } from './fingerprints/fingerprint.ts';
export { isRDKitParseError } from './logger.ts';

// Re-export useful types for consumers
export type {
  RDKitGetMolOpt,
  RDKitGetMolBlockOptions,
  RDKitDepictionDetails,
  RDKitSubstructMatch,
  RDKitDescriptors,
  RDKitJson,
  RDKitJsonAtom,
  RDKitJsonBond,
  RDKitJsonMolecule,
  RDKitJsonConformer2D,
  RDKitJsonConformer3D,
  RDKitJsonExtension,
  DrawColour,
  ColourPalette,
  RDKitStereoTags,
  RDKitRemoveHsOptions,
  RDKitAlignedCoordsOptions,
  RDKitMorganFPOptions,
  RDKitPatternFPOptions,
  RDKitTopologicalTorsionFPOptions,
  RDKitRdkitFpOptions,
  RDKitAtomPairFPOptions,
  RDKitGetMCSOptions,
  RDKitMCSResult,
  RDKitRxnDetails,
  RDKitGetRgdOptions,
  RDKitGetSmilesOptions,
} from './types/rdkit-minimalib-json-typings';

export type { RDKitModule, JSMol, JSReaction, MolList } from './types/rdkit-minimalib-typings';
