// vite.config.js
import { defineConfig } from "file:///D:/shogun-2/shogun-auth-app/node_modules/vite/dist/node/index.js";
import react from "file:///D:/shogun-2/shogun-auth-app/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import tailwindcss from "file:///D:/shogun-2/shogun-auth-app/node_modules/@tailwindcss/vite/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\shogun-2\\shogun-auth-app";
var vite_config_default = defineConfig({
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
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."]
    },
    // Handle client-side routing
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        { from: /^\/auth\/callback/, to: "/index.html" },
        { from: /./, to: "/index.html" }
      ]
    }
  },
  // Preview server (for built files)
  preview: {
    port: 8080,
    host: true,
    open: true,
    strictPort: true
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
        main: "index.html"
      },
      output: {
        manualChunks: {
          vendor: ["gun"],
          shogun: ["shogun-core"]
        }
      }
    }
  },
  // Plugins
  plugins: [react(), tailwindcss()],
  // Resolve configuration
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "shogun-core": path.resolve(__vite_injected_original_dirname, "../shogun-core/src")
    }
  },
  // Optimizations
  optimizeDeps: {
    include: ["gun", "uuid"],
    exclude: ["shogun-core"]
  },
  // Define global constants
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
    global: "globalThis"
  },
  // Prevent conflicts with wallet extensions
  esbuild: {
    define: {
      global: "globalThis"
    }
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
  assetsInclude: ["**/*.md", "**/*.txt"],
  // Worker configuration
  worker: {
    format: "es"
  },
  // Public directory configuration
  publicDir: "public"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxzaG9ndW4tMlxcXFxzaG9ndW4tYXV0aC1hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHNob2d1bi0yXFxcXHNob2d1bi1hdXRoLWFwcFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovc2hvZ3VuLTIvc2hvZ3VuLWF1dGgtYXBwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAvLyBCYXNlIGNvbmZpZ3VyYXRpb25cclxuICByb290OiBcIi5cIixcclxuICBiYXNlOiBcIi9cIixcclxuXHJcbiAgLy8gRGV2ZWxvcG1lbnQgc2VydmVyXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG9zdDogdHJ1ZSxcclxuICAgIG9wZW46IHRydWUsXHJcbiAgICBjb3JzOiB0cnVlLFxyXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgXCJDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeVwiOiBcInNhbWUtb3JpZ2luLWFsbG93LXBvcHVwc1wiLFxyXG4gICAgfSxcclxuICAgIGZzOiB7XHJcbiAgICAgIC8vIEFsbG93IHNlcnZpbmcgZmlsZXMgZnJvbSBvbmUgbGV2ZWwgdXAgdG8gdGhlIHByb2plY3Qgcm9vdFxyXG4gICAgICBhbGxvdzogW1wiLi5cIl0sXHJcbiAgICB9LFxyXG4gICAgLy8gSGFuZGxlIGNsaWVudC1zaWRlIHJvdXRpbmdcclxuICAgIGhpc3RvcnlBcGlGYWxsYmFjazoge1xyXG4gICAgICBkaXNhYmxlRG90UnVsZTogdHJ1ZSxcclxuICAgICAgcmV3cml0ZXM6IFtcclxuICAgICAgICB7IGZyb206IC9eXFwvYXV0aFxcL2NhbGxiYWNrLywgdG86ICcvaW5kZXguaHRtbCcgfSxcclxuICAgICAgICB7IGZyb206IC8uLywgdG86ICcvaW5kZXguaHRtbCcgfVxyXG4gICAgICBdXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLy8gUHJldmlldyBzZXJ2ZXIgKGZvciBidWlsdCBmaWxlcylcclxuICBwcmV2aWV3OiB7XHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG9zdDogdHJ1ZSxcclxuICAgIG9wZW46IHRydWUsXHJcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxyXG4gIH0sXHJcblxyXG4gIC8vIEJ1aWxkIGNvbmZpZ3VyYXRpb25cclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiBcImRpc3RcIixcclxuICAgIGFzc2V0c0RpcjogXCJhc3NldHNcIixcclxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcclxuICAgIG1pbmlmeTogXCJ0ZXJzZXJcIixcclxuICAgIHRhcmdldDogXCJlczIwMjBcIixcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgaW5wdXQ6IHtcclxuICAgICAgICBtYWluOiBcImluZGV4Lmh0bWxcIixcclxuICAgICAgfSxcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICB2ZW5kb3I6IFtcImd1blwiXSxcclxuICAgICAgICAgIHNob2d1bjogW1wic2hvZ3VuLWNvcmVcIl0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgLy8gUGx1Z2luc1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcclxuXHJcbiAgLy8gUmVzb2x2ZSBjb25maWd1cmF0aW9uXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIFwic2hvZ3VuLWNvcmVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9zaG9ndW4tY29yZS9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIE9wdGltaXphdGlvbnNcclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGluY2x1ZGU6IFtcImd1blwiLCBcInV1aWRcIl0sXHJcbiAgICBleGNsdWRlOiBbXCJzaG9ndW4tY29yZVwiXSxcclxuICB9LFxyXG5cclxuICAvLyBEZWZpbmUgZ2xvYmFsIGNvbnN0YW50c1xyXG4gIGRlZmluZToge1xyXG4gICAgX19ERVZfXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiksXHJcbiAgICBfX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXHJcbiAgICBnbG9iYWw6IFwiZ2xvYmFsVGhpc1wiLFxyXG4gIH0sXHJcblxyXG4gIC8vIFByZXZlbnQgY29uZmxpY3RzIHdpdGggd2FsbGV0IGV4dGVuc2lvbnNcclxuICBlc2J1aWxkOiB7XHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgZ2xvYmFsOiBcImdsb2JhbFRoaXNcIixcclxuICAgIH0sXHJcbiAgfSxcclxuXHJcbiAgLy8gQ1NTIGNvbmZpZ3VyYXRpb25cclxuICBjc3M6IHtcclxuICAgIGRldlNvdXJjZW1hcDogdHJ1ZSxcclxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgY3NzOiB7XHJcbiAgICAgICAgY2hhcnNldDogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcblxyXG4gIC8vIEFzc2V0IGhhbmRsaW5nXHJcbiAgYXNzZXRzSW5jbHVkZTogW1wiKiovKi5tZFwiLCBcIioqLyoudHh0XCJdLFxyXG5cclxuICAvLyBXb3JrZXIgY29uZmlndXJhdGlvblxyXG4gIHdvcmtlcjoge1xyXG4gICAgZm9ybWF0OiBcImVzXCIsXHJcbiAgfSxcclxuXHJcbiAgLy8gUHVibGljIGRpcmVjdG9yeSBjb25maWd1cmF0aW9uXHJcbiAgcHVibGljRGlyOiBcInB1YmxpY1wiLFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5USxTQUFTLG9CQUFvQjtBQUN0UyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8saUJBQWlCO0FBSHhCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBO0FBQUEsRUFFMUIsTUFBTTtBQUFBLEVBQ04sTUFBTTtBQUFBO0FBQUEsRUFHTixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUCw4QkFBOEI7QUFBQSxJQUNoQztBQUFBLElBQ0EsSUFBSTtBQUFBO0FBQUEsTUFFRixPQUFPLENBQUMsSUFBSTtBQUFBLElBQ2Q7QUFBQTtBQUFBLElBRUEsb0JBQW9CO0FBQUEsTUFDbEIsZ0JBQWdCO0FBQUEsTUFDaEIsVUFBVTtBQUFBLFFBQ1IsRUFBRSxNQUFNLHFCQUFxQixJQUFJLGNBQWM7QUFBQSxRQUMvQyxFQUFFLE1BQU0sS0FBSyxJQUFJLGNBQWM7QUFBQSxNQUNqQztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxFQUNkO0FBQUE7QUFBQSxFQUdBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU07QUFBQSxNQUNSO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsS0FBSztBQUFBLFVBQ2QsUUFBUSxDQUFDLGFBQWE7QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBO0FBQUEsRUFHaEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3BDLGVBQWUsS0FBSyxRQUFRLGtDQUFXLG9CQUFvQjtBQUFBLElBQzdEO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsT0FBTyxNQUFNO0FBQUEsSUFDdkIsU0FBUyxDQUFDLGFBQWE7QUFBQSxFQUN6QjtBQUFBO0FBQUEsRUFHQSxRQUFRO0FBQUEsSUFDTixTQUFTLEtBQUssVUFBVSxRQUFRLElBQUksYUFBYSxhQUFhO0FBQUEsSUFDOUQsYUFBYSxLQUFLLFVBQVUsUUFBUSxJQUFJLG1CQUFtQjtBQUFBLElBQzNELFFBQVE7QUFBQSxFQUNWO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNQLFFBQVE7QUFBQSxNQUNOLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxLQUFLO0FBQUEsSUFDSCxjQUFjO0FBQUEsSUFDZCxxQkFBcUI7QUFBQSxNQUNuQixLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUdBLGVBQWUsQ0FBQyxXQUFXLFVBQVU7QUFBQTtBQUFBLEVBR3JDLFFBQVE7QUFBQSxJQUNOLFFBQVE7QUFBQSxFQUNWO0FBQUE7QUFBQSxFQUdBLFdBQVc7QUFDYixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
