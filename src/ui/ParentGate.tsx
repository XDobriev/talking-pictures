import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { CloseIcon, ParentIcon } from './icons';

const HOLD_MS = 3000;

/**
 * Родительский контроль: удерживать кнопку 3 секунды.
 * Пример «2 + 3» шестилетка решит сам, а долгое удержание с инструкцией текстом — барьер для малыша.
 */
export function ParentGate({ onPass, onCancel }: { onPass(): void; onCancel(): void }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const loop = () => {
    if (start.current == null) return;
    const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      start.current = null;
      onPass();
      return;
    }
    raf.current = requestAnimationFrame(loop);
  };
  const down = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  };
  const up = () => {
    start.current = null;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  };

  const R = 118;
  const C = 2 * Math.PI * R;

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center" data-testid="parent-gate">
      <div className="absolute inset-0 bg-[#1f271c]/70" onPointerDown={onCancel} />
      <motion.div
        className="paper relative flex w-[860px] flex-col items-center rounded-[56px] px-14 py-12 text-center"
        style={{ boxShadow: '0 14px 0 0 var(--color-paper-edge), 0 40px 80px -20px rgba(0,0,0,0.6)' }}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          aria-label="закрыть"
          className="absolute right-8 top-8 h-20 w-20 rounded-full p-4 text-ink-soft"
          onPointerDown={(e) => {
            e.stopPropagation();
            onCancel();
          }}
        >
          <CloseIcon />
        </button>
        <h2 className="font-display text-[64px] leading-none text-ink">Для взрослых</h2>
        <p className="mt-5 max-w-[620px] text-[34px] leading-snug text-ink-soft">
          Нажмите и&nbsp;удерживайте замок 3&nbsp;секунды, чтобы открыть настройки.
        </p>
        <button
          type="button"
          aria-label="удерживать"
          data-testid="hold"
          className="relative mt-10 h-[260px] w-[260px] touch-none rounded-full"
          onPointerDown={down}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
        >
          <svg viewBox="0 0 260 260" className="absolute inset-0">
            <circle cx={130} cy={130} r={R} fill="none" stroke="rgba(61,58,47,0.12)" strokeWidth={16} />
            <circle
              cx={130}
              cy={130}
              r={R}
              fill="none"
              stroke="var(--color-moss)"
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              transform="rotate(-90 130 130)"
            />
          </svg>
          <span className="absolute inset-[44px] rounded-full bg-dusk p-9 text-paper" style={{ transform: `scale(${1 - progress * 0.08})` }}>
            <ParentIcon />
          </span>
        </button>
      </motion.div>
    </div>
  );
}
