import { describe, expect, it } from 'vitest';
import { forest } from '../data/scenes/forest';
import { PHRASES } from '../data/phrases';
import { resolveTargets, validateScene } from './query';

const ids = (levelId: string) =>
  resolveTargets(forest, forest.levels.find((l) => l.id === levelId)!).map((o) => o.id);

describe('сцена «Лес»', () => {
  it('размечена без ошибок', () => {
    expect(validateScene(forest)).toEqual([]);
  });

  it('пошаговый уровень сохраняет порядок ids', () => {
    expect(ids('forest_who1')).toEqual(['squirrel', 'hedgehog', 'bunny']);
  });

  it('«кто спит» находит сову, ёжика и лису', () => {
    expect(ids('forest_sleep').sort()).toEqual(['fox', 'hedgehog', 'owl']);
  });

  it('«всё красное» — 4 цели', () => {
    expect(ids('forest_red').sort()).toEqual(['amanita', 'ladybug', 'rowan', 'strawberry']);
  });

  it('«всё жёлтое» — синичка, пчёлка, уточка, улитка', () => {
    expect(ids('forest_yellow').sort()).toEqual(['bee', 'duck', 'snail', 'tit']);
  });

  it('«в пруду» — уточка, лягушка, рыбка', () => {
    expect(ids('forest_pond').sort()).toEqual(['duck', 'fish', 'frog']);
  });

  it('«на дереве» берёт только зверей и птиц', () => {
    expect(ids('forest_tree').sort()).toEqual(['owl', 'squirrel', 'tit']);
  });

  it('цели не прячутся под кнопками «домой» и «светлячок»', () => {
    const overlaps = (o: (typeof forest.objects)[number], x0: number, x1: number, y0: number, y1: number) =>
      o.rect.x - o.rect.w / 2 < x1 && o.rect.x + o.rect.w / 2 > x0 && o.rect.y - o.rect.h / 2 < y1 && o.rect.y + o.rect.h / 2 > y0;
    for (const o of forest.objects.filter((o) => o.findable)) {
      expect(overlaps(o, 87.5, 100, 78, 100), `${o.id} под светлячком`).toBe(false);
      expect(overlaps(o, 0, 8.5, 0, 14), `${o.id} под «домой»`).toBe(false);
    }
  });

  it('уровней хватает на 10+ минут (не меньше 10)', () => {
    expect(forest.levels.length).toBeGreaterThanOrEqual(10);
  });

  it('декорации никогда не становятся целями', () => {
    for (const lvl of forest.levels) {
      for (const t of resolveTargets(forest, lvl)) expect(t.findable).toBe(true);
    }
  });

  it('все голосовые ключи есть в таблице фраз', () => {
    const missing: string[] = [];
    const has = (k?: string) => !k || k in PHRASES || missing.push(k);
    for (const o of forest.objects) {
      has(o.voice.name); has(o.voice.fact); has(o.voice.echo);
      has(o.voice.ask); has(o.voice.sound); has(o.voice.helped);
    }
    for (const l of forest.levels) has(l.task);
    expect(missing).toEqual([]);
  });

  it('в пошаговых уровнях у каждой цели есть фраза-задание', () => {
    for (const lvl of forest.levels.filter((l) => l.mode === 'sequence')) {
      for (const t of resolveTargets(forest, lvl)) {
        expect(t.voice[lvl.prompt ?? 'ask'], `${lvl.id}/${t.id}`).toBeTruthy();
      }
    }
  });

  it('цели не залезают под панель заданий', () => {
    for (const o of forest.objects.filter((o) => o.findable)) {
      const underBar = o.rect.x > 27 && o.rect.x < 73 && o.rect.y + o.rect.h / 2 > 86;
      expect(underBar, o.id).toBe(false);
    }
  });
});
