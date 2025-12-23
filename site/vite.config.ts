import { defineConfig } from 'vite';
import path from "node:path";

export default defineConfig(({ mode }) => ({
    root: path.resolve(__dirname),
    base: mode === "prod" ? '/openseadragon-filters/' : '/',
    build: {
        outDir: path.resolve(__dirname, "dist"),
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, "index.html"),
        },
    },
    esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment'
    },
    define: {
        'global': 'window'
    },
    server: {
        port: 3000,
        open: true
    }
}));
