import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Same origin as `npm run dev:server` — required for `/api/*` from the SPA in dev and preview. */
const apiProxy = {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
});
