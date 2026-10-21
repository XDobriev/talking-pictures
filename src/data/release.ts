import type { SceneDef } from '../game/types';

// Какие сцены видят игроки. В разработке (npm run dev / show) видны все сцены, в релизной сборке — только эти.
// Новая сцена приходит к игрокам обновлением: когда её фразы озвучены и проверены, её id добавляется сюда,
// поднимается версия и собирается новый архив (порядок — docs/releases.md).
export const RELEASE_SCENES = ['forest', 'farm', 'yard'];

/** Все голосовые фразы, которые звучат в сцене: имена и рассказы героев, задания, связки, история. */
export function scenePhrases(scene: SceneDef): Set<string> {
  const ids = new Set<string>();
  for (const o of scene.objects) for (const k of Object.values(o.voice)) if (k) ids.add(k);
  for (const l of scene.levels) {
    ids.add(l.task);
    if (l.lead) ids.add(l.lead);
    if (l.outro) ids.add(l.outro);
  }
  if (scene.story) ids.add(scene.story.intro).add(scene.story.finale);
  return ids;
}

/**
 * Фразы, без которых релиз не собрать: общие (приветствие, похвала, подсказки — их нет ни в одной сцене)
 * и фразы выпускаемых сцен. Фразы будущих сцен озвучиваются заранее, но релиз не держат.
 */
export function requiredPhrases(all: SceneDef[], phraseIds: string[], released = RELEASE_SCENES): string[] {
  const inScenes = new Set(all.flatMap((s) => [...scenePhrases(s)]));
  const needed = new Set(all.filter((s) => released.includes(s.id)).flatMap((s) => [...scenePhrases(s)]));
  return phraseIds.filter((id) => !inScenes.has(id) || needed.has(id));
}
