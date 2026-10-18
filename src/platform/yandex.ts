import { Emitter, lsLoad, lsSave, normalizeSave, withTimeout } from './base';
import type { Platform, SaveData } from './types';

// Минимальные типы SDK Яндекс Игр — только то, что используем.
interface AdvCallbacks {
  onOpen?: () => void;
  onClose?: (wasShown?: boolean) => void;
  onError?: (e: unknown) => void;
  onOffline?: () => void;
  onRewarded?: () => void;
}
interface YPlayer {
  getData(keys?: string[]): Promise<Record<string, unknown>>;
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
}
interface YSDK {
  features: {
    LoadingAPI?: { ready(): void };
    GameplayAPI?: { start(): void; stop(): void };
  };
  adv: {
    showFullscreenAdv(o: { callbacks: AdvCallbacks }): void;
    showRewardedVideo(o: { callbacks: AdvCallbacks }): void;
  };
  getPlayer(o?: { scopes?: boolean }): Promise<YPlayer>;
  environment?: { i18n?: { lang?: string } };
  on(event: 'game_api_pause' | 'game_api_resume', cb: () => void): void;
}
declare global {
  interface Window {
    YaGames?: { init(): Promise<YSDK> };
  }
}

/** Сколько ждём открытия рекламы, прежде чем считать её несостоявшейся (AdBlock, no fill, зависание SDK). */
const AD_OPEN_TIMEOUT = 4000;
/** Предельная длительность показа — страховка от «вечной» рекламы. */
const AD_MAX_DURATION = 60000;
/** Не чаще одного облачного сохранения в 5 секунд (≈60 за 5 минут при лимите 100). */
const CLOUD_INTERVAL = 5000;

export class YandexPlatform implements Platform {
  readonly name = 'yandex' as const;
  private ysdk: YSDK | null = null;
  private player: YPlayer | null = null;
  private pause = new Emitter<[]>();
  private resume = new Emitter<[]>();
  private ad = new Emitter<[boolean]>();
  private gameplayOn = false;

  async init() {
    this.ysdk = (await withTimeout(window.YaGames!.init(), 8000, null)) as YSDK | null;
    if (!this.ysdk) return;
    this.ysdk.on('game_api_pause', () => this.pause.emit());
    this.ysdk.on('game_api_resume', () => this.resume.emit());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause.emit();
        void this.flushCloud(); // уходя со вкладки — сохраняем сразу
      } else this.resume.emit();
    });
    this.player = await withTimeout(this.ysdk.getPlayer({ scopes: false }), 5000, null);
  }

  /** Язык берём из SDK — модерация отклоняет игры, определяющие язык иначе. */
  lang() {
    return this.ysdk?.environment?.i18n?.lang ?? 'ru';
  }
  gameReady() {
    this.ysdk?.features.LoadingAPI?.ready();
  }
  gameplayStart() {
    if (this.gameplayOn) return;
    this.gameplayOn = true;
    this.ysdk?.features.GameplayAPI?.start();
  }
  gameplayStop() {
    if (!this.gameplayOn) return;
    this.gameplayOn = false;
    this.ysdk?.features.GameplayAPI?.stop();
  }

  /** Общая обёртка показа: гарантирует, что промис разрешится, а звук и ввод вернутся. */
  private runAd(kind: 'interstitial' | 'rewarded'): Promise<boolean> {
    const sdk = this.ysdk;
    if (!sdk) return Promise.resolve(kind === 'rewarded');
    return new Promise<boolean>((resolve) => {
      let opened = false;
      let rewarded = false;
      let done = false;
      const finish = (result: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(openTimer);
        clearTimeout(maxTimer);
        if (opened) this.ad.emit(false);
        resolve(result);
      };
      // Не открылась за 4 с — разблокируем игру; за награду в этом случае награду выдаём (без вины ребёнка).
      const openTimer = setTimeout(() => !opened && finish(kind === 'rewarded'), AD_OPEN_TIMEOUT);
      const maxTimer = setTimeout(() => finish(rewarded || kind === 'rewarded'), AD_MAX_DURATION);
      const callbacks: AdvCallbacks = {
        onOpen: () => {
          opened = true;
          this.ad.emit(true);
        },
        onRewarded: () => {
          rewarded = true;
        },
        onClose: () => finish(kind === 'rewarded' ? rewarded : true),
        onError: () => finish(kind === 'rewarded'),
        onOffline: () => finish(kind === 'rewarded'),
      };
      try {
        if (kind === 'interstitial') sdk.adv.showFullscreenAdv({ callbacks });
        else sdk.adv.showRewardedVideo({ callbacks });
      } catch {
        finish(kind === 'rewarded');
      }
    });
  }

  async showInterstitial() {
    await this.runAd('interstitial');
  }
  showRewarded() {
    return this.runAd('rewarded');
  }

  // Лимит SDK: player.setData — 100 запросов за 5 минут. Локально пишем сразу (п. 1.9),
  // в облако — не чаще раза в CLOUD_INTERVAL, последнее состояние обязательно уходит.
  private cloudPending: SaveData | null = null;
  private cloudTimer: number | null = null;
  private lastCloud = 0;

  async save(data: SaveData) {
    lsSave(data);
    this.cloudPending = data;
    if (this.cloudTimer) return;
    const wait = Math.max(0, this.lastCloud + CLOUD_INTERVAL - Date.now());
    this.cloudTimer = window.setTimeout(() => void this.flushCloud(), wait);
  }
  private async flushCloud() {
    this.cloudTimer = null;
    const data = this.cloudPending;
    if (!data || !this.player) return;
    this.cloudPending = null;
    this.lastCloud = Date.now();
    try {
      await this.player.setData({ save: data as unknown as Record<string, unknown> }, false);
    } catch {
      /* облако недоступно — остаётся локальная копия */
    }
  }
  async load() {
    try {
      const d = await withTimeout(this.player?.getData(['save']) ?? Promise.resolve({}), 4000, {});
      const cloud = normalizeSave((d as Record<string, unknown>).save);
      if (cloud) return cloud;
    } catch {
      /* падаем на локальную копию */
    }
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
