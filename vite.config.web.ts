import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * GitHub Pages 纯前端构建配置（不含 Electron 插件）
 * base 必须与仓库名一致：https://<user>.github.io/<repo>/
 */
export default defineConfig({
  base: '/guangzi-helper/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          tesseract: ['tesseract.js']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['tesseract.js']
  }
});
