import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        ws: true,
        headers: {
          'Origin': 'http://localhost:8081',
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            //console.log('[Proxy Error]', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            //console.log('[Proxy Request]', req.method, req.url);
            // Set origin to backend URL to avoid CORS issues
            proxyReq.setHeader('origin', 'http://localhost:8081');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            //console.log('[Proxy Response]', proxyRes.statusCode, req.url);
          });
        },
      },
      "/ws": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
