import { motion, type TargetAndTransition } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ObjectArt } from '../art';
import { playSfx, say } from '../audio';
import type { SceneDef, SceneObject } from '../game/types';

// Сценка-награда: найденные герои выбегают по одному со своим голосом и танцуют — каждый по-своему.
// Одинаковые конфетти на каждом уровне быстро приедаются; смешная сценка — то, ради чего дети пересматривают
// (так в Endless Alphabet монстры разыгрывают слово). Герой «говорит» своё имя, если его потрогать.

/** Танцы по кругу: прыжок, покачивание, пружинка, скок-скок. */
const MOVES: TargetAndTransition[] = [
  { y: [0, -60, 0], transition: { duration: 0.7, repeatDelay: 0.5 } },
  { rotate: [-10, 10, -10], transition: { duration: 1.2 } },
  { scaleY: [1, 0.86, 1.1, 1], scaleX: [1, 1.1, 0.94, 1], transition: { duration: 0.8, repeatDelay: 0.4 } },
  { y: [0, -34, 0, -34, 0], rotate: [0, -7, 0, 7, 0], transition: { duration: 1.1, repeatDelay: 0.3 } },
];

/** Пауза между выходами героев, с. */
export const PARADE_STEP = 0.42;

export function paradeDuration(count: number, step = PARADE_STEP) {
  return Math.round((0.5 + count * step + 1.6) * 1000);
}

export function HeroParade({
  scene,
  heroes,
  size,
  width = 1720,
  step = PARADE_STEP,
}: {
  scene: SceneDef;
  heroes: SceneObject[];
  size: number;
  width?: number;
  /** Пауза между выходами, с: на большом празднике короче, чтобы не ждать. */
  step?: number;
}) {
  const [hops, setHops] = useState<Record<string, number>>({});

  // Голос героя — в момент его выхода. Звук есть не у всех: остальным — мягкий «поп».
  useEffect(() => {
    const timers = heroes.map((h, i) => setTimeout(() => playSfx(h.sfx ?? 'pop'), (0.5 + i * step) * 1000 + 150));
    return () => timers.forEach(clearTimeout);
  }, [heroes, step]);

  return (
    <div className="flex flex-wrap items-end justify-center" style={{ width, gap: size * 0.16, rowGap: size * 0.2 }} data-testid="parade">
      {heroes.map((h, i) => {
        const move = MOVES[i % MOVES.length];
        const delay = 0.5 + i * step;
        return (
          <motion.button
            key={h.id}
            type="button"
            aria-label={h.id}
            data-hero={h.id}
            className="relative"
            style={{ width: size, height: size }}
            initial={{ y: 420, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onPointerDown={(e) => {
              if (!e.isPrimary) return;
              e.stopPropagation();
              playSfx(h.sfx ?? 'pop');
              void say([h.voice.name]);
              setHops((m) => ({ ...m, [h.id]: (m[h.id] ?? 0) + 1 }));
            }}
          >
            <motion.div
              className="h-full w-full"
              style={{ transformOrigin: '50% 100%' }}
              animate={{ ...move, transition: { ...move.transition, repeat: Infinity, delay: delay + 0.6 + (i % 3) * 0.15 } }}
            >
              <motion.div
                key={hops[h.id] ?? 0}
                className="h-full w-full rounded-[22%] bg-cream p-[6%]"
                style={{ boxShadow: '0 8px 0 0 #e5dccb, 0 0 0 8px #fff inset, 0 24px 40px -18px rgba(20,15,5,0.5)' }}
                animate={hops[h.id] ? { y: [0, -90, 0], rotate: [0, 360] } : undefined}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <ObjectArt scene={scene} obj={h} mood={h.tags.emotion === 'sad' ? 'happy' : undefined} />
              </motion.div>
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}
