import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { setSfxEnabled } from '../audio/sfx';
import { setVoiceEnabled } from '../audio/voice';
import { setMusicEnabled } from '../audio/music';
import { DEFAULT_SAVE, type Platform, type SaveData } from '../platform';

interface Store {
  platform: Platform;
  save: SaveData;
  update(fn: (s: SaveData) => SaveData): void;
}

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider отсутствует');
  return s;
}

export function StoreProvider({ platform, initial, children }: { platform: Platform; initial: SaveData | null; children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(initial ?? DEFAULT_SAVE);
  const pending = useRef<number | null>(null);

  useEffect(() => {
    setSfxEnabled(save.settings.sfx);
    setVoiceEnabled(save.settings.voice);
    setMusicEnabled(save.settings.music);
  }, [save.settings]);

  const update = useCallback(
    (fn: (s: SaveData) => SaveData) => {
      setSave((prev) => {
        const next = fn(prev);
        // Сохраняем с небольшой задержкой, чтобы не дёргать облако на каждое касание.
        if (pending.current) clearTimeout(pending.current);
        pending.current = window.setTimeout(() => void platform.save(next), 400);
        return next;
      });
    },
    [platform],
  );

  return <Ctx.Provider value={{ platform, save, update }}>{children}</Ctx.Provider>;
}

export function markLevelDone(levelId: string, stickerId: string) {
  return (s: SaveData): SaveData => ({
    ...s,
    completed: s.completed.includes(levelId) ? s.completed : [...s.completed, levelId],
    stickers: s.stickers.includes(stickerId) ? s.stickers : [...s.stickers, stickerId],
  });
}
