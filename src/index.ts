export { initRDKit } from './init.ts';
export type { RDKit, InitRDKitOptions, MCSResult } from './init.ts';
export { Mol } from './mol.ts';
export { MolCollection } from './mol-list.ts';
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
  RDKitAlignedCoordsOpt,
  RDKitMorganFPOptions,
  RDKitPatternFPOptions,
  RDKitTopologicalTorsionFPOptions,
  RDKitRdkitFpOptions,
  RDKitAtomPairFPOptions,
  RDKitGetMCSOpt,
  RDKitMCSResult,
  RDKitRxnDetails,
} from './types/rdkit-json-based-typings.d.ts';

export type { RDKitModule, JSMol, JSReaction, MolList } from './types/rdkit-typings.d.ts';
