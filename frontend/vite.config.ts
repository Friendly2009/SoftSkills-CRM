import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    server: { proxy: { '/api': {
      target: env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
      changeOrigin: true,
      // The supplied legacy backend registers routes at /, not /api.
      rewrite: (url: string) => url.replace(/^\/api/, ''),
    } } },
  };
});
