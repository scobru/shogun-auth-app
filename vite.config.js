import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Base configuration
  root: ".",
  base: "/",

  // Development server
  server: {
    port: 8080,
    host: true,
    open: true,
    cors: true,
    strictPort: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },

  // Preview server (for built files)
  preview: {
    port: 8080,
    host: true,
    open: true,
    strictPort: true,
  },

  // Build configuration
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    minify: "terser",
    target: "es2020",
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks: {
          vendor: ["gun"],
          shogun: ["shogun-core"],
        },
      },
    },
  },

  // Plugins
  plugins: [react()],

  // Resolve configuration
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "shogun-core": path.resolve(__dirname, "../shogun-core/src"),
    },
  },

  // Optimizations
  optimizeDeps: {
    include: ["gun", "uuid"],
    exclude: ["shogun-core"],
  },

  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
    global: "globalThis",
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },

  // Asset handling
  assetsInclude: ["**/*.md", "**/*.txt"],

  // Worker configuration
  worker: {
    format: "es",
  },

  // Public directory configuration
  publicDir: "public",
});
