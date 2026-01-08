
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * S.I.E PRO - Optimized Vite Config (SRE PRODUCTION BRANCH V22.9)
 * FIX DEFINITIVO: Erro 'isElement' undefined em Recharts/React-Is interop.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // Força a resolução do react-is para a versão que o bundler consegue processar melhor
      'react-is': path.resolve(__dirname, 'node_modules/react-is'),
    },
  },
  optimizeDeps: {
    // Força o pré-bundle destas dependências para garantir interop ESM/CJS
    include: ['react', 'react-dom', 'react-is', 'recharts', 'lucide-react', 'axios', 'scheduler'],
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
      // Crucial: Inclui explicitamente o react-is na transformação de CommonJS para ESM
      include: [/node_modules\/react-is/, /node_modules\/recharts/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // UNIFICAÇÃO DE KERNEL: Mantemos Recharts e React-Is no mesmo chunk 'vendor-core'
            // Isso evita falhas de referência entre arquivos JS diferentes (chunks separados)
            if (
              id.includes('react') || 
              id.includes('react-dom') || 
              id.includes('react-is') || 
              id.includes('scheduler') ||
              id.includes('recharts') ||
              id.includes('react-smooth')
            ) {
              return 'vendor-core';
            }
            return 'vendor-lib';
          }
        },
        entryFileNames: 'assets/sie-[name]-[hash].js',
        chunkFileNames: 'assets/core-[name]-[hash].js',
        assetFileNames: 'assets/res-[name]-[hash].[ext]'
      }
    }
  }
});
