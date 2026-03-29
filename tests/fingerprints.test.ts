import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit, Fingerprint } from '../src/index.ts';
import { computeFingerprintSimilarity } from '../src/fingerprints/bitops.ts';

const ESOMEPRAZOLE = 'COc1ccc2nc([nH]c2c1)[S@](=O)Cc1ncc(C)c(OC)c1C';
const LANSOPRAZOLE = 'FC(F)(F)COc1ccnc(c1C)CS(=O)c2[nH]c3ccccc3n2';
const PHENOL = 'c1ccccc1O';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('Fingerprint similarity', () => {
  it('tanimoto similarity with RDKit fingerprint', () => {
    using molA = rdkit.getMol(ESOMEPRAZOLE)!;
    using molB = rdkit.getMol(LANSOPRAZOLE)!;
    const fpA = molA.getRdkitFp();
    const fpB = molB.getRdkitFp();
    const sim = rdkit.computeFingerprintsSimilarity(fpA, fpB, 'tanimoto');
    expect(sim).toBeCloseTo(0.7943722943722944, 10);
  });

  it('tanimoto similarity with Morgan fingerprint (radius=2)', () => {
    using molA = rdkit.getMol(ESOMEPRAZOLE)!;
    using molB = rdkit.getMol(LANSOPRAZOLE)!;
    const fpA = molA.getMorganFp({ radius: 2 });
    const fpB = molB.getMorganFp({ radius: 2 });
    const sim = rdkit.computeFingerprintsSimilarity(fpA, fpB, 'tanimoto');
    expect(sim).toBeCloseTo(0.4264705882352941, 10);
  });

  it('returns a string representation of fingerprints', () => {
    using mol = rdkit.getMol(ESOMEPRAZOLE)!;
    const fp = mol.getRdkitFp();
    const txt = `${fp}`;
    expect(txt).toBe(fp.toString());
    expect(txt.length).toBe(fp.nBits);
  });
});

/**
 * Synthetic reference fingerprints for metric validation.
 *
 * fp3: bits {0,2,4} set → onBits=3   [0x15, 0x00]
 * fp5: bits {0,2,4,6,8} set → onBits=5 [0x55, 0x01]
 * intersection: {0,2,4} → c=3 (fp3 ⊆ fp5)
 *
 * Expected values derived from the same formulas as RDKit's BitOps.h/BitOps.cpp
 * and cross-checked against testDatastructs.cpp / UnitTestcBitVect.py.
 */
const fp3 = new Fingerprint(new Uint8Array([0x15, 0x00]), 16, 'RDKit'); // onBits=3
const fp5 = new Fingerprint(new Uint8Array([0x55, 0x01]), 16, 'RDKit'); // onBits=5

describe('Similarity metrics (synthetic fingerprints)', () => {
  // c=3, a=3, b=5

  it('tanimoto: 3/(3+5-3) = 0.6', () => {
    expect(computeFingerprintSimilarity(fp3, fp5, 'tanimoto')).toBeCloseTo(0.6, 10);
  });

  it('default metric is tanimoto', () => {
    expect(computeFingerprintSimilarity(fp3, fp5)).toBeCloseTo(0.6, 10);
  });

  it('dice: 2*3/(3+5) = 0.75', () => {
    expect(computeFingerprintSimilarity(fp3, fp5, 'dice')).toBeCloseTo(0.75, 10);
  });

  it('cosine: 3/sqrt(15) ≈ 0.7746', () => {
    expect(computeFingerprintSimilarity(fp3, fp5, 'cosine')).toBeCloseTo(3 / Math.sqrt(15), 10);
  });

  it('asymmetric: 3/min(3,5) = 1.0 (fp3 ⊆ fp5)', () => {
    expect(computeFingerprintSimilarity(fp3, fp5, 'asymmetric')).toBeCloseTo(1.0, 10);
  });

  it('tversky(1,1) equals tanimoto', () => {
    expect(computeFingerprintSimilarity(fp3, fp5, 'tversky', { alpha: 1, beta: 1 })).toBeCloseTo(
      0.6,
      10,
    );
  });

  it('tversky(0.5,0.5) equals dice', () => {
    expect(
      computeFingerprintSimilarity(fp3, fp5, 'tversky', { alpha: 0.5, beta: 0.5 }),
    ).toBeCloseTo(0.75, 10);
  });

  it('tversky(0.3,0.7): 3/(0.9+3.5+0) ≈ 0.6818', () => {
    // α+β=1 → (1-α-β)·c=0, denominator = 0.3·3 + 0.7·5 = 0.9 + 3.5 = 4.4
    expect(
      computeFingerprintSimilarity(fp3, fp5, 'tversky', { alpha: 0.3, beta: 0.7 }),
    ).toBeCloseTo(3 / 4.4, 10);
  });
});

describe('Fingerprint bit counts and binary consistency (phenol)', () => {
  it('Morgan FP: 2048 bits, 11 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getMorganFp();
    expect(fp.nBits).toBe(2048);
    expect(fp.onBits).toBe(11);
  });

  it('Morgan FP: string and binary representations are consistent', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getMorganFp();
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
    expect(fp.fpU8).toEqual(mol.getMorganFp().fpU8);
  });

  it('Morgan FP with {radius:0, nBits:512}: 512 bits, 3 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getMorganFp({ radius: 0, nBits: 512 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(3);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Pattern FP: 2048 bits, 73 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getPatternFp();
    expect(fp.nBits).toBe(2048);
    expect(fp.onBits).toBe(73);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Pattern FP with {nBits:256}: 256 bits, 65 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getPatternFp({ nBits: 256 });
    expect(fp.nBits).toBe(256);
    expect(fp.onBits).toBe(65);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Topological torsion FP: 2048 bits, 8 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getTopologicalTorsionFp();
    expect(fp.nBits).toBe(2048);
    expect(fp.onBits).toBe(8);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Topological torsion FP with {nBits:512}: 512 bits, 8 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getTopologicalTorsionFp({ nBits: 512 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(8);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('RDKit FP: 2048 bits, 38 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getRdkitFp();
    expect(fp.nBits).toBe(2048);
    expect(fp.onBits).toBe(38);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('RDKit FP with {nBits:512}: 512 bits, 37 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getRdkitFp({ nBits: 512 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(37);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('RDKit FP with {nBits:512, minPath:2}: 512 bits, 34 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getRdkitFp({ nBits: 512, minPath: 2 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(34);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('RDKit FP with {nBits:512, minPath:2, maxPath:4}: 512 bits, 16 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getRdkitFp({ nBits: 512, minPath: 2, maxPath: 4 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(16);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Atom pair FP: 2048 bits, 19 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getAtomPairFp();
    expect(fp.nBits).toBe(2048);
    expect(fp.onBits).toBe(19);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Atom pair FP with {nBits:512}: 512 bits, 19 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getAtomPairFp({ nBits: 512 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(19);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Atom pair FP with {nBits:512, minLength:2}: 512 bits, 13 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getAtomPairFp({ nBits: 512, minLength: 2 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(13);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('Atom pair FP with {nBits:512, minLength:2, maxLength:3}: 512 bits, 12 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getAtomPairFp({ nBits: 512, minLength: 2, maxLength: 3 });
    expect(fp.nBits).toBe(512);
    expect(fp.onBits).toBe(12);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });

  it('MACCS FP: 167 bits, 10 on-bits', () => {
    using mol = rdkit.getMol(PHENOL)!;
    const fp = mol.getMaccsFp();
    expect(fp.nBits).toBe(167);
    expect(fp.onBits).toBe(10);
    expect(fp.fpU8.length).toBe(Math.ceil(fp.nBits / 8));
  });
});
