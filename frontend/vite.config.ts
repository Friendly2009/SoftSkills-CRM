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
      // API v1 owns its prefix; retain rewriting only for legacy routes.
      rewrite: (url: string) => /^\/api\/v1(?:\/|$)/.test(url) ? url : url.replace(/^\/api/, ''),
    } } },
  };
});
