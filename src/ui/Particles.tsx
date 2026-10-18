import { motion } from 'framer-motion';
import { forwardRef, useImperativeHandle, useState } from 'react';

export type ParticleKind = 'bubbles' | 'leaves' | 'drops' | 'sparkles' | 'butterflies' | 'hearts' | 'stars';

interface Burst {
  id: number;
  kind: ParticleKind;
  x: number;
  y: number;
}

export interface ParticlesHandle {
  spawn(kind: ParticleKind, x: number, y: number): void;
}

let seq = 0;

const COUNT: Record<ParticleKind, number> = { bubbles: 9, leaves: 6, drops: 7, sparkles: 8, butterflies: 3, hearts: 5, stars: 8 };

function Piece({ kind, i }: { kind: ParticleKind; i: number }) {
  const hue = ['#86b0e4', '#f2b8c0', '#f6d65c', '#a9d6b5', '#c9b6ec'][i % 5];
  switch (kind) {
    case 'bubbles':
      return (
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <circle cx={20} cy={20} r={17} fill={hue} fillOpacity={0.35} stroke={hue} strokeWidth={2.5} />
          <ellipse cx={13} cy={13} rx={4} ry={2.6} fill="#fff" opacity={0.85} transform="rotate(-35 13 13)" />
        </svg>
      );
    case 'leaves':
      return (
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path d="M6 34 Q4 8 34 6 Q36 32 6 34Z" fill={i % 2 ? '#7ca84f' : '#9cbf5b'} />
          <path d="M8 32 L30 10" stroke="#5c8d43" strokeWidth={2} />
        </svg>
      );
    case 'drops':
      return (
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path d="M20 4 Q34 24 20 36 Q6 24 20 4Z" fill="#7fb6e0" />
        </svg>
      );
    case 'sparkles':
    case 'stars':
      return (
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16Z" fill={kind === 'stars' ? '#f6c95c' : '#fff3b0'} />
        </svg>
      );
    case 'butterflies':
      return (
        <svg viewBox="0 0 40 40" className="h-full w-full flap">
          <ellipse cx={12} cy={16} rx={10} ry={8} fill={hue} />
          <ellipse cx={28} cy={16} rx={10} ry={8} fill={hue} />
          <ellipse cx={13} cy={28} rx={7} ry={6} fill={hue} opacity={0.8} />
          <ellipse cx={27} cy={28} rx={7} ry={6} fill={hue} opacity={0.8} />
          <rect x={18.5} y={10} width={3} height={22} rx={1.5} fill="#3d3a2f" />
        </svg>
      );
    case 'hearts':
      return (
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <path d="M20 34 L6 20 Q0 10 10 6 Q16 4 20 12 Q24 4 30 6 Q40 10 34 20Z" fill="#e85a6c" />
        </svg>
      );
  }
}

/** Слой частиц поверх сцены. Координаты — проценты холста. */
export const Particles = forwardRef<ParticlesHandle>(function Particles(_, ref) {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useImperativeHandle(ref, () => ({
    spawn(kind, x, y) {
      const id = ++seq;
      setBursts((b) => [...b.slice(-12), { id, kind, x, y }]);
      setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 2600);
    },
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {bursts.map((b) =>
        Array.from({ length: COUNT[b.kind] }, (_, i) => {
          const n = COUNT[b.kind];
          const angle = (i / n) * Math.PI * 2 + b.id;
          const rise = b.kind === 'bubbles' || b.kind === 'butterflies' || b.kind === 'hearts';
          const fall = b.kind === 'drops' || b.kind === 'leaves';
          const dist = 90 + ((i * 37) % 70);
          const dx = Math.cos(angle) * dist;
          const dy = rise ? -160 - ((i * 29) % 120) : fall ? 150 + ((i * 23) % 80) : Math.sin(angle) * dist;
          const size = b.kind === 'butterflies' ? 70 : b.kind === 'bubbles' ? 46 + ((i * 13) % 34) : 38;
          return (
            <motion.div
              key={`${b.id}-${i}`}
              className="absolute"
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
              initial={{ x: 0, y: 0, scale: 0.2, opacity: 0, rotate: 0 }}
              animate={{
                x: rise ? [0, dx * 0.5, dx] : dx,
                y: dy,
                scale: [0.2, 1, b.kind === 'bubbles' ? 1.15 : 0.9],
                opacity: [0, 1, 1, 0],
                rotate: b.kind === 'leaves' ? 200 : b.kind === 'sparkles' || b.kind === 'stars' ? 90 : 0,
              }}
              transition={{ duration: b.kind === 'bubbles' ? 2.2 : 1.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 }}
            >
              <Piece kind={b.kind} i={i} />
            </motion.div>
          );
        }),
      )}
    </div>
  );
});
