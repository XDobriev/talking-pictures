import { describe, expect, it } from 'vitest';
import { SCENES } from '../data/scenes';
import { farm } from '../data/scenes/farm';
import { forest } from '../data/scenes/forest';
import { PHRASES } from '../data/phrases';
import type { SceneDef } from './types';
import { resolveTargets, validateScene } from './query';

const idsIn = (scene: SceneDef) => (levelId: string) =>
  resolveTargets(scene, scene.levels.find((l) => l.id === levelId)!).map((o) => o.id);

describe.each(SCENES.map((s) => [s.title, s] as const))('сцена «%s»: общие правила', (_, scene) => {
  it('размечена без ошибок', () => {
    expect(validateScene(scene)).toEqual([]);
  });

  it('цели не прячутся под кнопками «домой» и «светлячок»', () => {
    const overlaps = (o: SceneDef['objects'][number], x0: number, x1: number, y0: number, y1: number) =>
      o.rect.x - o.rect.w / 2 < x1 && o.rect.x + o.rect.w / 2 > x0 && o.rect.y - o.rect.h / 2 < y1 && o.rect.y + o.rect.h / 2 > y0;
    for (const o of scene.objects.filter((o) => o.findable)) {
      expect(overlaps(o, 87.5, 100, 78, 100), `${o.id} под светлячком`).toBe(false);
      expect(overlaps(o, 0, 8.5, 0, 14), `${o.id} под «домой»`).toBe(false);
    }
  });

  it('цели не залезают под панель заданий', () => {
    for (const o of scene.objects.filter((o) => o.findable)) {
      const underBar = o.rect.x > 27 && o.rect.x < 73 && o.rect.y + o.rect.h / 2 > 86;
      expect(underBar, o.id).toBe(false);
    }
  });

  it('декорации никогда не становятся целями', () => {
    for (const lvl of scene.levels) {
      for (const t of resolveTargets(scene, lvl)) expect(t.findable).toBe(true);
    }
  });

  it('все голосовые ключи есть в таблице фраз', () => {
    const missing: string[] = [];
    const has = (k?: string) => !k || k in PHRASES || missing.push(k);
    for (const o of scene.objects) {
      has(o.voice.name); has(o.voice.fact); has(o.voice.echo);
      has(o.voice.ask); has(o.voice.sound); has(o.voice.helped);
    }
    for (const l of scene.levels) has(l.task);
    expect(missing).toEqual([]);
  });

  it('в пошаговых уровнях у каждой цели есть фраза-задание', () => {
    for (const lvl of scene.levels.filter((l) => l.mode === 'sequence')) {
      for (const t of resolveTargets(scene, lvl)) {
        expect(t.voice[lvl.prompt ?? 'ask'], `${lvl.id}/${t.id}`).toBeTruthy();
      }
    }
  });

  it('в уровнях на эмоции у каждой цели есть фраза «пожалели»', () => {
    for (const lvl of scene.levels.filter((l) => l.type === 'emotion')) {
      for (const t of resolveTargets(scene, lvl)) expect(t.voice.helped, `${lvl.id}/${t.id}`).toBeTruthy();
    }
  });
});

describe('между сценами', () => {
  it('id объектов и уровней не повторяются (по ним выдаются наклейки и прогресс)', () => {
    const objIds = SCENES.flatMap((s) => s.objects.map((o) => o.id));
    const lvlIds = SCENES.flatMap((s) => s.levels.map((l) => l.id));
    expect(objIds.length).toBe(new Set(objIds).size);
    expect(lvlIds.length).toBe(new Set(lvlIds).size);
  });
});

describe('сцена «Лес»', () => {
  const ids = idsIn(forest);

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

  it('уровней хватает на 10+ минут (не меньше 10)', () => {
    expect(forest.levels.length).toBeGreaterThanOrEqual(10);
  });
});

describe('сцена «Ферма»', () => {
  const ids = idsIn(farm);

  it('не меньше 6 уровней (план MVP)', () => {
    expect(farm.levels.length).toBeGreaterThanOrEqual(6);
  });

  it('«кто кушает» — лошадка, коза, курочка', () => {
    expect(ids('farm_eat').sort()).toEqual(['goat', 'hen', 'horse']);
  });

  it('«овощи» — морковка, тыква, капуста, помидор (подсолнух — не овощ)', () => {
    expect(ids('farm_garden').sort()).toEqual(['cabbage', 'carrot', 'pumpkin', 'tomato']);
  });

  it('«всё красное» — яблочко, трактор, помидор', () => {
    expect(ids('farm_red').sort()).toEqual(['apple', 'tomato', 'tractor']);
  });

  it('«на заборе» — петушок и кошка', () => {
    expect(ids('farm_fence').sort()).toEqual(['cat', 'rooster']);
  });

  it('«кому грустно» — щенок и цыплёнок', () => {
    expect(ids('farm_sad').sort()).toEqual(['chick', 'dog']);
  });
});
