/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  server: {
    port: 3000,
    host: 'localhost',
  },
  preview: {
    port: 3001,
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
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] } },
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
      provider: 'v8' as const,
    },
  },
}));
