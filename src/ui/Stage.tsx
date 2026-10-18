import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

interface StageCtx {
  scale: number;
  /** Экранные координаты → проценты холста (0–100). */
  toStage(clientX: number, clientY: number): { x: number; y: number };
}

const Ctx = createContext<StageCtx>({ scale: 1, toStage: () => ({ x: 0, y: 0 }) });
export const useStage = () => useContext(Ctx);

/**
 * Виртуальный холст 1920×1080, вписанный в окно с полями (letterboxing).
 * Всё интерактивное живёт внутри холста; поля заполняет фон.
 */
export function Stage({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const fit = () => {
      // safe-area: не залезаем под вырезы и полоску Home
      const w = window.innerWidth;
      const h = window.innerHeight;
      setScale(Math.min(w / STAGE_W, h / STAGE_H));
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, []);

  const toStage = (cx: number, cy: number) => {
    const r = box.current!.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  };

  return (
    <Ctx.Provider value={{ scale, toStage }}>
      <div className="paper-dark fixed inset-0 flex items-center justify-center overflow-hidden">
        <div
          ref={box}
          className="relative shrink-0 overflow-hidden"
          style={{ width: STAGE_W * scale, height: STAGE_H * scale }}
          // Возврат фокуса в iframe — требование тестирования десктопа на Яндексе.
          onPointerDown={() => window.focus()}
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
          >
            {children}
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
