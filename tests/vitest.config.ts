import { defineConfig } from 'vitest/config';
import { codecovVitePlugin } from "@codecov/vite-plugin";
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../src')
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        root: '..',
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            reportsDirectory: './tests/coverage'
        },
        reporters: ['default', 'junit'],
        outputFile: 'test-report.junit.xml',
    },
    plugins: [
        // Put the Codecov vite plugin after all other plugins
        codecovVitePlugin({
            enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
            bundleName: "openseadragon-capture",
            uploadToken: process.env.CODECOV_TOKEN,
        }),
    ]
});
