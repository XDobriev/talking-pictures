import { beforeEach, describe, expect, it } from 'vitest';
import { PHRASES } from '../data/phrases';
import { SCENES } from '../data/scenes';
import { levelOpening, partyGuests, resetStory, sceneComplete, takeIntro, untakeIntro } from './story';

const has = (id: string) => id in PHRASES;

describe('история сцен', () => {
  it('свой список гостей праздника — только существующие объекты сцены', () => {
    for (const s of SCENES) {
      const list = s.story?.guests;
      if (Array.isArray(list)) expect(partyGuests(s).map((o) => o.id), s.id).toEqual(list);
    }
  });

  beforeEach(resetStory);

  it('у каждой сцены есть завязка и финал из таблицы фраз', () => {
    for (const s of SCENES) {
      expect(s.story, s.id).toBeDefined();
      expect(has(s.story!.intro), s.story!.intro).toBe(true);
      expect(has(s.story!.finale), s.story!.finale).toBe(true);
    }
  });

  it('связки уровней есть в таблице фраз; без связки — только уровни, которые открывает завязка', () => {
    for (const s of SCENES)
      s.levels.forEach((l, i) => {
        if (l.lead) expect(has(l.lead), l.lead).toBe(true);
        else expect(i, l.id).toBe(0);
      });
  });

  it('новая сцена начинается с завязки, и только один раз', () => {
    const s = SCENES[0];
    expect(levelOpening(s, s.levels[0], [])).toEqual([s.story!.intro]);
    expect(levelOpening(s, s.levels[0], [])).toEqual([]);
    expect(levelOpening(s, s.levels[1], [])).toEqual([s.levels[1].lead]);
  });

  it('завязка, услышанная в меню, не повторяется в уровне', () => {
    const s = SCENES[0];
    expect(takeIntro(s, [])).toBe(true);
    expect(levelOpening(s, s.levels[1], [])).toEqual([s.levels[1].lead]);
  });

  it('завязка, не прозвучавшая в меню (ушли раньше), сыграет в следующий раз', () => {
    const s = SCENES[0];
    expect(takeIntro(s, [])).toBe(true);
    untakeIntro(s);
    expect(takeIntro(s, [])).toBe(true);
  });

  it('пройденный уровень начинается сразу с задания', () => {
    const s = SCENES[0];
    const done = [s.levels[0].id, s.levels[1].id];
    expect(levelOpening(s, s.levels[1], done)).toEqual([]);
    expect(levelOpening(s, s.levels[2], done)).toEqual([s.levels[2].lead]);
  });

  it('сцена пройдена, только когда пройдены все уровни', () => {
    const s = SCENES[0];
    const ids = s.levels.map((l) => l.id);
    expect(sceneComplete(s, ids.slice(1))).toBe(false);
    expect(sceneComplete(s, ids)).toBe(true);
  });

  it('на праздник приходят живые герои без повторов, овощей и ягод нет', () => {
    for (const s of SCENES.filter((s) => !s.story?.guests || s.story.guests === 'living')) {
      const g = partyGuests(s);
      expect(g.length, s.id).toBeGreaterThanOrEqual(8);
      expect(new Set(g.map((o) => o.id)).size).toBe(g.length);
      expect(g.some((o) => ['plant', 'vegetable', 'mushroom', 'thing'].includes(o.tags.kind))).toBe(false);
    }
  });
});
