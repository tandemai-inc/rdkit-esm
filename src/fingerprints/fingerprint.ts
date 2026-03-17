import { hammingWeight } from "./bitops";
import type { FingerprintType } from "./fingerprints.types";

export class Fingerprint {
  public readonly nBits: number;
  public readonly fpU32: Uint32Array;
  public readonly fpU8: Uint8Array;
  private _onBits: number | null = null;
  public type?: FingerprintType;

  constructor(fpU8: Uint8Array, nBits?: number, type?: FingerprintType) {
    this.nBits = nBits ?? fpU8.length * 8;
    this.type = type;
    this.fpU8 = fpU8;

    if (fpU8.length % 4) {
      const padded = new Uint8Array(fpU8.length + (4 - (fpU8.length % 4)));
      padded.set(fpU8);
      this.fpU32 = new Uint32Array(padded.buffer);
    } else {
      this.fpU32 = new Uint32Array(fpU8.buffer);
    }
  }

  get onBits() {
    if (this._onBits !== null) return this._onBits;
    let count = 0;
    for (let i = 0; i < this.fpU32.length; i++) {
      count += hammingWeight(this.fpU32[i]);
    }
    this._onBits = count;
    return this._onBits;
  }

  get uint8Array() {
    return this.fpU8;
  }

  toString() {
    const pieces: string[] = [];
    for (const byte of this.fpU8) {
      pieces.push(...byte.toString(2).padStart(8, "0").split("").reverse());
    }
    return pieces.join("").substring(0, this.nBits);
  }
}
