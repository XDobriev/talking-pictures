import { describe, expect, it } from 'vitest';
import { SCENES } from '../data/scenes';
import { defaultSpot } from './album';
import { resolveTargets } from './query';

describe('альбом наклеек', () => {
  it('все наклейки всех сцен по умолчанию лежат на экране', () => {
    const stickers = new Set(SCENES.flatMap((s) => s.levels.map((l) => resolveTargets(s, l)[0].id)));
    for (let i = 0; i < stickers.size + 10; i++) {
      const p = defaultSpot(i);
      expect(p.x, `x #${i}`).toBeGreaterThanOrEqual(5);
      expect(p.x, `x #${i}`).toBeLessThanOrEqual(95);
      expect(p.y, `y #${i}`).toBeGreaterThanOrEqual(22);
      expect(p.y, `y #${i}`).toBeLessThanOrEqual(92);
    }
  });
});
