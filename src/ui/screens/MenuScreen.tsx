import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { ObjectArt, SceneBackground, cropStyle, isBaked } from '../../art';
import { say } from '../../audio';
import { playSfx } from '../../audio/sfx';
import { SCENES } from '../../data/scenes';
import { resolveTargets } from '../../game/query';
import { useStore } from '../../game/store';
import { sceneComplete, takeIntro } from '../../game/story';
import type { SceneDef } from '../../game/types';
import { RoundButton } from '../Button';
import { AlbumIcon, ParentIcon, PartyIcon, StarIcon } from '../icons';

// Тропинка уровней по лесу. Всё открыто сразу — малыша ничего не «запирает»,
// а следующий уровень подсвечен, чтобы было понятно, куда нажимать.
// В конце тропинки — праздник сцены: цель истории. Он оживает, когда пройдены все уровни.

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
  { x: 1660, y: 290 }, // ниже замка «для взрослых», чтобы подсветка не наезжала на него
  { x: 1300, y: 330 }, // праздник леса (10 уровней)
];

const FINALE_SIZE = 200;

const COMING: { id: string; title: string }[] = [];

/** Кружок с героем сцены — круглое «окошко» в её фон: квадратный кадр по диагонали героя, чтобы он целиком влез в круг. */
function SceneHero({ scene, size }: { scene: SceneDef; size: number }) {
  const hero = scene.objects.find((o) => o.id === scene.icon);
  if (!hero) return null;
  const { x, y, w, h } = hero.rect;
  const side = Math.hypot((w / 100) * 1920, (h / 100) * 1080) * 0.95; // в пикселях фона 1920×1080
  const square = { x, y, w: (side / 1920) * 100, h: (side / 1080) * 100 };
  return (
    <span
      className="block shrink-0 overflow-hidden rounded-full border-[6px] border-cream bg-cream"
      style={{ width: size, height: size, ...(isBaked(scene) ? cropStyle(scene.background, square) : {}) }}
    >
      {!isBaked(scene) && <ObjectArt scene={scene} obj={hero} />}
    </span>
  );
}

export function MenuScreen({
  scene,
  onScene,
  onLevel,
  onParent,
  onAlbum,
  onFinale,
}: {
  scene: SceneDef;
  onScene(id: string): void;
  onLevel(i: number): void;
  onParent(): void;
  onAlbum(): void;
  onFinale(): void;
}) {
  const { save } = useStore();
  const next = scene.levels.findIndex((l) => !save.completed.includes(l.id));
  const complete = sceneComplete(scene, save.completed);

  // Новая сцена — сначала история: ради чего искать.
  useEffect(() => {
    if (!scene.story || !takeIntro(scene, save.completed)) return;
    const t = setTimeout(() => void say([scene.story!.intro]), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  const path = PATH.slice(0, scene.levels.length + (scene.story ? 1 : 0));
  const finalePos = scene.story ? path[scene.levels.length] : null;
  const d = path.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `Q${(path[i - 1].x + p.x) / 2} ${Math.min(path[i - 1].y, p.y) - 90} ${p.x} ${p.y}`)).join(' ');

  return (
    <div className="absolute inset-0" data-testid="menu">
      <div className="absolute inset-0 brightness-[0.95] saturate-[0.9]">
        <SceneBackground id={scene.background} />
      </div>
      <div className="absolute inset-0 bg-night/25" />

      <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1920 1080">
        <path d={d} fill="none" stroke="#f6efe1" strokeWidth={26} strokeLinecap="round" strokeDasharray="2 46" opacity={0.85} />
      </svg>

      {scene.levels.map((lvl, i) => {
        const p = PATH[i];
        const done = save.completed.includes(lvl.id);
        const isNext = i === next;
        const hero = scene.objects.find((o) => o.id === lvl.icon) ?? resolveTargets(scene, lvl)[0];
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
              backgroundColor: done ? 'var(--color-cream)' : 'var(--color-paper)',
              outline: isNext ? '10px solid var(--color-ochre)' : 'none',
              outlineOffset: 4,
            }}
            initial={{ scale: 0, rotate: -20 }}
            animate={isNext ? { scale: [1, 1.07, 1], rotate: 0 } : { scale: 1, rotate: 0 }}
            transition={isNext ? { scale: { repeat: Infinity, duration: 1.6 }, delay: i * 0.05 } : { delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="absolute inset-[16%]">
              {hero && <ObjectArt scene={scene} obj={hero} silhouette={!done && !isNext} mood={hero.tags.emotion === 'sad' && done ? 'happy' : undefined} />}
            </span>
            {done && (
              <span className="absolute -bottom-3 -right-3 h-[70px] w-[70px]">
                <StarIcon />
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Праздник в конце тропинки. Пока не все уровни пройдены — приглушён и по касанию обещает праздник впереди. */}
      {finalePos && (
        <motion.button
          type="button"
          aria-label="праздник"
          data-testid="праздник"
          onPointerDown={(e) => {
            if (!e.isPrimary) return;
            if (complete) onFinale();
            else void say(['finale_wait']);
          }}
          className="cut absolute flex items-center justify-center rounded-full p-8 text-cream"
          style={{
            left: finalePos.x - FINALE_SIZE / 2,
            top: finalePos.y - FINALE_SIZE / 2,
            width: FINALE_SIZE,
            height: FINALE_SIZE,
            backgroundColor: complete ? 'var(--color-berry)' : 'var(--color-paper)',
            color: complete ? 'var(--color-cream)' : 'rgba(61,58,47,0.35)',
            outline: complete ? '10px solid var(--color-ochre)' : 'none',
            outlineOffset: 4,
            ['--cut-shadow' as string]: complete ? '#8e2c40' : undefined,
          }}
          initial={{ scale: 0 }}
          animate={complete ? { scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] } : { scale: 1 }}
          transition={complete ? { repeat: Infinity, duration: 1.8 } : { delay: scene.levels.length * 0.05, duration: 0.45 }}
        >
          <PartyIcon />
        </motion.button>
      )}

      {/* Вкладки сцен: герой сцены + название (ребёнок узнаёт сцену по картинке). Текущая — крупнее и с охряной обводкой. */}
      <div className="absolute left-[40px] top-[36px] flex items-center gap-5">
        <RoundButton label="альбом" onPress={onAlbum} size={130} tone="berry">
          <AlbumIcon />
        </RoundButton>
        {SCENES.map((s) =>
          s.id === scene.id ? (
            // Касание текущей вкладки — ещё раз рассказать историю сцены.
            <motion.button
              key={s.id}
              type="button"
              aria-label={`${s.title}: история`}
              data-testid="история"
              onPointerDown={(e) => {
                if (!e.isPrimary || !s.story) return;
                void say([s.story.intro]);
              }}
              className="paper flex h-[140px] items-center gap-4 rounded-full pl-4 pr-10 font-display text-[54px]"
              style={{ boxShadow: '0 8px 0 0 var(--color-paper-edge)', outline: '8px solid var(--color-ochre)', outlineOffset: 2 }}
              whileTap={{ scale: 0.96, y: 3 }}
            >
              <SceneHero scene={s} size={110} />
              {s.title}
            </motion.button>
          ) : (
            <motion.button
              key={s.id}
              type="button"
              aria-label={s.title}
              data-testid={`сцена ${s.id}`}
              onPointerDown={(e) => {
                if (!e.isPrimary) return;
                playSfx('whoosh');
                onScene(s.id);
              }}
              className="paper flex h-[130px] items-center gap-3 rounded-full pl-3 pr-8 font-display text-[46px]"
              style={{ boxShadow: '0 8px 0 0 var(--color-paper-edge)' }}
              whileTap={{ scale: 0.94, y: 4 }}
            >
              <SceneHero scene={s} size={104} />
              {s.title}
            </motion.button>
          ),
        )}
        {COMING.map((c) => (
          <div key={c.id} className="flex h-[80px] items-center gap-3 rounded-full bg-paper/55 px-7 font-display text-[36px] text-ink/45">
            <span className="h-9 w-9 text-ink/40">
              <ParentIcon />
            </span>
            {c.title}
          </div>
        ))}
      </div>

      <div className="absolute right-[40px] top-[36px]">
        <RoundButton label="для взрослых" onPress={onParent} size={130} tone="dusk">
          <ParentIcon />
        </RoundButton>
      </div>
    </div>
  );
}
