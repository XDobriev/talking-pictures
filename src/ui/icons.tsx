// Иконки интерфейса — толстые скруглённые формы, читаются малышами без текста.

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const PlayIcon = () => (
  <svg viewBox="0 0 100 100">
    <path d="M36 24 L76 50 L36 76Z" fill="currentColor" stroke="currentColor" strokeWidth={10} strokeLinejoin="round" />
  </svg>
);

export const HomeIcon = () => (
  <svg viewBox="0 0 100 100">
    <path d="M18 50 L50 22 L82 50" {...S} />
    <path d="M28 46 V80 H72 V46" {...S} />
    <path d="M44 80 V62 H56 V80" {...S} strokeWidth={7} />
  </svg>
);

export const ArrowIcon = () => (
  <svg viewBox="0 0 100 100">
    <path d="M20 50 H76 M54 26 L78 50 L54 74" {...S} strokeWidth={11} />
  </svg>
);

export const ReplayIcon = () => (
  <svg viewBox="0 0 100 100">
    <path d="M74 38 A28 28 0 1 0 78 58" {...S} />
    <path d="M78 20 V40 H58" {...S} />
  </svg>
);

export const StarIcon = ({ filled = true }: { filled?: boolean }) => (
  <svg viewBox="0 0 100 100">
    <path
      d="M50 8 L62 36 L92 38 L69 58 L77 88 L50 72 L23 88 L31 58 L8 38 L38 36Z"
      fill={filled ? '#f6c95c' : 'rgba(61,58,47,0.15)'}
      stroke={filled ? '#b97d2a' : 'rgba(61,58,47,0.25)'}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    {filled && <path d="M40 34 L46 22" stroke="#fff6d8" strokeWidth={5} strokeLinecap="round" />}
  </svg>
);

/** «Для взрослых»: замок — знак родительской зоны, понятный без текста. */
export const ParentIcon = () => (
  <svg viewBox="0 0 100 100">
    <rect x={24} y={44} width={52} height={40} rx={10} fill="currentColor" />
    <path d="M34 44 V34 A16 16 0 0 1 66 34 V44" {...S} />
    <circle cx={50} cy={62} r={6} fill="#f6efe1" />
  </svg>
);

export const AlbumIcon = () => (
  <svg viewBox="0 0 100 100">
    <rect x={18} y={16} width={64} height={70} rx={10} fill="currentColor" />
    <rect x={30} y={30} width={18} height={18} rx={5} fill="#f6c95c" transform="rotate(-8 39 39)" />
    <rect x={52} y={48} width={18} height={18} rx={5} fill="#e78b98" transform="rotate(10 61 57)" />
    <circle cx={40} cy={66} r={7} fill="#86b0e4" />
  </svg>
);

/** Праздник: три воздушных шарика на ниточках. */
export const PartyIcon = () => (
  <svg viewBox="0 0 100 100">
    <path d="M30 46 Q34 64 48 86 M70 44 Q64 64 52 86 M50 36 Q47 62 50 86" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
    <ellipse cx={30} cy={32} rx={15} ry={18} fill="#f6c95c" transform="rotate(-14 30 32)" />
    <ellipse cx={70} cy={30} rx={15} ry={18} fill="#86b0e4" transform="rotate(14 70 30)" />
    <ellipse cx={50} cy={22} rx={15} ry={18} fill="currentColor" />
    <path d="M44 14 Q46 10 50 9" fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

export const SoundIcon =({ on }: { on: boolean }) => (
  <svg viewBox="0 0 100 100">
    <path d="M18 40 H34 L54 22 V78 L34 60 H18Z" fill="currentColor" />
    {on ? <path d="M66 36 Q76 50 66 64 M74 26 Q90 50 74 74" {...S} strokeWidth={7} /> : <path d="M66 38 L86 62 M86 38 L66 62" {...S} strokeWidth={7} />}
  </svg>
);

export const CloseIcon = () => (
  <svg viewBox="0 0 100 100">
    <path d="M28 28 L72 72 M72 28 L28 72" {...S} strokeWidth={11} />
  </svg>
);

/** Светлячок — маскот-подсказчик. */
export const FireflyArt = ({ glow = true }: { glow?: boolean }) => (
  <svg viewBox="0 0 100 100">
    {glow && <circle cx={50} cy={62} r={34} fill="#fff3b0" opacity={0.45} className="glow" style={{ transformOrigin: '50px 62px' }} />}
    <ellipse cx={34} cy={36} rx={14} ry={20} fill="#e6f1f6" opacity={0.9} transform="rotate(-25 34 36)" className="flap" />
    <ellipse cx={66} cy={36} rx={14} ry={20} fill="#e6f1f6" opacity={0.9} transform="rotate(25 66 36)" className="flap" />
    <ellipse cx={50} cy={66} rx={16} ry={18} fill="#f6d65c" />
    <ellipse cx={50} cy={70} rx={10} ry={11} fill="#fff6c2" />
    <circle cx={50} cy={40} r={15} fill="#4f6a8f" />
    <path d="M42 28 Q36 14 30 14 M58 28 Q64 14 70 14" stroke="#2f3b52" strokeWidth={3} fill="none" strokeLinecap="round" />
    <circle cx={30} cy={14} r={3.5} fill="#f6d65c" />
    <circle cx={70} cy={14} r={3.5} fill="#f6d65c" />
    <circle cx={44} cy={39} r={3.2} fill="#fff" />
    <circle cx={56} cy={39} r={3.2} fill="#fff" />
    <circle cx={44.8} cy={39.5} r={1.8} fill="var(--color-night)" />
    <circle cx={56.8} cy={39.5} r={1.8} fill="var(--color-night)" />
    <path d="M45 46 Q50 50 55 46" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
  </svg>
);

/** Детская лапка для обучения без слов. */
export const PawIcon = () => (
  <svg viewBox="0 0 100 100">
    <ellipse cx={50} cy={64} rx={22} ry={19} fill="#fbf7ee" stroke="#3d3a2f" strokeWidth={3} />
    {[
      [26, 40],
      [42, 28],
      [58, 28],
      [74, 40],
    ].map(([x, y]) => (
      <ellipse key={x} cx={x} cy={y} rx={8} ry={10} fill="#fbf7ee" stroke="#3d3a2f" strokeWidth={3} />
    ))}
    <ellipse cx={50} cy={66} rx={10} ry={8} fill="#f2b8c0" />
  </svg>
);
