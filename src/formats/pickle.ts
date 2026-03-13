import type { RDKitGetUint8ArrayOptions } from '../types/rdkit-esm.typings';
import type { RDKitGetMolAsPickleOptions } from '../types/rdkit-minimalib-json-typings';

export const buildGetMolAsUint8ArrayOptions = (
  options: RDKitGetUint8ArrayOptions['properties'],
): Partial<RDKitGetMolAsPickleOptions> => {
  const raw: Partial<RDKitGetMolAsPickleOptions['propertyFlags']> = {};
  for (const key of options) {
    raw[key] = true;
  }
  return { propertyFlags: raw };
};
