export { initRDKit } from './init.ts';
export type { RDKit, InitRDKitOptions, MCSResult } from './init.ts';
export { Mol } from './mol.ts';
export { MolCollection } from './mol-list.ts';

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
} from './types/rdkit-json-based-typings.d.ts';

export type { RDKitModule, JSMol, MolList } from './types/rdkit-typings.d.ts';
