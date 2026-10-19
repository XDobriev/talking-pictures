import { useRef, type CSSProperties, type PointerEvent } from 'react';
import { SceneBackground, Sprite, cropStyle, isBaked } from '../art';
import type { Mood } from '../art';
import { pickObject } from '../game/input';
import type { SceneDef, SceneObject } from '../game/types';
import { useStage } from './Stage';

export interface Reaction {
  n: number;
  type: NonNullable<SceneObject['reaction']>;
}

interface Props {
  scene: SceneDef;
  /** Найденные цели. В векторной сцене они улетают (скрываются), в нарисованной — остаются с отметкой. */
  found: Set<string>;
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

const box = (r: SceneObject['rect']): CSSProperties => ({
  left: `${r.x - r.w / 2}%`,
  top: `${r.y - r.h / 2}%`,
  width: `${r.w}%`,
  height: `${r.h}%`,
});

export function SceneView({ scene, found, pulse, prefer, moods, reactions, disabled, onObject, onEmpty }: Props) {
  const { scale, toStage } = useStage();
  const lastTap = useRef(0);
  const baked = isBaked(scene);

  const handle = (e: PointerEvent) => {
    // Только первичное касание: ладони и пальцы на краях экрана не считаются.
    if (!e.isPrimary || disabled) return;
    // Двойное срабатывание одного касания (pointer + mouse эмуляция) — отсекаем.
    if (e.timeStamp - lastTap.current < 60) return;
    lastTap.current = e.timeStamp;
    const { x, y } = toStage(e.clientX, e.clientY);
    const visible = baked ? scene.objects : scene.objects.filter((o) => !found.has(o.id));
    const obj = pickObject(visible, x, y, scale, prefer);
    if (obj) onObject(obj, x, y);
    else onEmpty(x, y);
  };

  const sorted = [...scene.objects].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  return (
    <div className="absolute inset-0" onPointerDown={handle} data-testid="scene">
      <SceneBackground id={scene.background} />

      {sorted.map((o, i) => {
        const r = reactions[o.id];
        const z = (o.z ?? 0) + 1;

        if (baked) {
          // Картинка уже на фоне: поверх рисуем только «ожившую» копию на время реакции,
          // мягкое кольцо подсказки и отметку найденного.
          return (
            <div key={o.id} data-obj={o.id} className="pointer-events-none absolute" style={{ ...box(o.rect), zIndex: z }}>
              {pulse.has(o.id) && <div className="hint-ring absolute -inset-[18%] rounded-full" />}
              {r && (
                <div key={r.n} className={`absolute inset-0 react-${r.type}`}>
                  <div className="h-full w-full" style={cropStyle(scene.background, o.rect)} />
                </div>
              )}
              {found.has(o.id) && (
                <svg viewBox="0 0 40 40" className="found-badge absolute -right-[10%] -top-[10%] h-[34%] max-h-[56px] min-h-[34px] w-auto">
                  <circle cx={20} cy={20} r={18} fill="#6f8f4e" stroke="var(--color-cream)" strokeWidth={3} />
                  <path d="M11 21 L18 27 L29 14" stroke="var(--color-cream)" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          );
        }

        if (found.has(o.id)) return null;
        return (
          <div key={o.id} data-obj={o.id} className="pointer-events-none absolute" style={{ ...box(o.rect), zIndex: z }}>
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
