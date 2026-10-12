export { initRDKit } from './init.ts';
export type { InitRDKitOptions } from './init.ts';
export { RDKit } from './rdkit.ts';
export type { MCSResult } from './rdkit.ts';
export { RDKitParseError, RDKitOperationError } from './logger.ts';
export type {
  RDKitConfigureOptions,
  RDKitParseErrorEvent,
  RDKitParseOperation,
  RDKitMolOperation,
  RDKitOperation,
  RDKitForceFieldEnergyOptions,
  RDKitMinimizeOptions,
  RDKitMinimization,
  RDKitMinimizationFrame,
  RDKitGenerateConformersOptions,
  RDKitConformers,
  RDKitFailCallback,
  RDKitEvents,
  RDKitGetMolOptions,
  RDKitGetQMolOptions,
  RDKitGetRxnOptions,
  RDKitGetCxSmilesOptions,
  RDKitCondenseAbbreviationsOptions,
  RDKitGetSVGOptions,
  RDKitMmpaFragsOptions,
  SubstructLibraryOptions,
  SubstructLibraryAddOptions,
  SubstructLibrarySearchOptions,
} from './types/rdkit-esm.typings.ts';
export type { RGDRow } from './rgd.ts';
export { Mol } from './mol.ts';
export type { MMPAFragmentation, RDKitMmpaFragsResult } from './mol.ts';
export { MolArray } from './mol-array.ts';
export { Reaction } from './reaction.ts';
export { Fingerprint } from './fingerprints/fingerprint.ts';
export type {
  SimilarityMetric,
  TverskySimilarityOptions,
} from './fingerprints/fingerprints.types.ts';
export { isRDKitParseError, isRDKitOperationError } from './logger.ts';
export { SubstructLibraryWrapper } from './substruct-library.ts';

// Re-export useful types for consumers
export type { SubstructLibraryEntry, SubstructLibrarySearchResult } from './substruct-library.ts';

export type {
  RDKitGetMolOpt,
  RDKitGetMolBlockOptions,
  RDKitSubstructMatch,
  RDKitSubstructMatchOptions,
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
  ColourPaletteName,
  DrawingExtentsInclude,
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
  RDKitGetFragsOptions,
  RDKitSanitizeFlags,
  RDKitForceFieldName,
  RDKitForceFieldDetails,
  RDKitForceFieldEnergyDetails,
  RDKitForceFieldEnergyResult,
  RDKitMinimizeDetails,
  RDKitMinimizeResult,
  RDKitForceFieldFrame,
  RDKitGenerateConformersDetails,
  RDKitGenerateConformersResult,
} from './types/rdkit-minimalib-json-typings';

export type { RDKitModule, JSMol, JSReaction, MolList } from './types/rdkit-minimalib-typings';
