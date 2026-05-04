import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production' && process.env.VERCEL && !env.VITE_API_URL?.trim()) {
    throw new Error(
      'VITE_API_URL must be set for Vercel production builds. Use your Railway API base URL, e.g. https://your-service.up.railway.app (no trailing slash, no /api suffix).'
    );
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
