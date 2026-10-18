import { useEffect, useState } from 'react';
import { hitRect } from '../game/input';
import type { SceneDef } from '../game/types';
import { useStage } from './Stage';

/**
 * Инспектор разметки (только localhost, Shift+D):
 * рамки объектов и их расширенных хитбоксов, безопасная зона, клик → координаты в буфер обмена.
 */
export function DevInspector({ scene }: { scene: SceneDef | null }) {
  const [on, setOn] = useState(false);
  const [last, setLast] = useState<string>('');
  const { scale, toStage } = useStage();

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'KeyD') setOn((v) => !v);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  if (!on) return null;
  return (
    <div
      className="absolute inset-0 z-[200] cursor-crosshair"
      onPointerDown={(e) => {
        const p = toStage(e.clientX, e.clientY);
        const s = `{ "x": ${p.x.toFixed(1)}, "y": ${p.y.toFixed(1)} }`;
        setLast(s);
        void navigator.clipboard?.writeText(s).catch(() => {});
      }}
    >
      {/* безопасная зона: 5% сверху и по бокам, 8% снизу */}
      <div className="pointer-events-none absolute border-4 border-dashed border-cyan-300/80" style={{ left: '5%', right: '5%', top: '5%', bottom: '8%' }} />
      {scene?.objects.map((o) => {
        const h = hitRect(o.rect, scale);
        return (
          <div key={o.id}>
            <div
              className="pointer-events-none absolute border-2 border-dashed border-yellow-300/70"
              style={{ left: `${h.x - h.w / 2}%`, top: `${h.y - h.h / 2}%`, width: `${h.w}%`, height: `${h.h}%` }}
            />
            <div
              className={`pointer-events-none absolute border-[3px] ${o.findable ? 'border-fuchsia-500' : 'border-sky-400'}`}
              style={{ left: `${o.rect.x - o.rect.w / 2}%`, top: `${o.rect.y - o.rect.h / 2}%`, width: `${o.rect.w}%`, height: `${o.rect.h}%` }}
            >
              <span className="absolute left-0 top-0 bg-black/70 px-2 text-[20px] text-white">{o.id}</span>
            </div>
          </div>
        );
      })}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-black/75 px-6 py-3 font-mono text-[26px] text-white">
        Shift+D — выключить · клик копирует координаты {last && `· ${last}`}
      </div>
    </div>
  );
}
