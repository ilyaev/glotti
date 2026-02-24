import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetUrl = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/ws': {
          target: targetUrl,
          ws: true,
          changeOrigin: true,
        },
        '/health': {
          target: targetUrl,
          changeOrigin: true,
        },
        '/api': {
          target: targetUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: '../client-dist',
      emptyOutDir: true,
    },
  };
});
