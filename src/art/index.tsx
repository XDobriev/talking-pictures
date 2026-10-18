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

export function SceneBackground({ id }: { id: string }) {
  const img = imageByKey.get(id);
  if (img) return <img src={img} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />;
  if (id === 'forest/bg') return <ForestBackground />;
  return <div className="absolute inset-0 bg-moss" />;
}
