import { describe, expect, it } from 'vitest';
import { evening } from '../data/scenes/evening';
import { forest } from '../data/scenes/forest';
import { RageDetector, hintStage, hintThresholds, hitRect, pickObject } from './input';

describe('RageDetector', () => {
  it('срабатывает на 5-м касании в пустоту за 2 секунды', () => {
    const r = new RageDetector();
    expect([0, 300, 600, 900].map((t) => r.tap(t))).toEqual([false, false, false, false]);
    expect(r.tap(1200)).toBe(true);
  });
  it('не срабатывает на редких касаниях', () => {
    const r = new RageDetector();
    expect([0, 700, 1400, 2100, 2800, 3500].some((t) => r.tap(t))).toBe(false);
  });
});

describe('hintStage', () => {
  it('0 → 12 с качание → 25 с пульсация', () => {
    expect(hintStage(5000)).toBe(0);
    expect(hintStage(12000)).toBe(1);
    expect(hintStage(25000)).toBe(2);
  });

  it('принимает свои пороги: на цветовых уровнях первая подсказка раньше', () => {
    const t = hintThresholds({ color: 'red' });
    expect(t.wiggle).toBe(8000);
    expect(hintStage(7900, t)).toBe(0);
    expect(hintStage(8000, t)).toBe(1);
    expect(hintStage(24000, t)).toBe(1);
    expect(hintStage(25000, t)).toBe(2);
  });

  it('без цвета в задании — обычные 12 с', () => {
    expect(hintThresholds({ kind: 'animal' }).wiggle).toBe(12000);
    expect(hintStage(8000, hintThresholds({ kind: 'animal' }))).toBe(0);
  });
});

describe('hitRect', () => {
  it('расширяет на 28%', () => {
    const r = hitRect({ x: 50, y: 50, w: 10, h: 10 }, 1);
    expect(r.w).toBeCloseTo(12.8);
  });
  it('на маленьком экране держит минимум 52 px', () => {
    const scale = 0.3; // телефон: холст 576×324 px
    const r = hitRect({ x: 50, y: 50, w: 1, h: 1 }, scale);
    expect(r.w * 1920 * scale / 100).toBeCloseTo(52);
  });
});

describe('pickObject', () => {
  it('палец на рисунке соседней цели — это сосед, а не искомая цель с широким хитбоксом', () => {
    const tb = evening.objects.find((o) => o.id === 'toothbrush')!;
    const soap = evening.objects.find((o) => o.id === 'soap')!;
    // левый край щётки уже в расширенном хитбоксе мыла, но ещё не в самом мыле
    expect(pickObject(evening.objects, tb.rect.x - 0.8, tb.rect.y, 0.5, new Set(['soap']))?.id).toBe('toothbrush');
    expect(pickObject(evening.objects, soap.rect.x, soap.rect.y, 0.5, new Set(['soap']))?.id).toBe('soap');
  });
  it('в центре белочки находит белочку, а не берёзу', () => {
    const o = pickObject(forest.objects, 26.5, 21.5, 0.5, new Set());
    expect(o?.id).toBe('squirrel');
  });
  it('цель задания приоритетнее соседей', () => {
    // божья коровка сидит на пеньке — касание по пеньку рядом с коровкой
    const o = pickObject(forest.objects, 50, 52, 0.5, new Set(['ladybug']));
    expect(o?.id).toBe('ladybug');
  });
  it('пустое небо — ничего', () => {
    expect(pickObject(forest.objects, 45, 4, 0.5, new Set())).toBeNull();
  });
});
