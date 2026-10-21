import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCENES } from '../data/scenes';
import { resolveTargets } from './query';
import { riddleSteps } from './riddle';

describe('загадка на слух', () => {
  const frog = SCENES.flatMap((s) => s.objects).find((o) => o.id === 'frog')!;

  it('новая загадка: тук-тук → «Кто там?» → настоящий звук; голос «ква-ква» — только подсказкой, без стука', () => {
    expect(riddleSteps(frog, false)).toEqual([{ sfx: 'knock' }, { say: 'who_there' }, { sfx: 'croak' }]);
    expect(riddleSteps(frog, true)).toEqual([{ sfx: 'croak' }, { say: 'frog_sound' }]);
  });

  it('стук — настоящая запись', () => {
    expect(existsSync('src/assets/sfx/knock.mp3')).toBe(true);
  });

  for (const scene of SCENES)
    for (const level of scene.levels.filter((l) => l.prompt === 'sound')) {
      const targets = resolveTargets(scene, level);

      it(`${level.id}: у каждой цели — настоящая запись, а не синтез`, () => {
        for (const t of targets) expect(existsSync(`src/assets/sfx/${t.sfx}.mp3`), `${t.id}: ${t.sfx}`).toBe(true);
      });

      it(`${level.id}: звуки целей не повторяются — у загадки один ответ`, () => {
        const sfx = targets.map((t) => t.sfx);
        expect(new Set(sfx).size, sfx.join(', ')).toBe(sfx.length);
      });

      it(`${level.id}: у каждой цели есть фраза-звукоподражание для подсказки`, () => {
        for (const t of targets) expect(t.voice.sound, t.id).toBeTruthy();
      });
    }

  it('гусь гогочет, а не крякает', () => {
    const goose = SCENES.flatMap((s) => s.objects).find((o) => o.id === 'goose')!;
    expect(goose.sfx).toBe('honk');
  });
});
