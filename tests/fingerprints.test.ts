import { describe, it, expect, beforeAll } from 'vitest';
import { initRDKit, type RDKit } from '../src/index.ts';

const ESOMEPRAZOLE = 'COc1ccc2nc([nH]c2c1)[S@](=O)Cc1ncc(C)c(OC)c1C';
const LANSOPRAZOLE = 'FC(F)(F)COc1ccnc(c1C)CS(=O)c2[nH]c3ccccc3n2';

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
