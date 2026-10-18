import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' обязателен: Яндекс Игры раздают сборку из iframe на CDN по относительным путям.
/** В обычном `vite dev` /sdk.js отсутствует: отдаём 404, чтобы игра сразу включила мок (а не ловила index.html как скрипт). */
const sdk404 = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
  if (req.url?.split('?')[0] === '/sdk.js') {
    res.statusCode = 404;
    res.end();
    return;
  }
  next();
};
const sdkStub: Plugin = {
  name: 'yandex-sdk-404',
  configureServer(server) {
    server.middlewares.use(sdk404);
  },
  configurePreviewServer(server) {
    server.middlewares.use(sdk404);
  },
};

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), sdkStub],
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
