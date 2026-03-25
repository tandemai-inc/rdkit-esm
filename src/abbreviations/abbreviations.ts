//import type { AbbreviationDefinition } from '../types/rdkit-esm.typings';

export const DEFAULT_MAX_COVERAGE = 0.4;
export const DEFAULT_USE_LINKERS = false;

// /** Sentinel returned by minilib.cpp `condense_abbreviations_from_defs` when definition parsing fails.
//  * @see rdkit/Code/MinimalLib/minilib.cpp — JSMolBase::condense_abbreviations_from_defs */
// export const CANNOT_PARSE_ABBREVIATIONS = 'cannot parse abbreviations';

// export function abbreviationDefsToText(defs: AbbreviationDefinition[]): string {
//   const lines: string[] = [];
//   for (const def of defs) {
//     const { label, smarts } = def;
//     if (!label || !smarts) continue; // defensive: skip incomplete entries
//     if (hasDisplayLabel(def)) {
//       const { displayLabel, displayLabelW } = def;
//       const displayLabelWest = displayLabelW || displayLabel; // fallback if falsy
//       lines.push(`${label}\t${smarts}\t${displayLabel}\t${displayLabelWest}`);
//     } else {
//       lines.push(`${label}\t${smarts}`);
//     }
//   }
//   return lines.join('\n');
// }

// const hasDisplayLabel = (def: AbbreviationDefinition): def is Extract<AbbreviationDefinition, { displayLabel: string }> => {
//   return 'displayLabel' in def && typeof def.displayLabel === 'string' && def.displayLabel.trim() !== '';
// }
