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

/**
 * Предзагрузка того, что нужно первому экрану: фон леса (LCP) и кириллические шрифты.
 * Без неё браузер узнаёт о картинке только после загрузки и запуска всего скрипта:
 * на бюджетном телефоне с 3G это +2,6 с до появления экрана.
 */
const preloadFirstScreen: Plugin = {
  name: 'preload-first-screen',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(_html, ctx) {
      const assets = Object.values(ctx.bundle ?? {}).filter((f) => f.type === 'asset');
      const find = (re: RegExp) =>
        assets.filter((a) => re.test(a.fileName) || (a.type === 'asset' && a.originalFileNames?.some((n) => re.test(n))));
      const bg = find(/scenes\/forest\/bg\.webp$/);
      const fonts = find(/(pangolin|nunito)-cyrillic-(?!ext).*\.woff2$/);
      return [
        ...bg.map((a) => ({ tag: 'link', attrs: { rel: 'preload', as: 'image', href: `./${a.fileName}`, fetchpriority: 'high' }, injectTo: 'head' as const })),
        ...fonts.map((a) => ({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `./${a.fileName}`, crossorigin: '' }, injectTo: 'head' as const })),
      ];
    },
  },
};

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), sdkStub, preloadFirstScreen],
  build: {
    // Vite здесь почему-то не очищает dist (даже с emptyOutDir) — старые сборки копились в архиве для Яндекса.
    // Поэтому dist удаляет `npm run clean` перед каждой сборкой.
    target: 'es2020',
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
