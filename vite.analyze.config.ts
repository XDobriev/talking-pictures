// Временная конфигурация для анализа размера: каждый пакет — в свой файл.
import base from './vite.config';

export default {
  ...base,
  build: {
    ...base.build,
    outDir: 'dist-analyze',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const m = id.match(/node_modules[\\/]((@[^\\/]+[\\/])?[^\\/]+)/);
          if (m) return `pkg-${m[1].replace(/[@\\/]/g, '_')}`;
          if (/[\\/]src[\\/]data[\\/]/.test(id)) return 'app-data';
          return undefined;
        },
      },
    },
  },
};
