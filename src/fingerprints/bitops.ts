import type { Fingerprint } from './fingerprint';
import type { SimilarityMetric } from './fingerprints.types';

/**
 * From FastBitSet
 * @link https://github.com/lemire/FastBitSet.js
 *
 * Compute the Hamming weight of a 32-bit unsigned integer
 */
export const hammingWeight = (v: number) => {
  // works with signed or unsigned shifts
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
};

export const computeFingerprintSimilarity = (
  a: Fingerprint,
  b: Fingerprint,
  metric?: SimilarityMetric,
) => {
  if (a.nBits !== b.nBits) {
    throw new Error('Fingerprints must be of the same length');
  }

  switch (metric) {
    case 'tanimoto':
      return tanimotoSimilarity(a, b);
    default:
      throw new Error(`Unsupported similarity metric: ${metric}`);
  }
};

const tanimotoSimilarity = (a: Fingerprint, b: Fingerprint) => {
  let interBits = 0;
  for (let i = 0; i < a.fpU32.length; i++) {
    interBits += hammingWeight(a.fpU32[i] & b.fpU32[i]);
  }
  return interBits / (a.onBits + b.onBits - interBits);
};
