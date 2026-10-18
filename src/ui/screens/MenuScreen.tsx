import { motion } from 'framer-motion';
import { SceneBackground, Sprite } from '../../art';
import { resolveTargets } from '../../game/query';
import { useStore } from '../../game/store';
import type { SceneDef } from '../../game/types';
import { RoundButton } from '../Button';
import { AlbumIcon, ParentIcon, StarIcon } from '../icons';

// Тропинка уровней по лесу. Всё открыто сразу — малыша ничего не «запирает»,
// а следующий уровень подсвечен, чтобы было понятно, куда нажимать.

const PATH: { x: number; y: number }[] = [
  { x: 250, y: 840 },
  { x: 470, y: 690 },
  { x: 700, y: 820 },
  { x: 900, y: 630 },
  { x: 1100, y: 790 },
  { x: 1300, y: 600 },
  { x: 1480, y: 760 },
  { x: 1660, y: 560 },
  { x: 1480, y: 400 },
  { x: 1690, y: 260 },
];

const COMING = [
  { id: 'farm', title: 'Ферма' },
  { id: 'yard', title: 'Двор' },
];

export function MenuScreen({ scene, onLevel, onParent, onAlbum }: { scene: SceneDef; onLevel(i: number): void; onParent(): void; onAlbum(): void }) {
  const { save } = useStore();
  const next = scene.levels.findIndex((l) => !save.completed.includes(l.id));

  const d = PATH.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `Q${(PATH[i - 1].x + p.x) / 2} ${Math.min(PATH[i - 1].y, p.y) - 90} ${p.x} ${p.y}`)).join(' ');

  return (
    <div className="absolute inset-0" data-testid="menu">
      <div className="absolute inset-0 brightness-[0.95] saturate-[0.9]">
        <SceneBackground id={scene.background} />
      </div>
      <div className="absolute inset-0 bg-[#2f3b2a]/25" />

      <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1920 1080">
        <path d={d} fill="none" stroke="#f6efe1" strokeWidth={26} strokeLinecap="round" strokeDasharray="2 46" opacity={0.85} />
      </svg>

      {scene.levels.map((lvl, i) => {
        const p = PATH[i];
        const done = save.completed.includes(lvl.id);
        const isNext = i === next;
        const hero = resolveTargets(scene, lvl)[0];
        const size = isNext ? 190 : 160;
        return (
          <motion.button
            key={lvl.id}
            type="button"
            aria-label={`уровень ${i + 1}`}
            data-testid={`уровень ${i + 1}`}
            onPointerDown={(e) => {
              if (!e.isPrimary) return;
              onLevel(i);
            }}
            className="cut paper absolute rounded-full"
            style={{
              left: p.x - size / 2,
              top: p.y - size / 2,
              width: size,
              height: size,
              fontSize: 28,
              backgroundColor: done ? '#fffaf0' : 'var(--color-paper)',
              outline: isNext ? '10px solid var(--color-ochre)' : 'none',
              outlineOffset: 4,
            }}
            initial={{ scale: 0, rotate: -20 }}
            animate={isNext ? { scale: [1, 1.07, 1], rotate: 0 } : { scale: 1, rotate: 0 }}
            transition={isNext ? { scale: { repeat: Infinity, duration: 1.6 }, delay: i * 0.05 } : { delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="absolute inset-[20%]" style={done || isNext ? undefined : { filter: 'brightness(0)', opacity: 0.3 }}>
              {hero && <Sprite id={hero.sprite} mood={hero.tags.emotion === 'sad' && done ? 'happy' : undefined} />}
            </span>
            {done && (
              <span className="absolute -bottom-3 -right-3 h-[70px] w-[70px]">
                <StarIcon />
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Вкладки сцен: другие миры пока «скоро» */}
      <div className="absolute left-[40px] top-[40px] flex items-center gap-5">
        <RoundButton label="альбом" onPress={onAlbum} size={120} tone="berry">
          <AlbumIcon />
        </RoundButton>
        <div className="paper flex h-[96px] items-center rounded-full px-10 font-display text-[50px]" style={{ boxShadow: '0 8px 0 0 var(--color-paper-edge)' }}>
          {scene.title}
        </div>
        {COMING.map((c) => (
          <div key={c.id} className="flex h-[80px] items-center gap-3 rounded-full bg-paper/55 px-7 font-display text-[36px] text-ink/45">
            <span className="h-9 w-9 text-ink/40">
              <ParentIcon />
            </span>
            {c.title}
          </div>
        ))}
      </div>

      <div className="absolute right-[40px] top-[40px]">
        <RoundButton label="для взрослых" onPress={onParent} size={110} tone="dusk">
          <ParentIcon />
        </RoundButton>
      </div>
    </div>
  );
}
