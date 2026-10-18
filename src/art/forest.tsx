import type { JSX } from 'react';

// Временный векторный арт сцены «Лес» в стиле «аппликация из цветной бумаги».
// Каждый спрайт — viewBox 0 0 100 100. Будет заменён на webp из пайплайна Gemini → Figma.

export type Mood = 'sad' | 'happy' | undefined;
export interface SpriteProps {
  mood?: Mood;
}

const INK = '#3d3a2f';

const Eye = ({ x, y, r = 3.2, closed = false }: { x: number; y: number; r?: number; closed?: boolean }) =>
  closed ? (
    <path d={`M${x - r} ${y} q${r} ${r * 0.9} ${r * 2} 0`} stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
  ) : (
    <g>
      <circle cx={x} cy={y} r={r} fill={INK} />
      <circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill="#fff" />
    </g>
  );

const Cheek = ({ x, y }: { x: number; y: number }) => <ellipse cx={x} cy={y} rx={3.4} ry={2.2} fill="#ef9a8a" opacity={0.7} />;

const Mouth = ({ x, y, mood, w = 5 }: { x: number; y: number; mood?: Mood; w?: number }) =>
  mood === 'sad' ? (
    <path d={`M${x - w / 2} ${y + 1.5} q${w / 2} -${w * 0.6} ${w} 0`} stroke={INK} strokeWidth={1.5} fill="none" strokeLinecap="round" />
  ) : (
    <path d={`M${x - w / 2} ${y} q${w / 2} ${w * 0.6} ${w} 0`} stroke={INK} strokeWidth={1.5} fill="none" strokeLinecap="round" />
  );

const Tear = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x} ${y} q-2 4 0 5.5 q2 -1.5 0 -5.5z`} fill="#7fb6e0" />
);

const Zz = ({ x, y }: { x: number; y: number }) => (
  <g className="zz" fill="none" stroke={INK} strokeWidth={1.3} strokeLinejoin="round" opacity={0.75}>
    <path d={`M${x} ${y} h4 l-4 4 h4`} />
    <path d={`M${x + 6} ${y - 7} h3 l-3 3 h3`} />
  </g>
);

// ---------------- декорации ----------------

const Sun = () => (
  <svg viewBox="0 0 100 100">
    <g className="spin-slow" style={{ transformOrigin: '50px 50px' }}>
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={47} y={4} width={6} height={16} rx={3} fill="#f2b84b" transform={`rotate(${i * 36} 50 50)`} />
      ))}
    </g>
    <circle cx={50} cy={50} r={28} fill="#f6c95c" />
    <circle cx={50} cy={50} r={28} fill="url(#paperShade)" />
    <Eye x={41} y={47} closed />
    <Eye x={59} y={47} closed />
    <Cheek x={36} y={56} />
    <Cheek x={64} y={56} />
    <Mouth x={50} y={58} w={8} />
  </svg>
);

const Cloud = () => (
  <svg viewBox="0 0 100 70">
    <path d="M14 56 q-12 0 -12 -12 q0 -12 14 -12 q2 -18 22 -18 q14 0 20 10 q6 -6 14 -4 q14 4 12 18 q14 2 12 12 q-2 8 -12 8z" fill="#fbf7ee" />
    <path d="M14 56 q-12 0 -12 -12 q0 -12 14 -12" fill="none" stroke="#e5dccb" strokeWidth={2} />
  </svg>
);

const Spruce = () => (
  <svg viewBox="0 0 100 220" preserveAspectRatio="xMidYMax meet">
    <rect x={44} y={180} width={12} height={36} rx={3} fill="#7a5638" />
    {[
      [50, 8, 26, 50],
      [50, 40, 34, 90],
      [50, 75, 42, 130],
      [50, 110, 48, 186],
    ].map(([cx, top, half, bottom], i) => (
      <path key={i} d={`M${cx} ${top} L${cx + half} ${bottom} Q${cx} ${bottom + 8} ${cx - half} ${bottom}Z`} fill={i % 2 ? '#3f6b45' : '#4a7a4f'} />
    ))}
    <path d="M50 8 L58 30" stroke="#5e9161" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const Birch = () => (
  <svg viewBox="0 0 80 220" preserveAspectRatio="xMidYMax meet">
    <path d="M34 218 L36 60 Q40 40 44 60 L46 218Z" fill="#f4efe6" />
    {[80, 105, 130, 160, 190].map((y, i) => (
      <rect key={y} x={i % 2 ? 37 : 40} y={y} width={6} height={3} rx={1.5} fill={INK} opacity={0.8} />
    ))}
    <path d="M40 92 Q58 80 70 70" stroke="#f4efe6" strokeWidth={4} fill="none" strokeLinecap="round" />
    <ellipse cx={40} cy={44} rx={34} ry={36} fill="#9cbf5b" />
    <ellipse cx={22} cy={58} rx={18} ry={16} fill="#8fb350" />
    <ellipse cx={58} cy={30} rx={18} ry={18} fill="#a9c968" />
    <ellipse cx={66} cy={66} rx={12} ry={10} fill="#9cbf5b" />
  </svg>
);

const Oak = () => (
  <svg viewBox="0 0 140 200" preserveAspectRatio="xMidYMax meet">
    <path d="M56 198 Q60 140 58 100 L82 100 Q80 140 88 198 Q72 190 56 198Z" fill="#8a5f3c" />
    <path d="M60 122 Q34 110 22 92" stroke="#8a5f3c" strokeWidth={8} fill="none" strokeLinecap="round" />
    <ellipse cx={70} cy={130} rx={8} ry={11} fill="#4d3322" />
    <ellipse cx={70} cy={60} rx={62} ry={50} fill="#5f8a3e" />
    <ellipse cx={34} cy={78} rx={30} ry={24} fill="#557f37" />
    <ellipse cx={104} cy={78} rx={30} ry={24} fill="#557f37" />
    <ellipse cx={74} cy={36} rx={34} ry={26} fill="#6c9947" />
  </svg>
);

const Pond = () => (
  <svg viewBox="0 0 160 100" preserveAspectRatio="none">
    <ellipse cx={80} cy={54} rx={78} ry={42} fill="#6e9fb8" />
    <ellipse cx={80} cy={58} rx={68} ry={32} fill="#80b2c9" />
    <path d="M40 50 q10 -4 20 0 M90 66 q10 -4 20 0 M60 74 q8 -3 16 0" stroke="#d8ecf2" strokeWidth={2.5} fill="none" strokeLinecap="round" className="ripple" />
    <ellipse cx={128} cy={70} rx={16} ry={7} fill="#5c8d43" />
    <path d="M128 70 L142 66" stroke="#80b2c9" strokeWidth={3} />
  </svg>
);

const Bush = () => (
  <svg viewBox="0 0 100 90">
    <ellipse cx={50} cy={60} rx={48} ry={30} fill="#557f37" />
    <ellipse cx={30} cy={46} rx={24} ry={22} fill="#628f40" />
    <ellipse cx={66} cy={42} rx={26} ry={24} fill="#6c9947" />
    <circle cx={30} cy={40} r={3} fill="#c4415a" />
    <circle cx={70} cy={34} r={3} fill="#c4415a" />
    <circle cx={56} cy={58} r={3} fill="#c4415a" />
  </svg>
);

const Stump = () => (
  <svg viewBox="0 0 100 100">
    <path d="M14 40 L18 90 Q50 100 82 90 L86 40Z" fill="#8a5f3c" />
    <path d="M30 50 L32 88 M52 52 L52 92 M70 50 L68 88" stroke="#6e4a2e" strokeWidth={3} />
    <ellipse cx={50} cy={40} rx={36} ry={12} fill="#d9b483" />
    <ellipse cx={50} cy={40} rx={22} ry={7} fill="none" stroke="#b8905e" strokeWidth={2} />
    <ellipse cx={50} cy={40} rx={10} ry={3} fill="none" stroke="#b8905e" strokeWidth={2} />
  </svg>
);

const Flowers = () => (
  <svg viewBox="0 0 120 90">
    {[
      [20, 40, '#e9d36b'],
      [48, 26, '#ffffff'],
      [76, 38, '#f2a5c0'],
      [100, 30, '#e9d36b'],
    ].map(([x, y, c], i) => (
      <g key={i}>
        <path d={`M${x} ${y} L${x} 88`} stroke="#5c8d43" strokeWidth={3} />
        {Array.from({ length: 6 }, (_, k) => (
          <ellipse key={k} cx={x as number} cy={(y as number) - 7} rx={4} ry={7} fill={c as string} transform={`rotate(${k * 60} ${x} ${y})`} />
        ))}
        <circle cx={x as number} cy={y as number} r={4} fill="#e08a3a" />
      </g>
    ))}
  </svg>
);

// ---------------- герои ----------------

const Squirrel = () => (
  <svg viewBox="0 0 100 100">
    <path d="M70 88 Q98 70 88 36 Q82 14 64 22 Q80 34 74 56 Q70 72 58 80Z" fill="#c9692f" />
    <path d="M70 80 Q90 64 84 40" stroke="#e0894a" strokeWidth={5} fill="none" strokeLinecap="round" />
    <ellipse cx={46} cy={70} rx={20} ry={22} fill="#d97a3a" />
    <ellipse cx={46} cy={74} rx={11} ry={14} fill="#f3d2a8" />
    <circle cx={42} cy={40} r={17} fill="#d97a3a" />
    <path d="M30 28 L28 12 L38 24Z M50 26 L56 10 L58 28Z" fill="#c9692f" />
    <Eye x={36} y={38} />
    <Eye x={49} y={38} />
    <ellipse cx={42} cy={46} rx={3} ry={2} fill={INK} />
    <Cheek x={31} y={46} />
    <ellipse cx={46} cy={64} rx={7} ry={6} fill="#a8733f" />
    <path d="M40 60 q6 -4 12 0" stroke="#7a5638" strokeWidth={2} fill="none" />
  </svg>
);

const Owl = () => (
  <svg viewBox="0 0 100 100">
    <ellipse cx={50} cy={58} rx={32} ry={38} fill="#9a6a45" />
    <ellipse cx={50} cy={66} rx={20} ry={24} fill="#e8d2b0" />
    {[58, 68, 78].map((y) => (
      <path key={y} d={`M40 ${y} q3 3 6 0 q3 3 6 0 q3 3 6 0`} stroke="#b89068" strokeWidth={1.6} fill="none" />
    ))}
    <path d="M22 30 L30 14 L40 26Z M78 30 L70 14 L60 26Z" fill="#7d5235" />
    <circle cx={38} cy={38} r={11} fill="#f3e6cf" />
    <circle cx={62} cy={38} r={11} fill="#f3e6cf" />
    <Eye x={34} y={39} r={4} closed />
    <Eye x={58} y={39} r={4} closed />
    <path d="M46 46 L50 54 L54 46Z" fill="#e0a43a" />
    <Zz x={78} y={20} />
  </svg>
);

const Tit = () => (
  <svg viewBox="0 0 100 100">
    <path d="M18 62 L4 74 L22 72Z" fill="#4f6a8f" />
    <ellipse cx={48} cy={58} rx={30} ry={24} fill="#f1cf3e" />
    <path d="M44 40 L44 80" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d="M30 58 Q42 80 64 64 Q48 66 30 58Z" fill="#6f8f4e" />
    <circle cx={64} cy={36} r={16} fill={INK} />
    <ellipse cx={66} cy={40} rx={9} ry={8} fill="#fbf7ee" />
    <Eye x={70} y={34} r={2.6} />
    <path d="M80 36 L90 38 L80 41Z" fill="#3d3a2f" />
    <path d="M40 82 L38 92 M54 82 L56 92" stroke="#7a5638" strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

const Rowan = () => (
  <svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMax meet">
    <path d="M48 200 L50 80 L54 200Z" fill="#7a5638" />
    {[
      [30, 70],
      [70, 60],
      [50, 40],
      [26, 110],
      [74, 100],
    ].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={22} ry={14} fill={i % 2 ? '#6f9a44' : '#7ca84f'} transform={`rotate(${i % 2 ? 20 : -20} ${x} ${y})`} />
    ))}
    {[
      [40, 82],
      [62, 74],
      [50, 112],
    ].map(([x, y], k) => (
      <g key={k}>
        {[0, 1, 2, 3, 4, 5].map((j) => (
          <circle key={j} cx={x + (j % 3) * 6 - 6} cy={y + Math.floor(j / 3) * 6} r={4} fill="#d9442f" />
        ))}
      </g>
    ))}
  </svg>
);

const Hedgehog = () => (
  <svg viewBox="0 0 100 100">
    <path d="M14 76 Q10 40 44 30 Q80 24 88 60 Q90 78 80 80Z" fill="#7d6a5a" />
    {Array.from({ length: 9 }, (_, i) => (
      <path key={i} d={`M${22 + i * 7} ${50 - Math.sin((i / 8) * Math.PI) * 18} l4 -12 l4 12`} fill="#5f4f42" />
    ))}
    <path d="M14 76 Q16 60 30 62 Q34 78 26 84Z" fill="#e8d2b0" />
    <circle cx={12} cy={70} r={3} fill={INK} />
    <Eye x={24} y={68} r={2.6} closed />
    <Cheek x={24} y={75} />
    <Zz x={70} y={18} />
  </svg>
);

const Amanita = () => (
  <svg viewBox="0 0 100 100">
    <path d="M38 92 Q36 66 42 54 L58 54 Q64 66 62 92Z" fill="#f4efe6" />
    <path d="M40 68 Q50 74 60 68" stroke="#e0d6c2" strokeWidth={3} fill="none" />
    <path d="M8 58 Q12 14 50 12 Q88 14 92 58 Q50 66 8 58Z" fill="#d9442f" />
    {[
      [28, 36, 5],
      [50, 26, 6],
      [70, 38, 5],
      [40, 50, 4],
      [62, 52, 3.5],
      [16, 52, 3],
      [84, 52, 3],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#fbf7ee" />
    ))}
  </svg>
);

const Boletus = () => (
  <svg viewBox="0 0 100 100">
    <path d="M36 94 Q30 70 40 54 L60 54 Q70 70 64 94Z" fill="#efe2c6" />
    <path d="M10 58 Q12 22 50 20 Q88 22 90 58 Q50 64 10 58Z" fill="#8a5233" />
    <path d="M24 34 Q40 26 56 28" stroke="#a8693f" strokeWidth={4} fill="none" strokeLinecap="round" />
  </svg>
);

const Ladybug = () => (
  <svg viewBox="0 0 100 100">
    <path d="M30 40 L18 30 M70 40 L82 30" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    <circle cx={50} cy={36} r={13} fill={INK} />
    <ellipse cx={50} cy={60} rx={30} ry={28} fill="#d9442f" />
    <path d="M50 34 L50 88" stroke={INK} strokeWidth={2.5} />
    {[
      [36, 52],
      [64, 52],
      [38, 72],
      [62, 72],
      [50, 62],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={5} fill={INK} />
    ))}
    <Eye x={45} y={34} r={2.4} />
    <Eye x={56} y={34} r={2.4} />
  </svg>
);

const Strawberry = () => (
  <svg viewBox="0 0 100 100">
    <path d="M30 26 Q36 18 46 24 Q50 14 56 24 Q66 18 72 28 Q60 32 50 30 Q40 32 30 26Z" fill="#5c8d43" />
    <path d="M24 34 Q50 22 76 34 Q80 62 50 92 Q20 62 24 34Z" fill="#d9442f" />
    {[
      [38, 44],
      [52, 40],
      [64, 46],
      [44, 58],
      [58, 60],
      [50, 74],
      [36, 66],
      [64, 66],
    ].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={1.6} ry={2.6} fill="#f6d36b" />
    ))}
  </svg>
);

const Bear = ({ mood }: SpriteProps) => (
  <svg viewBox="0 0 100 120">
    <ellipse cx={50} cy={86} rx={32} ry={30} fill="#8a5a3a" />
    <ellipse cx={50} cy={90} rx={18} ry={20} fill="#c99a6c" />
    <circle cx={24} cy={24} r={11} fill="#8a5a3a" />
    <circle cx={76} cy={24} r={11} fill="#8a5a3a" />
    <circle cx={24} cy={24} r={5.5} fill="#c99a6c" />
    <circle cx={76} cy={24} r={5.5} fill="#c99a6c" />
    <circle cx={50} cy={44} r={28} fill="#9a6a45" />
    <ellipse cx={50} cy={54} rx={12} ry={9} fill="#d9b483" />
    <ellipse cx={50} cy={50} rx={4.5} ry={3.4} fill={INK} />
    <Eye x={39} y={40} r={3.4} />
    <Eye x={61} y={40} r={3.4} />
    <Mouth x={50} y={57} mood={mood === 'happy' ? 'happy' : 'sad'} w={7} />
    {mood !== 'happy' && <Tear x={37} y={45} />}
    {mood === 'happy' ? (
      <>
        <Cheek x={33} y={50} />
        <Cheek x={67} y={50} />
        <path d="M86 70 q4 -8 8 0 q4 -8 8 0 l-8 9z" fill="#e85a6c" className="heart-pop" />
      </>
    ) : (
      <g>
        <path d="M78 104 q-4 -10 6 -14 l12 4 q4 10 -4 14z" fill="#e0a43a" />
        <path d="M80 104 q8 6 14 -4" stroke="#b97d2a" strokeWidth={2} fill="none" />
      </g>
    )}
  </svg>
);

const Bunny = () => (
  <svg viewBox="0 0 100 120">
    <ellipse cx={36} cy={20} rx={8} ry={20} fill="#f4efe6" transform="rotate(-10 36 20)" />
    <ellipse cx={60} cy={20} rx={8} ry={20} fill="#f4efe6" transform="rotate(10 60 20)" />
    <ellipse cx={36} cy={22} rx={3.6} ry={14} fill="#f2b8c0" transform="rotate(-10 36 22)" />
    <ellipse cx={60} cy={22} rx={3.6} ry={14} fill="#f2b8c0" transform="rotate(10 60 22)" />
    <ellipse cx={50} cy={88} rx={28} ry={26} fill="#f4efe6" />
    <circle cx={78} cy={92} r={8} fill="#fbf7ee" />
    <circle cx={48} cy={54} r={22} fill="#fbf7ee" />
    <Eye x={40} y={52} r={3} />
    <Eye x={57} y={52} r={3} />
    <ellipse cx={48} cy={60} rx={3} ry={2.2} fill="#e78b98" />
    <Cheek x={35} y={61} />
    <Cheek x={62} y={61} />
    <ellipse cx={36} cy={112} rx={10} ry={5} fill="#e5dccb" />
    <ellipse cx={62} cy={112} rx={10} ry={5} fill="#e5dccb" />
  </svg>
);

const Snail = () => (
  <svg viewBox="0 0 100 100">
    <path d="M8 84 Q20 70 40 74 L90 76 Q96 86 84 88 L12 90Z" fill="#c9b47a" />
    <circle cx={56} cy={56} r={26} fill="#e0a43a" />
    <path d="M56 56 m0 -16 a16 16 0 1 1 -16 16 a10 10 0 1 1 10 -10 a5 5 0 1 1 5 5" stroke="#a8692a" strokeWidth={3.5} fill="none" />
    <path d="M20 74 L14 54 M28 74 L28 54" stroke="#c9b47a" strokeWidth={4} strokeLinecap="round" />
    <circle cx={14} cy={52} r={3.4} fill={INK} />
    <circle cx={28} cy={52} r={3.4} fill={INK} />
    <Mouth x={18} y={80} w={6} />
  </svg>
);

const Fox = () => (
  <svg viewBox="0 0 120 100">
    <path d="M70 70 Q112 64 112 40 Q118 70 92 84 Q78 90 66 84Z" fill="#d06a2e" />
    <path d="M104 50 Q114 56 112 40 Q104 46 104 50Z" fill="#fbf7ee" />
    <ellipse cx={64} cy={74} rx={36} ry={20} fill="#e07a36" />
    <ellipse cx={58} cy={80} rx={20} ry={10} fill="#f6e0c2" />
    <path d="M14 70 Q20 44 42 50 Q50 70 38 84 Q22 86 14 70Z" fill="#e07a36" />
    <path d="M24 52 L20 34 L34 48Z M40 50 L46 34 L48 52Z" fill="#c45d26" />
    <path d="M14 70 Q24 80 38 82 Q26 88 14 78Z" fill="#fbf7ee" />
    <circle cx={13} cy={72} r={3} fill={INK} />
    <Eye x={30} y={64} r={2.8} closed />
    <Zz x={46} y={36} />
  </svg>
);

const Butterfly = () => (
  <svg viewBox="0 0 100 100" className="flap">
    <ellipse cx={30} cy={36} rx={22} ry={18} fill="#5d8fd0" transform="rotate(-20 30 36)" />
    <ellipse cx={70} cy={36} rx={22} ry={18} fill="#5d8fd0" transform="rotate(20 70 36)" />
    <ellipse cx={32} cy={66} rx={15} ry={13} fill="#86b0e4" />
    <ellipse cx={68} cy={66} rx={15} ry={13} fill="#86b0e4" />
    <circle cx={28} cy={34} r={6} fill="#f6c95c" />
    <circle cx={72} cy={34} r={6} fill="#f6c95c" />
    <ellipse cx={50} cy={52} rx={4.5} ry={24} fill={INK} />
    <path d="M48 30 Q42 16 36 14 M52 30 Q58 16 64 14" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
  </svg>
);

const Bee = () => (
  <svg viewBox="0 0 100 100">
    <ellipse cx={40} cy={30} rx={14} ry={18} fill="#e6f1f6" opacity={0.9} className="flap" />
    <ellipse cx={60} cy={28} rx={14} ry={18} fill="#e6f1f6" opacity={0.9} className="flap" />
    <ellipse cx={50} cy={60} rx={32} ry={24} fill="#f1cf3e" />
    {[38, 52, 66].map((x) => (
      <rect key={x} x={x - 4} y={37} width={8} height={46} rx={4} fill={INK} />
    ))}
    <path d="M82 60 L94 62 L82 66Z" fill={INK} />
    <circle cx={20} cy={58} r={14} fill="#f1cf3e" />
    <Eye x={16} y={55} r={2.6} />
    <Mouth x={17} y={62} w={5} />
  </svg>
);

const Duck = () => (
  <svg viewBox="0 0 100 100">
    <ellipse cx={52} cy={80} rx={46} ry={8} fill="#6e9fb8" opacity={0.6} />
    <path d="M14 66 Q16 46 44 50 Q74 44 88 60 Q86 80 54 82 Q22 82 14 66Z" fill="#f1cf3e" />
    <path d="M44 60 Q60 52 74 64 Q58 70 44 60Z" fill="#e0b52e" />
    <circle cx={28} cy={40} r={16} fill="#f1cf3e" />
    <path d="M10 42 Q4 44 6 48 Q12 50 18 46Z" fill="#e8823a" />
    <Eye x={26} y={36} r={2.8} />
    <Cheek x={34} y={44} />
  </svg>
);

const Frog = () => (
  <svg viewBox="0 0 100 100">
    <ellipse cx={50} cy={82} rx={46} ry={14} fill="#5c8d43" />
    <path d="M50 82 L92 76" stroke="#80b2c9" strokeWidth={4} />
    <ellipse cx={50} cy={66} rx={30} ry={20} fill="#7cb24f" />
    <circle cx={34} cy={42} r={11} fill="#7cb24f" />
    <circle cx={66} cy={42} r={11} fill="#7cb24f" />
    <circle cx={34} cy={42} r={6} fill="#fbf7ee" />
    <circle cx={66} cy={42} r={6} fill="#fbf7ee" />
    <Eye x={34} y={43} r={3.2} />
    <Eye x={66} y={43} r={3.2} />
    <path d="M32 64 Q50 76 68 64" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    <Cheek x={28} y={60} />
    <Cheek x={72} y={60} />
  </svg>
);

const Fish = () => (
  <svg viewBox="0 0 100 100">
    <path d="M10 90 q10 -6 20 0 M64 92 q10 -6 20 0" stroke="#d8ecf2" strokeWidth={3} fill="none" strokeLinecap="round" />
    <g transform="rotate(-30 50 50)">
      <path d="M78 50 L96 36 L94 64Z" fill="#e8823a" />
      <ellipse cx={50} cy={50} rx={32} ry={18} fill="#f09a4a" />
      <path d="M44 34 Q54 24 64 34" fill="#e8823a" />
      <path d="M40 40 Q44 50 40 60 M52 40 Q56 50 52 60" stroke="#e8823a" strokeWidth={2.5} fill="none" />
      <Eye x={28} y={46} r={3} />
    </g>
    <circle cx={22} cy={18} r={3} fill="#d8ecf2" />
    <circle cx={30} cy={8} r={2} fill="#d8ecf2" />
  </svg>
);

const Mouse = ({ mood }: SpriteProps) => (
  <svg viewBox="0 0 100 100">
    <path d="M78 84 Q98 82 94 64" stroke="#e8a3a8" strokeWidth={3} fill="none" strokeLinecap="round" />
    <ellipse cx={56} cy={74} rx={26} ry={20} fill="#a8a4a0" />
    <circle cx={28} cy={30} r={12} fill="#a8a4a0" />
    <circle cx={28} cy={30} r={7} fill="#f2b8c0" />
    <circle cx={58} cy={30} r={12} fill="#a8a4a0" />
    <circle cx={58} cy={30} r={7} fill="#f2b8c0" />
    <ellipse cx={42} cy={50} rx={22} ry={18} fill="#b8b4b0" />
    <circle cx={30} cy={58} r={3} fill="#e78b98" />
    <Eye x={36} y={46} r={2.8} />
    <Eye x={52} y={46} r={2.8} />
    <Mouth x={42} y={58} mood={mood === 'happy' ? 'happy' : 'sad'} w={6} />
    {mood !== 'happy' && <Tear x={33} y={50} />}
    {mood === 'happy' && (
      <>
        <path d="M72 46 l14 -8 l2 14z" fill="#f6c95c" />
        <circle cx={80} cy={45} r={1.6} fill="#e0a43a" />
        <path d="M84 20 q4 -8 8 0 q4 -8 8 0 l-8 9z" fill="#e85a6c" className="heart-pop" />
      </>
    )}
  </svg>
);

// ---------------- фон ----------------

export const ForestBackground = () => (
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#bcdbe0" />
        <stop offset="1" stopColor="#eef0dc" />
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a9c46a" />
        <stop offset="1" stopColor="#7fa24c" />
      </linearGradient>
      <radialGradient id="paperShade" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0.08" />
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#sky)" />
    <path d="M0 520 Q240 380 520 470 Q760 360 1040 450 Q1300 350 1560 440 Q1760 390 1920 450 L1920 700 L0 700Z" fill="#b7cfa0" />
    <path d="M0 580 Q300 470 620 560 Q900 480 1200 560 Q1500 480 1920 560 L1920 760 L0 760Z" fill="#9fbf7a" />
    <path d="M0 620 Q480 560 960 600 Q1440 640 1920 590 L1920 1080 L0 1080Z" fill="url(#ground)" />
    <path d="M860 1080 Q900 900 1000 820 Q1080 760 1020 680 L1080 680 Q1160 770 1080 840 Q980 930 1060 1080Z" fill="#d9c391" opacity="0.85" />
    {Array.from({ length: 34 }, (_, i) => {
      const x = (i * 263) % 1920;
      const y = 720 + ((i * 137) % 340);
      return <path key={i} d={`M${x} ${y} l6 -22 l6 22 l6 -16 l4 16`} fill="#6c9947" opacity="0.8" />;
    })}
  </svg>
);

export const FOREST_SPRITES: Record<string, (p: SpriteProps) => JSX.Element> = {
  'forest/sun': Sun,
  'forest/cloud': Cloud,
  'forest/spruce': Spruce,
  'forest/birch': Birch,
  'forest/oak': Oak,
  'forest/pond': Pond,
  'forest/bush': Bush,
  'forest/stump': Stump,
  'forest/flowers': Flowers,
  'forest/squirrel': Squirrel,
  'forest/owl': Owl,
  'forest/tit': Tit,
  'forest/rowan': Rowan,
  'forest/hedgehog': Hedgehog,
  'forest/amanita': Amanita,
  'forest/boletus': Boletus,
  'forest/ladybug': Ladybug,
  'forest/strawberry': Strawberry,
  'forest/bear': Bear,
  'forest/bunny': Bunny,
  'forest/snail': Snail,
  'forest/fox': Fox,
  'forest/butterfly': Butterfly,
  'forest/bee': Bee,
  'forest/duck': Duck,
  'forest/frog': Frog,
  'forest/fish': Fish,
  'forest/mouse': Mouse,
};
