export interface SaveData {
  version: 1;
  /** id пройденных уровней */
  completed: string[];
  /** id полученных наклеек */
  stickers: string[];
  /** Расклейка наклеек в альбоме: id → позиция в % */
  album: Record<string, { x: number; y: number }>;
  settings: {
    music: boolean;
    sfx: boolean;
    voice: boolean;
    echoPause: boolean;
  };
  tutorialDone: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  completed: [],
  stickers: [],
  album: {},
  settings: { music: true, sfx: true, voice: true, echoPause: true },
  tutorialDone: false,
};

/** Всё, что игра знает о площадке. Реализации: Yandex, Mock (localhost), позже RuStore/Capacitor. */
export interface Platform {
  readonly name: 'yandex' | 'mock';
  init(): Promise<void>;
  /** Язык интерфейса площадки (ru, en, tr…). Пока игра только на русском, но язык обязан идти из SDK. */
  lang(): string;
  /** Игра готова к взаимодействию (LoadingAPI.ready). */
  gameReady(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  /** Межуровневая реклама. Никогда не бросает исключений и не зависает дольше таймаута. */
  showInterstitial(): Promise<void>;
  /** Реклама за награду. true — награду выдавать. */
  showRewarded(): Promise<boolean>;
  save(data: SaveData): Promise<void>;
  load(): Promise<SaveData | null>;
  /** Системная пауза/возврат (вкладка, звонок, оверлей площадки). */
  onPause(cb: () => void): void;
  onResume(cb: () => void): void;
  /** Подписка на «идёт реклама» — чтобы приглушить звук и заблокировать ввод. */
  onAdState(cb: (showing: boolean) => void): void;
}
