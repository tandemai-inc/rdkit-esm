import { describe, it, expectTypeOf } from 'vitest';
import { Mol } from '../src';

describe('Mol type definitions', () => {
  it('has parameter safety for getSVG and returnDrawCoords', () => {
    expectTypeOf({ returnDrawCoords: true }).not.toExtend<Parameters<Mol['getSVG']>[0]>();
    expectTypeOf({ width: 200 }).toExtend<Parameters<Mol['getSVG']>[0]>();
    expectTypeOf({ returnDrawCoords: true }).toExtend<Parameters<Mol['getSVGWithDrawCoords']>[0]>();
    expectTypeOf({ width: 200 }).toExtend<Parameters<Mol['getSVGWithDrawCoords']>[0]>();
  });
});
