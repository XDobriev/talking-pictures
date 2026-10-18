import type { CSSProperties } from 'react';
import type { SceneDef, SceneObject } from '../game/types';
import { FOREST_SPRITES, ForestBackground, type Mood } from './forest';

// Реестр арта. Если в src/assets/scenes/<scene>/<name>.webp есть настоящая картинка —
// она автоматически заменяет векторную заглушку с тем же ключом (например 'forest/squirrel').
// Для эмоций: <name>_happy.webp — вариант «после утешения».

const IMAGES = import.meta.glob('../assets/scenes/**/*.{webp,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const imageByKey = new Map<string, string>();
for (const [path, url] of Object.entries(IMAGES)) {
  const m = path.match(/scenes\/(.+)\.(webp|png)$/);
  if (m) imageByKey.set(m[1], url);
}

export function hasImage(key: string) {
  return imageByKey.has(key);
}

/** Сцена нарисована одной картинкой и картинка есть в сборке. */
export function isBaked(scene: SceneDef) {
  return !!scene.baked && imageByKey.has(scene.background);
}

export function Sprite({ id, mood, className }: { id: string; mood?: Mood; className?: string }) {
  const img = (mood === 'happy' && imageByKey.get(`${id}_happy`)) || imageByKey.get(id);
  if (img) return <img src={img} alt="" draggable={false} className={`h-full w-full object-contain ${className ?? ''}`} />;
  const C = FOREST_SPRITES[id];
  if (!C) return <div className="h-full w-full rounded-full bg-berry/40" />;
  return (
    <div className={`h-full w-full [&>svg]:h-full [&>svg]:w-full ${className ?? ''}`}>
      <C mood={mood} />
    </div>
  );
}

/** CSS-кадрирование фона сцены по прямоугольнику объекта. */
export function cropStyle(bg: string, r: SceneObject['rect']): CSSProperties {
  const left = r.x - r.w / 2;
  const top = r.y - r.h / 2;
  return {
    backgroundImage: `url(${imageByKey.get(bg)})`,
    backgroundSize: `${(100 / r.w) * 100}% ${(100 / r.h) * 100}%`,
    backgroundPosition: `${r.w >= 100 ? 0 : (left / (100 - r.w)) * 100}% ${r.h >= 100 ? 0 : (top / (100 - r.h)) * 100}%`,
    backgroundRepeat: 'no-repeat',
  };
}

/**
 * Картинка героя для слотов, полёта, наклеек и меню.
 * В «запечённой» сцене — фрагмент фона в пропорциях объекта, иначе — спрайт.
 */
export function ObjectArt({ scene, obj, mood, className, silhouette }: { scene: SceneDef; obj: SceneObject; mood?: Mood; className?: string; silhouette?: boolean }) {
  if (isBaked(scene)) {
    const aspect = ((obj.rect.w / 100) * 1920) / ((obj.rect.h / 100) * 1080);
    return (
      <div className={`flex h-full w-full items-center justify-center ${className ?? ''}`}>
        <div
          className="max-h-full max-w-full rounded-[18%]"
          style={{
            ...cropStyle(scene.background, obj.rect),
            aspectRatio: aspect,
            width: aspect >= 1 ? '100%' : 'auto',
            height: aspect < 1 ? '100%' : 'auto',
            filter: silhouette ? 'grayscale(1) contrast(0.7) brightness(1.15) blur(1.5px)' : undefined,
            opacity: silhouette ? 0.5 : 1,
          }}
        />
      </div>
    );
  }
  return (
    <div className={`h-full w-full ${className ?? ''}`} style={silhouette ? { filter: 'brightness(0)', opacity: 0.32 } : undefined}>
      <Sprite id={obj.sprite} mood={mood} />
    </div>
  );
}

export function SceneBackground({ id }: { id: string }) {
  const img = imageByKey.get(id);
  // Растягиваем точно по холсту (а не cover), чтобы кадрирование героев совпадало пиксель в пиксель.
  if (img) return <div className="absolute inset-0" style={{ backgroundImage: `url(${img})`, backgroundSize: '100% 100%' }} />;
  if (id === 'forest/bg') return <ForestBackground />;
  return <div className="absolute inset-0 bg-moss" />;
}
