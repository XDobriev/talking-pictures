import type { SceneObject, SfxName } from './types';

export type RiddleStep = { sfx: SfxName } | { say: string };

/**
 * Загадка уровня «на слух»: сначала настоящий звук (узнать животное по голосу — слуховое внимание),
 * а голос рассказчицы «Кто говорит: ква-ква?» — только подсказкой: это образец звукоподражания,
 * который малыш может повторить (кваканье лягушки повторить нельзя, «ква-ква» за взрослым — можно).
 */
export function riddleSteps(t: SceneObject, withVoice: boolean): RiddleStep[] {
  const steps: RiddleStep[] = [{ sfx: t.sfx ?? 'pop' }];
  if (withVoice && t.voice.sound) steps.push({ say: t.voice.sound });
  return steps;
}
