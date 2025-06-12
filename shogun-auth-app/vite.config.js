import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Base configuration
  root: '.',
  base: '/',
  
  // Development server
  server: {
    port: 8080,
    host: true,
    open: true,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Preview server (for built files)
  preview: {
    port: 8080,
    host: true,
    open: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        manualChunks: {
          vendor: ['gun']
        }
      }
    }
  },
  
  // Plugins
  plugins: [react()],
  
  // Optimizations
  optimizeDeps: {
    include: ['gun'],
    exclude: []
  },
  
  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
    global: 'globalThis',
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  // Asset handling
  assetsInclude: ['**/*.md', '**/*.txt'],
  
  // Worker configuration
  worker: {
    format: 'es'
  }
}) 