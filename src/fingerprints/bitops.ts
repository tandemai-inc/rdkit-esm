import type { Fingerprint } from './fingerprint';
import type { SimilarityMetric, TverskySimilarityOptions } from './fingerprints.types';

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

/** Count the number of on-bits in the intersection of two fingerprints. */
const intersectionSize = (a: Fingerprint, b: Fingerprint): number => {
  let c = 0;
  for (let i = 0; i < a.fpU32.length; i++) {
    c += hammingWeight(a.fpU32[i] & b.fpU32[i]);
  }
  return c;
};

export const computeFingerprintSimilarity = (
  a: Fingerprint,
  b: Fingerprint,
  metric: SimilarityMetric = 'tanimoto',
  options?: TverskySimilarityOptions,
): number => {
  if (a.nBits !== b.nBits) {
    throw new Error('Fingerprints must be of the same length');
  }

  switch (metric) {
    case 'tanimoto':
      return tanimotoSimilarity(a, b);
    case 'dice':
      return diceSimilarity(a, b);
    case 'cosine':
      return cosineSimilarity(a, b);
    case 'asymmetric':
      return asymmetricSimilarity(a, b);
    case 'tversky': {
      const { alpha = 1, beta = 1 } = options ?? {};
      return tverskySimilarity(a, b, alpha, beta);
    }
    default:
      throw new Error(`Unsupported similarity metric: ${metric}`);
  }
};

const tanimotoSimilarity = (a: Fingerprint, b: Fingerprint): number => {
  const c = intersectionSize(a, b);
  return c / (a.onBits + b.onBits - c);
};

/** Dice similarity: `2c / (a + b)` */
const diceSimilarity = (a: Fingerprint, b: Fingerprint): number => {
  const c = intersectionSize(a, b);
  return (2 * c) / (a.onBits + b.onBits);
};

/** Cosine similarity: `c / sqrt(a * b)` */
const cosineSimilarity = (a: Fingerprint, b: Fingerprint): number => {
  const c = intersectionSize(a, b);
  return c / Math.sqrt(a.onBits * b.onBits);
};

/** Asymmetric similarity (containment): `c / min(a, b)` */
const asymmetricSimilarity = (a: Fingerprint, b: Fingerprint): number => {
  const c = intersectionSize(a, b);
  return c / Math.min(a.onBits, b.onBits);
};

/**
 * Tversky similarity: `c / (α·a + β·b + (1−α−β)·c)`
 *
 * Special cases: Tversky(1,1) = Tanimoto; Tversky(0.5,0.5) = Dice.
 */
const tverskySimilarity = (a: Fingerprint, b: Fingerprint, alpha: number, beta: number): number => {
  const c = intersectionSize(a, b);
  return c / (alpha * a.onBits + beta * b.onBits + (1 - alpha - beta) * c);
};
