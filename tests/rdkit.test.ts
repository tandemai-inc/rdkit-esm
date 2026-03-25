import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { initRDKit, isRDKitParseError, RDKitParseError, type RDKit } from '../src/index.ts';

let rdkit: RDKit;

beforeAll(async () => {
  rdkit = await initRDKit();
});

describe('getMol', () => {
  it('getMol returns a Mol for valid SMILES', () => {
    const mol = rdkit.getMol('c1ccccc1');
    expect(mol).not.toBeNull();
    expect(mol!.isValid()).toBe(true);
    mol!.delete();
  });

  it('getMol returns a Mol with specified options', () => {
    using mol = rdkit.getMol('C1=CC=CC=C1', { setAromaticity: false });
    expect(mol).not.toBeNull();
    const json = mol!.getJSON();
    expect(json.molecules[0].extensions[0].aromaticAtoms).toBeUndefined();
  });

  it('getMol returns null for invalid SMILES', () => {
    const mol = rdkit.getMol('not_a_molecule');
    expect(mol).toBeNull();
  });

  it('getMol accepts a Uint8Array input', () => {
    const mol = rdkit.getMol('c1ccccc1')!;
    const pickled = mol.getAsUint8Array();
    mol.delete();
    const mol2 = rdkit.getMol(pickled)!;
    expect(mol2).not.toBeNull();
    expect(mol2.getSmiles()).toBe('c1ccccc1');
    mol2.delete();
  });
});

describe('getQMol', () => {
  it('getQMol returns a Mol for valid SMARTS', () => {
    const mol = rdkit.getQMol('[#6]');
    expect(mol).not.toBeNull();
    mol!.delete();
  });
});

// Acetylcholine: valid quaternary ammonium form vs invalid tetravalent neutral N form
const ACETYLCHOLINE = 'CC(=O)OCC[N+](C)(C)C';
const ACETYLCHOLINE_INVALID = 'CC(=O)OCCN(C)(C)C'; // N has 4 bonds/0 charge — exceeds valence

describe('throwOnError', () => {
  it('getMol with throwOnError: true returns Mol for valid SMILES', () => {
    using mol = rdkit.getMol(ACETYLCHOLINE, { throwOnError: true });
    expect(mol).not.toBeNull();
  });

  it('getMol with throwOnError: true throws RDKitParseError for tetravalent N', () => {
    expect(() => rdkit.getMol(ACETYLCHOLINE_INVALID, { throwOnError: true })).toThrow(
      RDKitParseError,
    );
  });

  it('RDKitParseError carries the original input', () => {
    try {
      rdkit.getMol(ACETYLCHOLINE_INVALID, { throwOnError: true });
    } catch (e) {
      expect(e).toBeInstanceOf(RDKitParseError);
      expect((e as RDKitParseError).input).toBe(ACETYLCHOLINE_INVALID);
    }
  });

  it('RDKitParseError.rdkitMessage describes the valence problem', () => {
    try {
      rdkit.getMol(ACETYLCHOLINE_INVALID, { throwOnError: true });
    } catch (e) {
      expect(e).toBeInstanceOf(RDKitParseError);
      if (isRDKitParseError(e)) {
        const msg = e.rdkitMessage.toLowerCase();
        expect(msg).toMatch(/valence/);
      } else {
        throw e; // fail the test
      }
    }
  });

  it('getMol without throwOnError still returns null for same input', () => {
    expect(rdkit.getMol(ACETYLCHOLINE_INVALID)).toBeNull();
  });

  it('getQMol with throwOnError: true throws for invalid SMARTS', () => {
    expect(() => rdkit.getQMol('not_smarts_at_all!!', { throwOnError: true })).toThrow(
      RDKitParseError,
    );
  });

  it('getRxn with throwOnError: true throws for invalid reaction SMARTS', () => {
    expect(() => rdkit.getRxn('not_a_reaction', { throwOnError: true })).toThrow(RDKitParseError);
  });
});

describe('events.addErrorListener', () => {
  it('fires with input and message when getMol returns null', () => {
    const listener = vi.fn((e) => e);
    const off = rdkit.events.addErrorListener(listener);

    rdkit.getMol(ACETYLCHOLINE_INVALID)?.delete();

    off();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveReturnedWith({
      input: ACETYLCHOLINE_INVALID,
      message: expect.stringContaining('valence'),
      operation: 'getMol',
    });
  });

  it('does not fire after cleanup function is called', () => {
    const listener = vi.fn((e) => e);
    const off = rdkit.events.addErrorListener(listener);
    off();

    rdkit.getMol(ACETYLCHOLINE_INVALID)?.delete();

    expect(listener).not.toHaveBeenCalled();
  });

  it('replaces previous listener when called twice', () => {
    const firstListener = vi.fn((e) => e);
    const secondListener = vi.fn((e) => e);

    rdkit.events.addErrorListener(firstListener);
    const off = rdkit.events.addErrorListener(secondListener);

    rdkit.getMol(ACETYLCHOLINE_INVALID)?.delete();

    off();
    expect(firstListener).not.toHaveBeenCalled(); // replaced
    expect(secondListener).toHaveBeenCalledTimes(1);
  });

  it('fires before throw when combined with throwOnError: true', () => {
    const listener = vi.fn((e) => e);
    const off = rdkit.events.addErrorListener(listener);

    expect(() => rdkit.getMol(ACETYLCHOLINE_INVALID, { throwOnError: true })).toThrow(
      RDKitParseError,
    );
    expect(listener).toHaveBeenCalledTimes(1);

    off();
  });
});

// The WASM module binds err = console.error.bind(console) at initRDKitModule() call time.
// A spy created after init cannot intercept those calls because bind captures the function value.
// Solution: spy on console.error BEFORE calling initRDKit() so the WASM captures the spy in err.
// A separate rdkit2 instance is used here to keep this setup isolated from the shared rdkit above.
//
// set_log_capture (enableLogging: false) writes to the JS buffer only — console.error not called.
// set_log_tee    (enableLogging: true)  writes to both the JS buffer AND calls console.error.
describe('configure({ enableLogging })', () => {
  let rdkit2: RDKit;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    consoleSpy = vi.spyOn(console, 'error'); // spy BEFORE init — WASM captures it in err binding
    rdkit2 = await initRDKit();
    consoleSpy.mockClear(); // blank slate
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  afterEach(() => {
    consoleSpy.mockClear();
    rdkit2.configure({ enableLogging: false });
  });

  it('does not call console.error by default (set_log_capture) when a listener is registered', () => {
    const listener = vi.fn((e) => e);
    const off = rdkit2.events.addErrorListener(listener);

    rdkit2.getMol(ACETYLCHOLINE_INVALID);

    off();
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls console.error when enableLogging: true (set_log_tee) and a listener is registered', () => {
    rdkit2.configure({ enableLogging: true });
    const listener = vi.fn((e) => e);
    const off = rdkit2.events.addErrorListener(listener);

    rdkit2.getMol(ACETYLCHOLINE_INVALID);

    off();
    expect(consoleSpy).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls console.error when enableLogging: true and throwOnError throws', () => {
    rdkit2.configure({ enableLogging: true });

    expect(() => rdkit2.getMol(ACETYLCHOLINE_INVALID, { throwOnError: true })).toThrow(
      RDKitParseError,
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('does not call console.error when enableLogging: false and throwOnError throws', () => {
    expect(() => rdkit2.getMol(ACETYLCHOLINE_INVALID, { throwOnError: true })).toThrow(
      RDKitParseError,
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
