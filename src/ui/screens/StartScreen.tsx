import { motion } from 'framer-motion';
import { SceneBackground } from '../../art';
import { FireflyArt, PlayIcon } from '../icons';

/** Первый экран: кнопка «Играть» — заодно жест, разблокирующий звук в браузере. */
export function StartScreen({ onPlay }: { onPlay(): void }) {
  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="start">
      <div className="absolute inset-0 scale-105 blur-[6px] brightness-[0.92]">
        <SceneBackground id="forest/bg" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-night/10 via-transparent to-night/35" />

      <motion.div
        className="paper absolute left-1/2 top-[150px] w-[1060px] -translate-x-1/2 rounded-[64px] px-16 pb-12 pt-10 text-center"
        style={{ boxShadow: '0 14px 0 0 var(--color-paper-edge), 0 40px 70px -24px rgba(20,15,5,0.5)', rotate: '-1.2deg' }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display text-[132px] leading-[0.95] text-ink">
          Говорящие
          <br />
          <span className="text-moss">картинки</span>
        </h1>
        <p className="mt-6 text-[38px] font-semibold text-ink-soft">найди и назови</p>
      </motion.div>

      <motion.div
        className="float absolute h-[220px] w-[220px]"
        style={{ left: 1440, top: 90 }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <FireflyArt />
      </motion.div>

      <motion.button
        type="button"
        aria-label="играть"
        data-testid="играть"
        onPointerDown={(e) => {
          if (!e.isPrimary) return;
          onPlay();
        }}
        className="cut paper absolute left-1/2 top-[720px] flex h-[250px] w-[250px] -translate-x-1/2 items-center justify-center rounded-full text-cream"
        style={{ backgroundColor: 'var(--color-moss)', ['--cut-shadow' as string]: 'var(--color-moss-deep)', fontSize: 30 }}
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut', delay: 0.8 } }}
      >
        <span className="ml-3 block h-[130px] w-[130px]">
          <PlayIcon />
        </span>
      </motion.button>
    </div>
  );
}
