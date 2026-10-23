import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PHRASES } from '../data/phrases';
import { scenePhrases } from '../data/release';
import { ALL_SCENES } from '../data/scenes';
import { resolveTargets } from './query';

const dups = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);
const imageExists = (key: string) => ['webp', 'png'].some((ext) => existsSync(new URL(`../assets/scenes/${key}.${ext}`, import.meta.url)));

describe('данные всех сцен', () => {
  it('в игре есть сцены, и у каждой есть уровни и объекты', () => {
    expect(ALL_SCENES.length).toBeGreaterThan(0);
    for (const s of ALL_SCENES) {
      expect(s.levels.length, `${s.id}: нет уровней`).toBeGreaterThan(0);
      expect(s.objects.length, `${s.id}: нет объектов`).toBeGreaterThan(0);
    }
  });

  it('id сцен, уровней и объектов уникальны (в сцене и во всей игре)', () => {
    expect(dups(ALL_SCENES.map((s) => s.id)), 'сцены').toEqual([]);
    expect(dups(ALL_SCENES.flatMap((s) => s.levels.map((l) => l.id))), 'уровни').toEqual([]);
    for (const s of ALL_SCENES) expect(dups(s.objects.map((o) => o.id)), `объекты ${s.id}`).toEqual([]);
  });

  it('цель каждого уровня существует среди объектов сцены', () => {
    for (const s of ALL_SCENES) {
      const ids = new Set(s.objects.map((o) => o.id));
      for (const l of s.levels) {
        for (const id of l.query.ids ?? []) expect(ids.has(id), `${s.id}/${l.id}: нет объекта ${id}`).toBe(true);
        for (const id of Object.keys(l.asks ?? {})) expect(ids.has(id), `${s.id}/${l.id}: asks для несуществующего ${id}`).toBe(true);
        if (l.icon) expect(ids.has(l.icon), `${s.id}/${l.id}: значок ${l.icon}`).toBe(true);
        const targets = resolveTargets(s, l);
        expect(targets.length, `${s.id}/${l.id}: нет целей`).toBeGreaterThan(0);
        if (l.count) expect(targets.length, `${s.id}/${l.id}: целей меньше count`).toBe(l.count);
      }
      for (const id of s.story?.guests && Array.isArray(s.story.guests) ? s.story.guests : []) {
        expect(ids.has(id), `${s.id}: гость ${id}`).toBe(true);
      }
    }
  });

  it('все фразы сцен (task, lead, outro, asks, голоса объектов, история) есть в таблице фраз', () => {
    for (const s of ALL_SCENES) for (const id of scenePhrases(s)) expect(id in PHRASES, `${s.id}: нет фразы ${id}`).toBe(true);
  });

  it('вопросы пошаговых уровней: у каждой цели есть своя фраза-подсказка', () => {
    for (const s of ALL_SCENES)
      for (const l of s.levels) {
        if (l.mode !== 'sequence') continue;
        for (const t of resolveTargets(s, l)) {
          const key = l.asks?.[t.id] ?? (l.prompt === 'sound' ? t.voice.sound : t.voice.ask);
          expect(key, `${s.id}/${l.id}: у ${t.id} нет фразы-подсказки`).toBeTruthy();
          expect(key! in PHRASES, `${s.id}/${l.id}: ${key}`).toBe(true);
        }
      }
  });

  it('уровни «на слух» имеют звук: у каждой цели есть голос звука', () => {
    for (const s of ALL_SCENES)
      for (const l of s.levels) {
        if (l.type !== 'sound' && l.prompt !== 'sound') continue;
        for (const t of resolveTargets(s, l)) {
          expect(t.voice.sound, `${s.id}/${l.id}: у ${t.id} нет voice.sound`).toBeTruthy();
          expect(t.sfx, `${s.id}/${l.id}: у ${t.id} нет sfx`).toBeTruthy();
        }
      }
  });

  it('картинки: фон каждой сцены лежит в src/assets/scenes; «запечённая» сцена без фона невозможна', () => {
    for (const s of ALL_SCENES) {
      expect(imageExists(s.background), `${s.id}: нет картинки ${s.background}`).toBe(true);
      if (!s.baked) for (const o of s.objects) expect(imageExists(o.sprite), `${s.id}: нет спрайта ${o.sprite}`).toBe(true);
    }
  });
});
