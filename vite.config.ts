
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * S.I.E PRO - Optimized Vite Config (SRE PRODUCTION BRANCH V23.0)
 * FIX DEFINITIVO: Interop ESM/CJS para React & Lucide-React.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // Força o bundler a usar a versão local do node_modules para evitar conflitos de CDN
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-is': path.resolve(__dirname, 'node_modules/react-is'),
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
      // CRÍTICO: Transforma TODOS os módulos CJS em ESM para garantir que 
      // exportações como 'forwardRef' sejam encontradas pelo Lucide e Recharts.
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Kernel Unitário: Mantém React e dependências fundamentais juntas
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react-is') || 
              id.includes('scheduler') ||
              id.includes('lucide-react')
            ) {
              return 'vendor-kernel';
            }
            // Recharts tem muitas subdependências, mantemos em chunk separado
            if (id.includes('recharts') || id.includes('d3') || id.includes('react-smooth')) {
              return 'vendor-charts';
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
