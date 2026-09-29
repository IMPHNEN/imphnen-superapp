import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// Browser calls go to the page origin in dev (see apiBaseUrl() in
// @imphnen-frontend-service/service/rpc), so the dev server proxies the API.
const DEV_API_URL = process.env.DEV_API_URL ?? 'http://localhost:8787';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: ['..', '../..'],
      },
      proxy: {
        '/rpc': {
          target: DEV_API_URL,
          changeOrigin: true,
        },
        '/api/auth': {
          target: DEV_API_URL,
          changeOrigin: true,
        },
      },
    },
  },
  output: 'static',
});
