export { initRDKit } from './init.ts';
export type { RDKit, InitRDKitOptions } from './init.ts';
export { Mol } from './mol.ts';

// Re-export useful types for consumers
export type {
  RDKitGetMolOpt,
  RDKitGetMolBlockOpt,
  RDKitDepictionDetails,
  RDKitSubstructMatch,
  RDKitDescriptors,
  RDKitJson,
} from './types/rdkit-json-based-typings.d.ts';

export type { RDKitModule, JSMol } from './types/rdkit-typings.d.ts';
