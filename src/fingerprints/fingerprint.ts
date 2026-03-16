import { tanimotoSimilarity } from './bitops';

export namespace FingerPrint {
  export const toString = (fp: Uint8Array) => {
    const pieces: string[] = [];
    for (const byte of fp) {
      pieces.push(...byte.toString(2).split('').reverse());
    }
    return pieces.join('');
  };

  export const computeSimilarity = (a: Uint8Array, b: Uint8Array, metric?: 'tanimoto') => {
    if (a.length !== b.length) {
      throw new Error('Fingerprints must be of the same length');
    }

    switch (metric) {
      case 'tanimoto':
        return tanimotoSimilarity(a, b);
      default:
        throw new Error(`Unsupported similarity metric: ${metric}`);
    }
  };
}
