import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { playSfx } from '../audio';

type Tone = 'ochre' | 'moss' | 'paper' | 'dusk' | 'berry';

const TONES: Record<Tone, { bg: string; fg: string; shadow: string }> = {
  ochre: { bg: 'var(--color-ochre)', fg: '#fffaf0', shadow: 'var(--color-ochre-deep)' },
  moss: { bg: 'var(--color-moss)', fg: '#fffaf0', shadow: 'var(--color-moss-deep)' },
  paper: { bg: 'var(--color-paper)', fg: 'var(--color-ink)', shadow: 'var(--color-paper-edge)' },
  dusk: { bg: 'var(--color-dusk)', fg: '#fffaf0', shadow: 'var(--color-dusk-deep)' },
  berry: { bg: 'var(--color-berry)', fg: '#fffaf0', shadow: '#8e2c40' },
};

/** Круглая «бумажная» кнопка. size — диаметр в пикселях холста 1920×1080. */
export function RoundButton({
  onPress,
  size = 120,
  tone = 'paper',
  children,
  label,
  className = '',
  style,
  silent,
  disabled,
}: {
  onPress: () => void;
  size?: number;
  tone?: Tone;
  children: ReactNode;
  /** Подпись для скринридеров и тестов — на экране не показывается. */
  label: string;
  className?: string;
  style?: CSSProperties;
  silent?: boolean;
  disabled?: boolean;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!e.isPrimary || disabled) return;
        e.stopPropagation();
        if (!silent) playSfx('pop');
        onPress();
      }}
      className={`cut paper flex items-center justify-center rounded-full disabled:opacity-50 ${className}`}
      style={
        {
          width: size,
          height: size,
          fontSize: size / 8,
          backgroundColor: t.bg,
          color: t.fg,
          '--cut-shadow': t.shadow,
          ...style,
        } as CSSProperties
      }
    >
      <span className="block" style={{ width: size * 0.56, height: size * 0.56 }}>
        {children}
      </span>
    </button>
  );
}

export const HOLD_MS = 1000;

/**
 * Круглая кнопка, которая срабатывает только после удержания ~1 с: вокруг заполняется кольцо.
 * Для выходов, которые малыш может нажать случайно (дети часто держат палец недолго и отпускают).
 * Клавиатура (Enter/пробел) срабатывает сразу — ей пользуются взрослые.
 */
export function HoldButton({
  onPress,
  size = 130,
  tone = 'paper',
  children,
  label,
}: {
  onPress: () => void;
  size?: number;
  tone?: Tone;
  children: ReactNode;
  label: string;
}) {
  const t = TONES[tone];
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
      playSfx('pop');
      onPress();
      return;
    }
    raf.current = requestAnimationFrame(loop);
  };
  const release = () => {
    start.current = null;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  };

  const ring = 14; // толщина кольца в пикселях холста
  const outer = size + ring * 3;
  const R = (outer - ring) / 2;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative flex items-center justify-center" style={{ width: outer, height: outer }}>
      <svg viewBox={`0 0 ${outer} ${outer}`} className="pointer-events-none absolute inset-0" aria-hidden>
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={R}
          fill="none"
          stroke="var(--color-glow)"
          strokeWidth={ring}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          transform={`rotate(-90 ${outer / 2} ${outer / 2})`}
          opacity={progress > 0 ? 1 : 0}
          style={{ filter: 'drop-shadow(0 0 6px rgba(30,25,15,0.45))' }}
        />
      </svg>
      <button
        type="button"
        aria-label={label}
        data-testid={label}
        data-hold="true"
        onPointerDown={(e) => {
          if (!e.isPrimary) return;
          e.stopPropagation();
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          start.current = performance.now();
          cancelAnimationFrame(raf.current);
          raf.current = requestAnimationFrame(loop);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onClick={(e) => {
          // detail === 0 — «щелчок» с клавиатуры, а не касание.
          if (e.detail === 0) onPress();
        }}
        className="cut paper flex touch-none items-center justify-center rounded-full"
        style={
          {
            width: size,
            height: size,
            fontSize: size / 8,
            backgroundColor: t.bg,
            color: t.fg,
            '--cut-shadow': t.shadow,
          } as CSSProperties
        }
      >
        <span className="block" style={{ width: size * 0.56, height: size * 0.56 }}>
          {children}
        </span>
      </button>
    </div>
  );
}
