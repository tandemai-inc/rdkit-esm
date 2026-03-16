/**
 * From FastBitSet
 * @link https://github.com/lemire/FastBitSet.js
 *
 * Compute the Hamming weight of a 32-bit unsigned integer
 */
const hammingWeight = (v: number) => {
  // works with signed or unsigned shifts
  v -= (v >>> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return (((v + (v >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
};

export const tanimotoSimilarity = (a: Uint8Array, b: Uint8Array) => {
  let commonBits = 0;
  let totalBits = 0;

  const u32a = new Uint32Array(a.buffer, a.byteOffset, a.byteLength >> 2);
  const u32b = new Uint32Array(b.buffer, b.byteOffset, b.byteLength >> 2);

  for (let i = 0; i < u32a.length; i++) {
    commonBits += hammingWeight(u32a[i] & u32b[i]);
    totalBits += hammingWeight(u32a[i] | u32b[i]);
  }

  // Handle remaining bytes (if length not multiple of 4)
  for (let i = u32a.length << 2; i < a.byteLength; i++) {
    commonBits += hammingWeight(a[i] & b[i]);
    totalBits += hammingWeight(a[i] | b[i]);
  }

  return commonBits / totalBits;
};
