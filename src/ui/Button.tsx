import type { CSSProperties, ReactNode } from 'react';
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
