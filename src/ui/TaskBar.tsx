import { motion } from 'framer-motion';
import { ObjectArt } from '../art';
import type { SceneDef, SceneObject } from '../game/types';

// Панель заданий: бумажная полоска внизу по центру со слотами-силуэтами.
// Геометрия задана в пикселях холста, чтобы полёт находки в слот считался без замеров DOM.

export const SLOT = 136;
export const SLOT_GAP = 22;
export const BAR_Y = 1080 - 36 - SLOT / 2 - 14; // центр слотов; 36 px до края — мимо полоски Home

export function slotCenter(i: number, n: number) {
  const x = 960 + (i - (n - 1) / 2) * (SLOT + SLOT_GAP);
  return { x, y: BAR_Y };
}

interface Props {
  scene: SceneDef;
  targets: SceneObject[];
  found: Set<string>;
  /** Индекс текущей цели в пошаговом режиме (иначе -1). */
  current: number;
  hideSilhouettes?: boolean;
  /** Перезапуск «желейного» покачивания силуэтов (подсказка 12 с). */
  wiggleKey: number;
  onSlot(target: SceneObject): void;
}

export function TaskBar({ scene, targets, found, current, hideSilhouettes, wiggleKey, onSlot }: Props) {
  const n = targets.length;
  const width = n * SLOT + (n - 1) * SLOT_GAP + 56;
  return (
    <div
      className="paper absolute z-30 rounded-[44px]"
      style={{
        left: 960 - width / 2,
        top: BAR_Y - SLOT / 2 - 14,
        width,
        height: SLOT + 28,
        boxShadow: '0 10px 0 0 var(--color-paper-edge), 0 18px 30px -10px rgba(30,25,15,0.45)',
      }}
      data-testid="taskbar"
    >
      {targets.map((t, i) => {
        const c = slotCenter(i, n);
        const isFound = found.has(t.id);
        const isCurrent = i === current && !isFound;
        return (
          <button
            key={t.id}
            type="button"
            aria-label={`слот ${t.id}`}
            data-slot={t.id}
            onPointerDown={(e) => {
              if (!e.isPrimary) return;
              e.stopPropagation();
              onSlot(t);
            }}
            className="absolute rounded-[34px]"
            style={{
              left: c.x - (960 - width / 2) - SLOT / 2,
              top: 14,
              width: SLOT,
              height: SLOT,
              background: isFound ? '#fffaf0' : 'rgba(61,58,47,0.08)',
              outline: isCurrent ? '6px solid var(--color-ochre)' : '3px dashed rgba(61,58,47,0.22)',
              outlineOffset: isCurrent ? 2 : -8,
              transition: 'outline-color 300ms, background 300ms',
            }}
          >
            {isFound ? (
              <motion.div
                className="absolute inset-[10px]"
                initial={{ scale: 1.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <ObjectArt scene={scene} obj={t} mood={t.tags.emotion === 'sad' ? 'happy' : undefined} />
              </motion.div>
            ) : !hideSilhouettes ? (
              <div key={wiggleKey} className={`absolute inset-[14px] ${wiggleKey ? 'jelly' : ''}`}>
                <ObjectArt scene={scene} obj={t} silhouette />
              </div>
            ) : (
              <div key={wiggleKey} className={`absolute inset-0 flex items-center justify-center font-display text-[84px] text-ink/35 ${wiggleKey ? 'jelly' : ''}`}>
                ?
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
