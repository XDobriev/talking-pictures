import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Sprite } from '../art';
import { playSfx } from '../audio';
import type { SceneObject } from '../game/types';
import { RoundButton } from './Button';
import { ArrowIcon, HomeIcon, ReplayIcon, StarIcon } from './icons';

// Праздник без оценок: всегда 3 звезды из 3, наклейка-награда, большая стрелка «дальше».

export function WinOverlay({
  sticker,
  hasNext,
  onNext,
  onHome,
  onReplay,
}: {
  sticker: SceneObject;
  hasNext: boolean;
  onNext(): void;
  onHome(): void;
  onReplay(): void;
}) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const colors = ['#f6c95c', '#e78b98', '#86b0e4', '#9cbf5b', '#fbf7ee'];
    const fire = (x: number) =>
      confetti({ particleCount: 70, spread: 75, startVelocity: 48, origin: { x, y: 0.7 }, colors, ticks: 220, scalar: 1.1, disableForReducedMotion: true });
    fire(0.25);
    const t1 = setTimeout(() => fire(0.75), 260);
    const t2 = setTimeout(() => fire(0.5), 620);
    [0, 1, 2].forEach((i) => setTimeout(() => playSfx('sparkle'), 450 + i * 380));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div className="absolute inset-0 z-[60] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="win">
      <div className="absolute inset-0 bg-[#2f3b2a]/45" />
      <motion.div
        className="paper relative flex w-[980px] flex-col items-center rounded-[72px] px-16 pb-14 pt-10"
        style={{ boxShadow: '0 16px 0 0 var(--color-paper-edge), 0 40px 80px -20px rgba(20,15,5,0.55)' }}
        initial={{ y: 120, scale: 0.9, rotate: -2 }}
        animate={{ y: 0, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-[150px] w-[150px]"
              style={{ marginTop: i === 1 ? -30 : 0 }}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4 + i * 0.38, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <StarIcon />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="relative mt-6 h-[300px] w-[300px] rounded-[48px] bg-[#fffaf0] p-6"
          style={{ boxShadow: '0 8px 0 0 #e5dccb, 0 0 0 10px #fff inset', rotate: '-4deg' }}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: -4 }}
          transition={{ delay: 1.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          data-testid="sticker"
        >
          <Sprite id={sticker.sprite} mood={sticker.tags.emotion === 'sad' ? 'happy' : undefined} />
          <div className="absolute -right-4 -top-4 h-16 w-16 rotate-12 rounded-xl bg-ochre/70" />
        </motion.div>

        <div className="mt-10 flex items-center gap-10">
          <RoundButton label="домой" onPress={onHome} size={130} tone="paper">
            <HomeIcon />
          </RoundButton>
          <RoundButton label="ещё раз" onPress={onReplay} size={130} tone="paper">
            <ReplayIcon />
          </RoundButton>
          {hasNext && (
            <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ repeat: Infinity, duration: 1.6, delay: 2.2 }}>
              <RoundButton label="дальше" onPress={onNext} size={190} tone="moss">
                <ArrowIcon />
              </RoundButton>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
