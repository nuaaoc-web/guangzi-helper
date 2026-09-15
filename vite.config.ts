import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart: (options) => {
          if (options.startup) {
            options.startup();
          }
        },
        vite: {
          build: {
            sourcemap: true,
            minify: false,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron', 'electron-store']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart: (options) => {
          if (options.reload) {
            options.reload();
          }
        },
        vite: {
          build: {
            sourcemap: true,
            minify: false,
            outDir: 'dist-electron'
          }
        }
      },
      {
        entry: 'electron/auto-fill-preload.ts',
        onstart: (options) => {
          if (options.reload) {
            options.reload();
          }
        },
        vite: {
          build: {
            sourcemap: true,
            minify: false,
            outDir: 'dist-electron'
          }
        }
      }
    ]),
    renderer()
  ],
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
