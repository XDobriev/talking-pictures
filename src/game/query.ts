import type { LevelDef, SceneDef, SceneObject, TaskQuery } from './types';

export const MAX_TARGETS = 7;

export function matchesQuery(obj: SceneObject, q: TaskQuery): boolean {
  if (!obj.findable) return false;
  if (q.ids && !q.ids.includes(obj.id)) return false;
  const t = obj.tags;
  if (q.kind) {
    const kinds = Array.isArray(q.kind) ? q.kind : [q.kind];
    if (!kinds.includes(t.kind)) return false;
  }
  if (q.color && t.color !== q.color) return false;
  if (q.size && t.size !== q.size) return false;
  if (q.action && t.action !== q.action) return false;
  if (q.place && t.place !== q.place) return false;
  if (q.emotion && t.emotion !== q.emotion) return false;
  if (q.says && t.says !== q.says) return false;
  return true;
}

/** Цели уровня в стабильном порядке (как в описании сцены). */
export function resolveTargets(scene: SceneDef, level: LevelDef): SceneObject[] {
  const all = scene.objects.filter((o) => matchesQuery(o, level.query));
  // Явный список ids задаёт порядок слотов.
  if (level.query.ids) {
    all.sort((a, b) => level.query.ids!.indexOf(a.id) - level.query.ids!.indexOf(b.id));
  }
  const limit = Math.min(level.count ?? all.length, MAX_TARGETS);
  return all.slice(0, limit);
}

/** Проверка сцены на ошибки разметки — используется в тестах и dev-режиме. */
export function validateScene(scene: SceneDef): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const o of scene.objects) {
    if (ids.has(o.id)) errors.push(`дубликат id: ${o.id}`);
    ids.add(o.id);
    if (!/^[a-z0-9_]+$/.test(o.id)) errors.push(`id только латиницей: ${o.id}`);
    const { x, y, w, h } = o.rect;
    if (x - w / 2 < 0 || x + w / 2 > 100 || y - h / 2 < 0 || y + h / 2 > 100) {
      errors.push(`${o.id}: выходит за холст`);
    }
    if (o.findable && (w < 6.5 || h < 8)) {
      errors.push(`${o.id}: цель меньше минимума 6.5%×8% (${w}×${h})`);
    }
  }
  for (const lvl of scene.levels) {
    const targets = resolveTargets(scene, lvl);
    if (targets.length === 0) errors.push(`${lvl.id}: нет ни одной цели`);
    if (lvl.count && targets.length < lvl.count) {
      errors.push(`${lvl.id}: нужно ${lvl.count} целей, найдено ${targets.length}`);
    }
  }
  return errors;
}
