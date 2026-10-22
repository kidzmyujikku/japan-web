import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api/ai': { target: 'http://127.0.0.1:8787', changeOrigin: true, configure(proxy) {
    proxy.on('proxyReq',(outgoing,incoming)=>{outgoing.setHeader('X-Nichi-Client-Address',incoming.socket.remoteAddress??'unknown');});
  } } } },
  build: {
    reportCompressedSize: false,
    rollupOptions: { output: { manualChunks(id) {
      if (id.includes('node_modules/@firebase/firestore') || id.includes('node_modules/firebase/firestore')) return 'firebase-firestore';
      if (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase/')) return 'firebase-core';
      if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap')) return 'motion';
      if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) return 'react-vendor';
    } } },
  },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
});
