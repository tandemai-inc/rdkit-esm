import { expect, test } from 'vitest';
import { initRDKit, Mol } from '../src/index.ts';

test('public API exports are available', () => {
  expect(initRDKit).toBeTypeOf('function');
  expect(Mol).toBeTypeOf('function');
});
