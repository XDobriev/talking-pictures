import type { SceneObject, SfxName } from './types';

export type RiddleStep = { sfx: SfxName } | { say: string };

/**
 * Загадка уровня «на слух»: сначала настоящий звук (узнать животное по голосу — слуховое внимание),
 * а голос рассказчицы «Кто говорит: ква-ква?» — только подсказкой: это образец звукоподражания,
 * который малыш может повторить (кваканье лягушки повторить нельзя, «ква-ква» за взрослым — можно).
 *
 * Новая загадка начинается со стука: «тук-тук» → «Кто там?» → голос животного. Ожидание за дверью держит
 * внимание (так устроена Peekaboo Barn), а «Кто там?» — короткая фраза, которую ребёнок быстро подхватывает сам.
 * Подсказка повторяет загадку без стука, чтобы не затягивать.
 */
export function riddleSteps(t: SceneObject, withVoice: boolean): RiddleStep[] {
  const sound: RiddleStep = { sfx: t.sfx ?? 'pop' };
  if (!withVoice) return [{ sfx: 'knock' }, { say: 'who_there' }, sound];
  return t.voice.sound ? [sound, { say: t.voice.sound }] : [sound];
}
