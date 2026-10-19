import { motion } from 'framer-motion';
import { useRef, useState, type PointerEvent } from 'react';
import { ObjectArt } from '../../art';
import { playSfx, say } from '../../audio';
import { SCENES } from '../../data/scenes';
import { useStore } from '../../game/store';
import { RoundButton } from '../Button';
import { HomeIcon } from '../icons';
import { useStage } from '../Stage';

// Альбом наклеек: полянка, на которую ребёнок сам переклеивает зверят пальцем.
// Наклейка «говорит» своё имя при касании — ещё один повтор слова.

const STICKER = 200;

function defaultSpot(i: number) {
  const col = i % 6;
  const row = Math.floor(i / 6);
  return { x: 14 + col * 14 + (row % 2) * 6, y: 40 + row * 24 };
}

export function AlbumScreen({ onHome }: { onHome(): void }) {
  const { save, update } = useStore();
  const { toStage } = useStage();
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const moved = useRef(false);

  const all = SCENES.flatMap((s) => s.objects.map((o) => ({ ...o, scene: s })));
  const stickers = save.stickers.map((id) => all.find((o) => o.id === id)).filter((o) => !!o);

  const pos = (id: string, i: number) => (drag?.id === id ? drag : save.album[id] ?? defaultSpot(i));

  const down = (e: PointerEvent, id: string) => {
    if (!e.isPrimary) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moved.current = false;
    const p = toStage(e.clientX, e.clientY);
    setDrag({ id, ...p });
    playSfx('pop');
  };
  const move = (e: PointerEvent) => {
    if (!drag || !e.isPrimary) return;
    const p = toStage(e.clientX, e.clientY);
    if (Math.hypot(p.x - drag.x, p.y - drag.y) > 0.5) moved.current = true;
    setDrag({ id: drag.id, x: Math.min(95, Math.max(5, p.x)), y: Math.min(92, Math.max(22, p.y)) });
  };
  const up = () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (moved.current) {
      update((s) => ({ ...s, album: { ...s.album, [d.id]: { x: d.x, y: d.y } } }));
      playSfx('pop');
    } else {
      const o = all.find((x) => x.id === d.id);
      if (o) {
        playSfx(o.sfx ?? 'pop');
        void say([o.voice.name]);
      }
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="album" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="albumSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3e3c3" />
            <stop offset="1" stopColor="#f6efe1" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#albumSky)" />
        <path d="M0 380 Q480 300 960 360 Q1440 420 1920 340 L1920 1080 L0 1080Z" fill="#b9d08a" />
        <path d="M0 520 Q600 450 1200 520 Q1600 560 1920 500 L1920 1080 L0 1080Z" fill="#a9c46a" />
        {Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={(i * 211) % 1920} cy={560 + ((i * 97) % 480)} r={7} fill={['#fbf7ee', '#f2b8c0', '#f6d65c'][i % 3]} />
        ))}
      </svg>

      <div className="absolute left-[40px] top-[36px] z-20">
        <RoundButton label="домой" onPress={onHome} size={130} tone="paper">
          <HomeIcon />
        </RoundButton>
      </div>

      {stickers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="paper rounded-[48px] px-14 py-10 font-display text-[56px] text-ink-soft" style={{ boxShadow: '0 10px 0 0 var(--color-paper-edge)' }}>
            Здесь будут твои наклейки
          </div>
        </div>
      )}

      {stickers.map((o, i) => {
        const p = pos(o.id, i);
        const active = drag?.id === o.id;
        return (
          <motion.div
            key={o.id}
            data-sticker={o.id}
            onPointerDown={(e) => down(e, o.id)}
            className="absolute touch-none rounded-[40px] bg-[#fffaf0] p-5"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: STICKER,
              height: STICKER,
              marginLeft: -STICKER / 2,
              marginTop: -STICKER / 2,
              zIndex: active ? 10 : 1,
              boxShadow: active ? '0 30px 40px -12px rgba(30,25,15,0.45)' : '0 8px 0 0 #e5dccb, 0 14px 22px -10px rgba(30,25,15,0.35)',
              rotate: `${((i * 37) % 14) - 7}deg`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: active ? 1.12 : 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ObjectArt scene={o.scene} obj={o} mood={o.tags.emotion === 'sad' ? 'happy' : undefined} />
          </motion.div>
        );
      })}
    </div>
  );
}
