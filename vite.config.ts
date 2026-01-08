import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * S.I.E PRO - Optimized Vite Config (SRE PRODUCTION BRANCH V22.5)
 * Focus: Enterprise Code-Splitting, Asset Optimization, and Reverse Proxy Stability.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), // Corrected to root per SRE directory structure
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Redirects /api calls to the Node.js Kernel
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy for handling static user uploads
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
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    chunkSizeWarningLimit: 1500, // Adjusted for heavy SRE operational modules
    rollupOptions: {
      output: {
        // SRE Strategic Code Splitting
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-core';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-viz';
            }
            if (id.includes('leaflet')) {
              return 'vendor-geo';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('html2canvas') || id.includes('jspdf')) {
              return 'vendor-docs';
            }
            if (id.includes('axios') || id.includes('date-fns')) {
              return 'vendor-utils';
            }
            return 'vendor-others';
          }
        },
        // Hashed assets for robust cache invalidation
        entryFileNames: 'assets/sie-[name]-[hash].js',
        chunkFileNames: 'assets/core-[name]-[hash].js',
        assetFileNames: 'assets/res-[name]-[hash].[ext]'
      }
    }
  }
});
