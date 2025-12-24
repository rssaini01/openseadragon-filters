import { defineConfig } from 'vite';


export default defineConfig(({ mode }) => ({
    base: mode === "prod" ? '/openseadragon-filters/' : '/',
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: "index.html",
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
