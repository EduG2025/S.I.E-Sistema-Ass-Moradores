
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * S.I.E PRO - Optimized Vite Config (SRE PRODUCTION BRANCH V22.8)
 * Focus: Stabilize React-Is and Recharts interop.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-is', 'recharts', 'lucide-react', 'axios'],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Unificamos o core do vendor para evitar falhas de 'undefined' entre subdependências
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-is') || id.includes('scheduler') || id.includes('recharts') || id.includes('react-smooth')) {
              return 'vendor-kernel';
            }
            return 'vendor-utils';
          }
        },
        entryFileNames: 'assets/sie-[name]-[hash].js',
        chunkFileNames: 'assets/core-[name]-[hash].js',
        assetFileNames: 'assets/res-[name]-[hash].[ext]'
      }
    }
  }
});
