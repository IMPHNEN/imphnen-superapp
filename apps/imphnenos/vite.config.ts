/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  server: {
    proxy: {
      '/rpc': {
        target: process.env.VITE_DEV_API_URL ?? 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/auth': {
        target: process.env.VITE_DEV_API_URL ?? 'http://localhost:8787',
        changeOrigin: true,
      },
    },
    port: 3007,
    host: 'localhost',
  },
  preview: {
    port: 3008,
    host: 'localhost',
  },
  plugins: [
    TanStackRouterVite({
      routeFileIgnorePattern: '_components|_hooks|_hook|_data',
    }),
    react(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: 'coverage',
      provider: 'v8',
    },
  },
}));
