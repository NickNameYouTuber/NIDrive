import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 7071,
    proxy: {
      // Проксируем все запросы к API напрямую без префикса /api
      '/auth': {
        target: 'http://backend:7070',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://backend:7070',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://backend:7070',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://backend:7070',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://backend:7070',
        changeOrigin: true,
      },
    },
  },
});
