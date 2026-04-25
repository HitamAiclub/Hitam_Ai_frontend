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
        } catch (e) {}
      });
    },
  },
  // Proxy HuggingFace API to bypass CORS
  '/hf-api': {
    target: 'https://api-inference.huggingface.co',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/hf-api/, ''),
    secure: true,
  },
  // Proxy OpenRouter API to bypass CORS
  '/or-api': {
    target: 'https://openrouter.ai',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/or-api/, ''),
    secure: true,
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: proxyConfig,
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'react-is']
  }
})
