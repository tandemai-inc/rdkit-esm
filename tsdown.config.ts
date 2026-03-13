import { wasm } from 'rolldown-plugin-wasm';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  exports: true,
  platform: 'neutral',
  inputOptions: {
    resolve: {
      mainFields: [],
    },
  },
  plugins: [wasm()],
});
