import { useRef, type CSSProperties, type PointerEvent } from 'react';
import { SceneBackground, Sprite } from '../art';
import type { Mood } from '../art/forest';
import { pickObject } from '../game/input';
import type { SceneDef, SceneObject } from '../game/types';
import { useStage } from './Stage';

export interface Reaction {
  n: number;
  type: NonNullable<SceneObject['reaction']>;
}

interface Props {
  scene: SceneDef;
  /** Объекты, улетевшие в панель (на сцене не рисуются). */
  hidden: Set<string>;
  /** Цели, которые сейчас подсвечиваются подсказкой. */
  pulse: Set<string>;
  /** Цели текущего задания — приоритет при спорном касании. */
  prefer: Set<string>;
  moods: Record<string, Mood>;
  reactions: Record<string, Reaction>;
  disabled?: boolean;
  onObject(obj: SceneObject, x: number, y: number): void;
  onEmpty(x: number, y: number): void;
}

export function SceneView({ scene, hidden, pulse, prefer, moods, reactions, disabled, onObject, onEmpty }: Props) {
  const { scale, toStage } = useStage();
  const lastTap = useRef(0);

  const handle = (e: PointerEvent) => {
    // Только первичное касание: ладони и пальцы на краях экрана не считаются.
    if (!e.isPrimary || disabled) return;
    // Двойное срабатывание одного касания (pointer + mouse эмуляция) — отсекаем.
    if (e.timeStamp - lastTap.current < 60) return;
    lastTap.current = e.timeStamp;
    const { x, y } = toStage(e.clientX, e.clientY);
    const visible = scene.objects.filter((o) => !hidden.has(o.id));
    const obj = pickObject(visible, x, y, scale, prefer);
    if (obj) onObject(obj, x, y);
    else onEmpty(x, y);
  };

  const sorted = [...scene.objects].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  return (
    <div className="absolute inset-0" onPointerDown={handle} data-testid="scene">
      <SceneBackground id={scene.background} />
      {sorted.map((o, i) => {
        if (hidden.has(o.id)) return null;
        const { x, y, w, h } = o.rect;
        const r = reactions[o.id];
        return (
          <div
            key={o.id}
            data-obj={o.id}
            className="pointer-events-none absolute"
            style={{ left: `${x - w / 2}%`, top: `${y - h / 2}%`, width: `${w}%`, height: `${h}%`, zIndex: (o.z ?? 0) + 1 }}
          >
            <div
              className={`h-full w-full ${o.findable ? 'breathe' : ''} ${pulse.has(o.id) ? 'hint-pulse' : ''}`}
              style={{ '--breathe-delay': `${-(i * 0.7) % 4}s`, '--breathe-dur': `${4 + (i % 3)}s` } as CSSProperties}
            >
              <div key={r?.n ?? 0} className={`h-full w-full ${r ? `react-${r.type}` : ''}`}>
                <div className="h-full w-full" style={{ transform: o.flip ? 'scaleX(-1)' : undefined }}>
                  <Sprite id={o.sprite} mood={moods[o.id]} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
