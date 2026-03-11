export { initRDKit } from './init.ts';
export type { RDKit, InitRDKitOptions, MCSResult } from './init.ts';
export type { RGDRow } from './rgd.ts';
export { Mol } from './mol.ts';
export { MolCollection } from './mol-collection.ts';
export { Reaction } from './reaction.ts';

// Re-export useful types for consumers
export type {
  RDKitGetMolOpt,
  RDKitGetMolBlockOpt,
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
  RDKitGetMCSOpt,
  RDKitMCSResult,
  RDKitRxnDetails,
  RDKitGetRgdOptions,
} from './types/rdkit-json-based-typings.d.ts';

export type { RDKitModule, JSMol, JSReaction, MolList } from './types/rdkit-typings.d.ts';
