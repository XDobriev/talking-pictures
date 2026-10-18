import { MockPlatform } from './mock';
import type { Platform } from './types';
import { YandexPlatform } from './yandex';

export type { Platform, SaveData } from './types';
export { DEFAULT_SAVE } from './types';

/**
 * Ждёт скрипт /sdk.js (подключён в index.html с async).
 * На Яндекс Играх и под @yandex-games/sdk-dev-proxy он есть; в обычном `vite dev` — 404, тогда сразу мок.
 */
function waitForYaGames(ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.YaGames) return resolve(true);
    const script = document.querySelector<HTMLScriptElement>('script[src$="sdk.js"]');
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      resolve(v);
    };
    script?.addEventListener('load', () => finish(!!window.YaGames));
    script?.addEventListener('error', () => finish(false));
    const started = performance.now();
    const tick = () => {
      if (done) return;
      if (window.YaGames) return finish(true);
      if ((window as { __ysdkFailed?: boolean }).__ysdkFailed) return finish(false);
      if (performance.now() - started > ms) return finish(false);
      setTimeout(tick, 50);
    };
    tick();
  });
}

let instance: Platform | null = null;

export async function createPlatform(): Promise<Platform> {
  if (instance) return instance;
  const forceMock = new URLSearchParams(location.search).has('mock');
  const hasSdk = !forceMock && (await waitForYaGames(5000));
  instance = hasSdk ? new YandexPlatform() : new MockPlatform();
  try {
    await instance.init();
  } catch {
    instance = new MockPlatform();
    await instance.init();
  }
  return instance;
}
