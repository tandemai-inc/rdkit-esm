export { initRDKit } from './init.ts';
export type { RDKit, InitRDKitOptions, MCSResult } from './init.ts';
export type { RGDRow } from './rgd.ts';
export { Mol } from './mol.ts';
export { MolArray } from './mol-array.ts';
export { Reaction } from './reaction.ts';

// Re-export useful types for consumers
export type {
  RDKitGetMolOpt,
  RDKitGetMolBlockOptions,
  RDKitDepictionDetails,
  RDKitSubstructMatch,
  RDKitDescriptors,
  RDKitJson,
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
