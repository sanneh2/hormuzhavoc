import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hormuzhavoc/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 3000,
    open: true,
  }
});
