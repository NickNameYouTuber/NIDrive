import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    // Разрешаем все хосты для разработки
    allowedHosts: [
      'drive.nicorp.tech',
      'localhost',
      '127.0.0.1',
      '0.0.0.0'
    ],
    proxy: {
      '/auth': {
        target: 'http://localhost:7070',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:7070',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://localhost:7070',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:7070',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:7070',
        changeOrigin: true,
      },
    },
  },
});