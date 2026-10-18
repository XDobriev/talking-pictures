import { Emitter, lsLoad, lsSave } from './base';
import type { Platform, SaveData } from './types';

/** Заглушка площадки для localhost: имитирует рекламу и сохраняет в localStorage. */
export class MockPlatform implements Platform {
  readonly name = 'mock' as const;
  private pause = new Emitter<[]>();
  private resume = new Emitter<[]>();
  private ad = new Emitter<[boolean]>();
  private log(...a: unknown[]) {
    if (import.meta.env.DEV) console.debug('[mock-sdk]', ...a);
  }

  async init() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause.emit();
      else this.resume.emit();
    });
  }
  lang() {
    return new URLSearchParams(location.search).get('lang') ?? 'ru';
  }
  gameReady() {
    this.log('LoadingAPI.ready');
  }
  gameplayStart() {
    this.log('GameplayAPI.start');
  }
  gameplayStop() {
    this.log('GameplayAPI.stop');
  }
  private fakeAd(ms: number) {
    this.ad.emit(true);
    return new Promise<void>((r) =>
      setTimeout(() => {
        this.ad.emit(false);
        r();
      }, ms),
    );
  }
  async showInterstitial() {
    // ?noads в адресе — выключить имитацию рекламы при ручных тестах
    if (new URLSearchParams(location.search).has('noads')) return;
    this.log('interstitial');
    await this.fakeAd(1200);
  }
  async showRewarded() {
    this.log('rewarded');
    await this.fakeAd(1500);
    return true;
  }
  async save(data: SaveData) {
    lsSave(data);
  }
  async load() {
    return lsLoad();
  }
  onPause(cb: () => void) {
    this.pause.on(cb);
  }
  onResume(cb: () => void) {
    this.resume.on(cb);
  }
  onAdState(cb: (showing: boolean) => void) {
    this.ad.on(cb);
  }
}
