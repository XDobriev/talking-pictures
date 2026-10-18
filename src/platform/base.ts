import type { SaveData } from './types';
import { DEFAULT_SAVE } from './types';

type Listener<T extends unknown[]> = (...args: T) => void;

export class Emitter<T extends unknown[]> {
  private list: Listener<T>[] = [];
  on(cb: Listener<T>) {
    this.list.push(cb);
  }
  emit(...args: T) {
    for (const cb of this.list) cb(...args);
  }
}

/** Ждёт промис не дольше ms; по таймауту возвращает fallback. */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(fallback);
      },
    );
  });
}

/** Достраивает сохранение до текущей схемы (новые поля — по умолчанию). */
export function normalizeSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SaveData>;
  return {
    ...DEFAULT_SAVE,
    ...r,
    completed: Array.isArray(r.completed) ? r.completed : [],
    stickers: Array.isArray(r.stickers) ? r.stickers : [],
    album: r.album && typeof r.album === 'object' ? r.album : {},
    settings: { ...DEFAULT_SAVE.settings, ...(r.settings ?? {}) },
    version: 1,
  };
}

const LS_KEY = 'talking-pictures-save';

export function lsLoad(): SaveData | null {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? normalizeSave(JSON.parse(s)) : null;
  } catch {
    return null;
  }
}

export function lsSave(data: SaveData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* приватный режим или переполнение — игра продолжает работать без сохранения */
  }
}
