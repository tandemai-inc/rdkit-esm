import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/*.test-d.ts', '**/node_modules/**', 'examples/**'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'text'],
      include: ['src/**/*.{ts,tsx}'],
    },
    typecheck: {
      enabled: true,
      ignoreSourceErrors: false,
      tsconfig: './tsconfig.test.json',
    },
  },
});
