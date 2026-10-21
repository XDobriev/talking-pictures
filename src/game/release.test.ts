import { describe, expect, it } from 'vitest';
import released from '../../release-ids.json';
import { PHRASES } from '../data/phrases';
import { RELEASE_SCENES, requiredPhrases, scenePhrases } from '../data/release';
import { ALL_SCENES } from '../data/scenes';

describe('релизы и обновления', () => {
  it('выпускаемые сцены существуют', () => {
    for (const id of RELEASE_SCENES) expect(ALL_SCENES.some((s) => s.id === id), id).toBe(true);
  });

  it('уже выпущенные уровни и герои не пропали — у игроков по ним сохранён прогресс и наклейки', () => {
    const levels = new Set(ALL_SCENES.flatMap((s) => s.levels.map((l) => l.id)));
    const objects = new Set(ALL_SCENES.flatMap((s) => s.objects.map((o) => o.id)));
    expect(released.levels.filter((id: string) => !levels.has(id))).toEqual([]);
    expect(released.objects.filter((id: string) => !objects.has(id))).toEqual([]);
  });

  it('релиз требует общие фразы и фразы выпускаемых сцен, но не фразы будущих', () => {
    const all = Object.keys(PHRASES);
    const req = new Set(requiredPhrases(ALL_SCENES, all, ['forest']));
    expect(req.has('welcome')).toBe(true); // общая
    expect(req.has('squirrel_name')).toBe(true); // лес выпускается
    expect(req.has('kettle_name')).toBe(false); // кухня — нет
    expect(req.has('girl_name')).toBe(false); // девочка есть только во дворе и на кухне
  });

  it('фраза, общая для выпущенной и будущей сцены, нужна релизу', () => {
    const req = new Set(requiredPhrases(ALL_SCENES, Object.keys(PHRASES), ['yard']));
    expect(req.has('girl_name')).toBe(true);
  });

  it('все фразы сцен есть в таблице', () => {
    for (const s of ALL_SCENES) for (const id of scenePhrases(s)) expect(id in PHRASES, `${s.id}: ${id}`).toBe(true);
  });
});
