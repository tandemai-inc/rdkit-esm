import { describe, it, expectTypeOf } from 'vitest';
import { Mol, RDKit, Reaction } from '../src';

describe('RDKit type definitions', () => {
  it('has null type safety for getMol', () => {
    const rdkit = {} as RDKit;
    expectTypeOf(rdkit.getMol('c1ccccc1')).toEqualTypeOf<Mol | null>();
    expectTypeOf(rdkit.getMol('c1ccccc1', { throwOnError: true })).toEqualTypeOf<Mol>();
    expectTypeOf(rdkit.getMol('c1ccccc1', { throwOnError: false })).toEqualTypeOf<Mol | null>();
    expectTypeOf(rdkit.getMol('c1ccccc1', { assignStereo: false })).toEqualTypeOf<Mol | null>();
  });

  it('has null type safety for getQMol', () => {
    const rdkit = {} as RDKit;
    expectTypeOf(rdkit.getQMol('c1ccccc1')).toEqualTypeOf<Mol | null>();
    expectTypeOf(rdkit.getQMol('c1ccccc1', { throwOnError: true })).toEqualTypeOf<Mol>();
    expectTypeOf(rdkit.getQMol('c1ccccc1', { throwOnError: false })).toEqualTypeOf<Mol | null>();
  });

  it('has null type safety for getRxn', () => {
    const rdkit = {} as RDKit;
    expectTypeOf(rdkit.getRxn('c1ccccc1>>c1ccccc1')).toEqualTypeOf<Reaction | null>();
    expectTypeOf(
      rdkit.getRxn('c1ccccc1>>c1ccccc1', { throwOnError: true }),
    ).toEqualTypeOf<Reaction>();
    expectTypeOf(
      rdkit.getRxn('c1ccccc1>>c1ccccc1', { throwOnError: false }),
    ).toEqualTypeOf<Reaction | null>();
    expectTypeOf(
      rdkit.getRxn('c1ccccc1>>c1ccccc1', { useSmiles: true }),
    ).toEqualTypeOf<Reaction | null>();
  });
});
