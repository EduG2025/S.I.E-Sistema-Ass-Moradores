
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * S.I.E PRO - Optimized Vite Config (SRE PRODUCTION BRANCH V24.0)
 * FIX DEFINITIVO: Resolve erro "isElement of undefined" em produção.
 * Protocolo de Resiliência para builds em VPS (Ubuntu/PM2).
 */
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'global': 'window',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-is', 
      'recharts', 
      'lucide-react', 
      'axios', 
      'scheduler'
    ],
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
            // Kernel Unitário Crítico
            if (
              id.includes('react/') || 
              id.includes('react-dom/') || 
              id.includes('react-is/') || 
              id.includes('scheduler/')
            ) {
              return 'vendor-core';
            }
            // Visualização e Gráficos
            if (id.includes('recharts') || id.includes('d3') || id.includes('react-smooth')) {
              return 'vendor-charts';
            }
            // Ícones
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-utils';
          }
        },
        entryFileNames: 'assets/sie-kernel-[hash].js',
        chunkFileNames: 'assets/core-[name]-[hash].js',
        assetFileNames: 'assets/res-[name]-[hash].[ext]'
      }
    }
  }
});
