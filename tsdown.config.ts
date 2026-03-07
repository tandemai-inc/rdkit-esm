import { wasm } from 'rolldown-plugin-wasm';
import { defineConfig } from 'tsdown';

export default defineConfig({
  exports: true,
  plugins: [wasm()],
});
