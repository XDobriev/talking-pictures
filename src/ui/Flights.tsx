import { motion } from 'framer-motion';
import { ObjectArt } from '../art';
import type { SceneDef, SceneObject } from '../game/types';
import { FireflyArt, PawIcon } from './icons';
import { SLOT } from './TaskBar';

const pct = (o: SceneObject) => ({
  x: (o.rect.x / 100) * 1920,
  y: (o.rect.y / 100) * 1080,
  w: (o.rect.w / 100) * 1920,
  h: (o.rect.h / 100) * 1080,
});

/** Находка увеличивается, «чпокает» и летит дугой в свой слот. */
export function FoundFlight({ scene, obj, to, mood }: { scene: SceneDef; obj: SceneObject; to: { x: number; y: number }; mood?: 'happy' }) {
  const p = pct(obj);
  const size = Math.max(p.w, p.h);
  const endScale = (SLOT - 20) / size;
  const midY = Math.min(p.y, to.y) - 160;
  return (
    <motion.div
      className="pointer-events-none absolute z-50"
      style={{ left: p.x - size / 2, top: p.y - size / 2, width: size, height: size }}
      initial={{ x: 0, y: 0, scale: 1 }}
      animate={{
        x: [0, 0, (to.x - p.x) * 0.5, to.x - p.x],
        y: [0, -30, midY - p.y, to.y - p.y],
        scale: [1, 1.35, 1.1, endScale],
        rotate: [0, -6, 8, 0],
      }}
      transition={{ duration: 1.1, times: [0, 0.25, 0.6, 1], ease: 'easeInOut' }}
    >
      <div className="h-full w-full" style={{ filter: 'drop-shadow(0 0 30px rgba(255,243,176,0.9)) drop-shadow(0 0 0 var(--color-cream))' }}>
        <ObjectArt scene={scene} obj={obj} mood={mood} />
      </div>
    </motion.div>
  );
}

/** Светлячок вылетает из кнопки, рисует светящуюся дугу к цели и кружит над ней 3 секунды. */
export function FireflyFlight({ from, target }: { from: { x: number; y: number }; target: SceneObject }) {
  const p = pct(target);
  const dx = p.x - from.x;
  const dy = p.y - p.h / 2 - 40 - from.y;
  const r = Math.max(p.w, p.h) * 0.6;
  const circle = Array.from({ length: 13 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { x: dx + Math.cos(a) * r, y: dy + p.h / 2 + 40 + Math.sin(a) * r * 0.7 };
  });
  const arcMid = { x: dx * 0.5, y: Math.min(0, dy) - 220 };
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 z-40" viewBox="0 0 1920 1080">
        <motion.path
          d={`M${from.x} ${from.y} Q${from.x + arcMid.x} ${from.y + arcMid.y} ${from.x + dx} ${from.y + dy + p.h / 2}`}
          fill="none"
          stroke="#fff3b0"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray="2 26"
          initial={{ pathLength: 0, opacity: 0.9 }}
          animate={{ pathLength: 1, opacity: [0.9, 0.9, 0] }}
          transition={{ duration: 1.2, opacity: { duration: 4.2, times: [0, 0.7, 1] } }}
        />
      </svg>
      <motion.div
        className="pointer-events-none absolute z-50"
        style={{ left: from.x - 60, top: from.y - 60, width: 120, height: 120 }}
        initial={{ x: 0, y: 0, opacity: 0 }}
        animate={{
          x: [0, arcMid.x, ...circle.map((c) => c.x), dx],
          y: [0, arcMid.y, ...circle.map((c) => c.y), dy - 600],
          opacity: [1, ...Array(circle.length + 1).fill(1), 0],
        }}
        transition={{ duration: 4.6, ease: 'easeInOut' }}
      >
        <FireflyArt />
      </motion.div>
    </>
  );
}

/** Обучение без слов: лапка показывает на силуэт, летит к цели и «нажимает». Повторяется, пока ребёнок не найдёт. */
export function GhostHand({ from, target }: { from: { x: number; y: number }; target: SceneObject }) {
  const p = pct(target);
  return (
    <motion.div
      className="pointer-events-none absolute z-50"
      style={{ left: from.x - 70, top: from.y - 40, width: 140, height: 140 }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.85, 0.85, 0.85, 0.85, 0],
        x: [0, 0, p.x - from.x, p.x - from.x, p.x - from.x, p.x - from.x],
        y: [0, 0, p.y - from.y, p.y - from.y + 14, p.y - from.y, p.y - from.y],
        scale: [1, 1, 1, 0.85, 1, 1],
      }}
      transition={{ duration: 3.4, times: [0, 0.12, 0.55, 0.65, 0.75, 1], repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
    >
      <PawIcon />
    </motion.div>
  );
}
