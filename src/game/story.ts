import { resolveTargets } from './query';
import type { Kind, LevelDef, SceneDef, SceneObject } from './types';

// История сцены: ради чего ребёнок ищет (у белочки праздник — собираем гостей).
// Завязка звучит один раз за сессию, пока в сцене не пройдено ни одного уровня;
// связка перед уровнем — пока он не пройден. Голоса немного: дети, которых всё время ведёт рассказчик, играют пассивнее.

const introHeard = new Set<string>();

export function sceneStarted(scene: SceneDef, completed: string[]) {
  return scene.levels.some((l) => completed.includes(l.id));
}

export function sceneComplete(scene: SceneDef, completed: string[]) {
  return scene.levels.every((l) => completed.includes(l.id));
}

/** Завязку сцены ещё не слышали в этой сессии — отметить и вернуть true. */
export function takeIntro(scene: SceneDef, completed: string[]) {
  if (!scene.story || sceneStarted(scene, completed) || introHeard.has(scene.id)) return false;
  introHeard.add(scene.id);
  return true;
}

/** Что сказать перед заданием уровня: завязку сцены, связку уровня или ничего. */
export function levelOpening(scene: SceneDef, level: LevelDef, completed: string[]): string[] {
  if (scene.story && takeIntro(scene, completed)) return [scene.story.intro];
  if (level.lead && !completed.includes(level.id)) return [level.lead];
  return [];
}

const GUEST_KINDS: Kind[] = ['animal', 'bird', 'insect', 'person', 'toy'];

/** Гости праздника: все живые герои (и игрушки) из заданий сцены, без повторов, в порядке появления. */
export function partyGuests(scene: SceneDef): SceneObject[] {
  const list = scene.story?.guests;
  if (Array.isArray(list)) return list.map((id) => scene.objects.find((o) => o.id === id)).filter((o): o is SceneObject => !!o);
  const seen = new Map<string, SceneObject>();
  const all = list === 'all';
  for (const l of scene.levels) for (const t of resolveTargets(scene, l)) if (all || GUEST_KINDS.includes(t.tags.kind)) seen.set(t.id, t);
  return [...seen.values()];
}

/** Для тестов: забыть, какие завязки уже звучали. */
export function resetStory() {
  introHeard.clear();
}
