import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from 'vitest/config';
import envCompatible from 'vite-plugin-env-compatible';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    envCompatible()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  
  server: {
    proxy: {
      '/api': `${process.env.HOST}:${process.env.PORT}`, 
    }
  },
});
