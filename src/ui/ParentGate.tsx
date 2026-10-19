import { motion } from 'framer-motion';
import { useState } from 'react';
import { CloseIcon } from './icons';

const WORDS = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/** Три разные цифры 1–9. */
function makeCode() {
  return shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
}

/**
 * Родительский контроль: «нажмите цифры: семь, два, девять».
 * Цифры названы словами — малыш не прочтёт, а взрослый справится за секунду.
 * Удержание кнопки малыши проходили случайно (часто держат палец), а пример «2 + 3» шестилетка решит сам.
 * Кнопки стоят в случайном порядке, чтобы код нельзя было запомнить «по месту».
 */
export function ParentGate({ onPass, onCancel }: { onPass(): void; onCancel(): void }) {
  const [code, setCode] = useState(makeCode);
  const [order, setOrder] = useState(() => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const [entered, setEntered] = useState(0);

  const press = (d: number) => {
    if (d !== code[entered]) {
      // Ошибка — новый код и новый порядок, без упрёков.
      setEntered(0);
      setCode(makeCode());
      setOrder(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
      return;
    }
    if (entered + 1 === code.length) return onPass();
    setEntered(entered + 1);
  };

  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center" data-testid="parent-gate">
      <div className="absolute inset-0 bg-[#1f271c]/70" onPointerDown={onCancel} />
      <motion.div
        className="paper relative flex w-[1640px] flex-col items-center rounded-[56px] px-14 py-12 text-center"
        style={{ boxShadow: '0 14px 0 0 var(--color-paper-edge), 0 40px 80px -20px rgba(0,0,0,0.6)' }}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          aria-label="закрыть"
          className="absolute right-6 top-6 h-[120px] w-[120px] rounded-full bg-paper-deep p-[30px] text-ink"
          onPointerDown={(e) => {
            e.stopPropagation();
            onCancel();
          }}
        >
          <CloseIcon />
        </button>
        <h2 className="font-display text-[72px] leading-none text-ink">Для взрослых</h2>
        <p className="mt-6 text-[48px] leading-snug text-ink-soft">Чтобы открыть настройки, нажмите цифры:</p>
        <p className="mt-2 text-[60px] font-extrabold leading-snug text-ink" data-testid="gate-code" data-digits={code.join('')}>
          {code.map((d, i) => (
            <span key={i} style={{ opacity: i < entered ? 0.35 : 1 }}>
              {WORDS[d]}
              {i < code.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
        <div className="mt-10 flex gap-[18px]">
          {order.map((d) => (
            <button
              key={d}
              type="button"
              data-testid={`digit-${d}`}
              onPointerDown={(e) => {
                if (!e.isPrimary) return;
                press(d);
              }}
              className="cut flex h-[150px] w-[150px] items-center justify-center rounded-[36px] bg-dusk font-display leading-none text-[#fffaf0]"
              // .cut считает тень от размера шрифта кнопки, поэтому крупная цифра — во внутреннем span.
              style={{ fontSize: 19, ['--cut-shadow' as string]: 'var(--color-dusk-deep)' }}
            >
              <span className="text-[88px]">{d}</span>
            </button>
          ))}
        </div>
        <div className="mt-10 flex gap-6" aria-hidden>
          {code.map((_, i) => (
            <span key={i} className="h-[36px] w-[36px] rounded-full" style={{ background: i < entered ? 'var(--color-moss-deep)' : 'rgba(61,58,47,0.2)' }} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
