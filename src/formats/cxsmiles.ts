import type { RDKitGetCxSmilesOptions } from '../types/rdkit-esm.typings';
import type { RDKitGetCXSmilesRawOptions } from '../types/rdkit-minimalib-json-typings';

/**
 * Converts wrapper-level CX SMILES options to the raw JSON format expected
 * by the RDKit MinimalLib API.
 */
export const buildCxSmilesRawOptions = (
  options: Partial<RDKitGetCxSmilesOptions>,
): Partial<RDKitGetCXSmilesRawOptions> => {
  const { fields: cxSmilesFields, restoreBondDirOption, ...smilesOpts } = options;
  const raw: Partial<RDKitGetCXSmilesRawOptions> = { ...smilesOpts };

  if (cxSmilesFields !== undefined) {
    if (cxSmilesFields.length === 0) {
      raw.CX_NONE = true;
    } else {
      for (const field of cxSmilesFields) {
        raw[`CX_${field}`] = true;
      }
    }
  }

  if (restoreBondDirOption !== undefined) {
    raw.restoreBondDirOption =
      restoreBondDirOption === 'clear' ? 'RestoreBondDirOptionClear' : 'RestoreBondDirOptionTrue';
  }

  return raw;
};
