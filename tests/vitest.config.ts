import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setup.ts'],
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
    },
    reporters: ['default', 'junit'],
    outputFile: '../test-results.xml',
  },
});
