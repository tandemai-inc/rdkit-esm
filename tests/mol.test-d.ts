import { describe, it, expectTypeOf } from 'vitest';
import {
  Mol,
  type RDKitConformers,
  type RDKitForceFieldEnergyResult,
  type RDKitMinimization,
} from '../src';

describe('Mol type definitions', () => {
  it('has parameter safety for getSVG and returnDrawCoords', () => {
    expectTypeOf({ returnDrawCoords: true }).not.toExtend<Parameters<Mol['getSVG']>[0]>();
    expectTypeOf({ returnDrawCoords: false }).not.toExtend<Parameters<Mol['getSVG']>[0]>();
    expectTypeOf({ returnDrawCoords: undefined }).not.toExtend<Parameters<Mol['getSVG']>[0]>();
    expectTypeOf({ width: 200 }).toExtend<Parameters<Mol['getSVG']>[0]>();
    expectTypeOf({ returnDrawCoords: true }).not.toExtend<
      Parameters<Mol['getSVGWithDrawCoords']>[0]
    >();
    expectTypeOf({ width: 200 }).toExtend<Parameters<Mol['getSVGWithDrawCoords']>[0]>();
  });

  it('force-field methods return non-null results with throwOnError: true', () => {
    const mol = {} as Mol;
    expectTypeOf(mol.getForceFieldEnergy()).toEqualTypeOf<RDKitForceFieldEnergyResult | null>();
    expectTypeOf(
      mol.getForceFieldEnergy({ throwOnError: true }),
    ).toEqualTypeOf<RDKitForceFieldEnergyResult>();
    expectTypeOf(mol.minimize()).toEqualTypeOf<RDKitMinimization | null>();
    expectTypeOf(mol.minimize({ throwOnError: true })).toEqualTypeOf<RDKitMinimization>();
    expectTypeOf(mol.generateConformers()).toEqualTypeOf<RDKitConformers | null>();
    expectTypeOf(mol.generateConformers({ throwOnError: true })).toEqualTypeOf<RDKitConformers>();
  });

  it('minimize coordinates have the same shape as getCoords', () => {
    expectTypeOf<RDKitMinimization['frames'][number]['coords']>().toEqualTypeOf<
      ReturnType<Mol['getCoords']>
    >();
  });

  it('getSubstructMatches is callable with and without options', () => {
    const mol = {} as Mol;
    expectTypeOf(mol.getSubstructMatches).toBeCallableWith('');
    expectTypeOf(mol.getSubstructMatches).toBeCallableWith('', { uniquify: true });
  });
});
