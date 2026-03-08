import { wasm } from 'rolldown-plugin-wasm';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  exports: true,
  platform: 'browser',
  plugins: [wasm()],
});
