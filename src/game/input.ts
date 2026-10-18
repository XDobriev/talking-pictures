import type { Rect, SceneObject } from './types';

/** Беспорядочное тапанье: больше `limit` касаний в пустоту за `windowMs`. */
export class RageDetector {
  private taps: number[] = [];
  constructor(
    private limit = 4,
    private windowMs = 2000,
  ) {}
  /** Регистрирует касание; true — пора пускать пузыри. */
  tap(now: number): boolean {
    this.taps = this.taps.filter((t) => now - t < this.windowMs);
    this.taps.push(now);
    if (this.taps.length > this.limit) {
      this.taps = [];
      return true;
    }
    return false;
  }
}

export const HINT_WIGGLE_MS = 12000;
export const HINT_PULSE_MS = 25000;

/** Ступень пассивной подсказки по времени бездействия. */
export function hintStage(idleMs: number): 0 | 1 | 2 {
  if (idleMs >= HINT_PULSE_MS) return 2;
  if (idleMs >= HINT_WIGGLE_MS) return 1;
  return 0;
}

/** Хитбокс шире видимого спрайта на 28% и не меньше 52 CSS px на реальном экране. */
export function hitRect(r: Rect, stageScale: number, stageW = 1920, stageH = 1080): Rect {
  const minWPct = (52 / stageScale / stageW) * 100;
  const minHPct = (52 / stageScale / stageH) * 100;
  return {
    x: r.x,
    y: r.y,
    w: Math.max(r.w * 1.28, minWPct),
    h: Math.max(r.h * 1.28, minHPct),
  };
}

export function inside(r: Rect, px: number, py: number) {
  return Math.abs(px - r.x) <= r.w / 2 && Math.abs(py - r.y) <= r.h / 2;
}

/**
 * Что под пальцем. Приоритет: ближайшая к центру цель из `preferIds`,
 * затем самый верхний (по z) интерактивный объект, затем ближайший по центру.
 */
export function pickObject(
  objects: SceneObject[],
  px: number,
  py: number,
  stageScale: number,
  preferIds: Set<string>,
): SceneObject | null {
  const hits = objects.filter((o) => inside(hitRect(o.rect, stageScale), px, py));
  if (!hits.length) return null;
  const dist = (o: SceneObject) => Math.hypot((px - o.rect.x) / o.rect.w, (py - o.rect.y) / o.rect.h);
  const preferred = hits.filter((o) => preferIds.has(o.id));
  if (preferred.length) return preferred.sort((a, b) => dist(a) - dist(b))[0];
  // Мелкие объекты поверх крупных декораций: сначала z, потом площадь, потом расстояние.
  return hits.sort(
    (a, b) => (b.z ?? 0) - (a.z ?? 0) || a.rect.w * a.rect.h - b.rect.w * b.rect.h || dist(a) - dist(b),
  )[0];
}
