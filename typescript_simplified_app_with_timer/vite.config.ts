import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize build output
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        // Vendor libraries change infrequently, so separating them
        // allows browsers to cache them independently
        manualChunks: {
          // React core - very stable, rarely changes
          'vendor-react': ['react', 'react-dom'],
          
          // Firebase - large library, load separately
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
          
          // Charts - only needed for analytics dashboard
          'vendor-charts': ['recharts'],
          
          // PDF generation - only needed for certificate download
          // These are dynamically imported but still benefit from separate chunks
          'vendor-pdf': ['jspdf', 'html2canvas'],
          
          // Icons - used throughout the app
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Warn if chunks are too large (500KB)
    chunkSizeWarningLimit: 500,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify output
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Optimize dev server
  server: {
    // Enable dependency pre-bundling
    warmup: {
      clientFiles: ['./src/App.tsx', './src/components/*.tsx'],
    },
  },
})
