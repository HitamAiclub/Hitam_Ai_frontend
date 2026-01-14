import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build proxy config - for local development only
const apiPort = process.env.VITE_API_PORT || 5000;
const proxyConfig = {
  '/api': {
    target: `http://localhost:${apiPort}`,
    changeOrigin: true,
    secure: false,
    configure: (proxy, options) => {
      proxy.on('error', (err, req, res) => {
        console.error('proxy error', err);
        try {
          if (res && !res.headersSent) {
            res.writeHead && res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end && res.end(JSON.stringify({ error: 'Proxy target unreachable. Is the server running on port ' + apiPort + '?' }));
          }
        } catch (e) {
          // swallow to avoid crashing the dev server
        }
      });
      proxy.on('proxyReq', (proxyReq, req, res) => {
        console.log('Sending Request to the Target:', req.method, req.url);
      });
      proxy.on('proxyRes', (proxyRes, req, res) => {
        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
      });
    },
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Allow Vite to find an available port
    proxy: proxyConfig,
  },
})
