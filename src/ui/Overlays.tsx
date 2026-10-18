import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** Заглушка «поверните экран» — только для сенсорных устройств в портретной ориентации. */
export function RotateOverlay() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
    const on = () => setPortrait(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  if (!portrait) return null;
  return (
    <div className="paper-dark fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 text-paper" data-testid="rotate">
      <motion.svg
        viewBox="0 0 120 120"
        className="h-40 w-40"
        animate={{ rotate: [0, 0, -90, -90, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.25, 0.5, 0.85, 1], ease: 'easeInOut' }}
      >
        <rect x={34} y={14} width={52} height={92} rx={12} fill="#f6efe1" />
        <rect x={40} y={24} width={40} height={68} rx={4} fill="#6f8f4e" />
        <circle cx={60} cy={99} r={3.5} fill="#6f8f4e" />
      </motion.svg>
      <p className="px-8 text-center font-display text-3xl">Поверните телефон боком</p>
    </div>
  );
}

/** Имитация рекламы в моке и блокировка ввода на время реального показа. */
export function AdOverlay({ mock }: { mock: boolean }) {
  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-[#1f271c]/85" data-testid="ad">
      {mock && <div className="rounded-[32px] bg-paper px-12 py-8 font-display text-[48px] text-ink-soft">Здесь будет реклама</div>}
    </div>
  );
}
