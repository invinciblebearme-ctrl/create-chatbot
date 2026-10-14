import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/chatbot/',
  resolve: {
    alias: {
      '@create-chatbot/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/chatbot/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res: any) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({
                error: '백엔드 API 서버(포트 8787)에 연결할 수 없습니다. npm run dev:api를 실행해 주세요.'
              }));
            }
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
