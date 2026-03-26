import { wasm } from 'rolldown-plugin-wasm';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  exports: false,
  platform: 'browser',
  format: 'esm',
  inputOptions: {
    resolve: {
      mainFields: [],
    },
  },
  plugins: [
    wasm({
      fileName: 'RDKit_minimal.wasm',
      targetEnv: 'browser',
    }),
  ],
});
