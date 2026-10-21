import type { SceneDef } from '../../game/types';
import { RELEASE_SCENES } from '../release.ts';
import { evening } from './evening.ts';
import { farm } from './farm.ts';
import { forest } from './forest.ts';
import { kitchen } from './kitchen.ts';
import { yard } from './yard.ts';

// Импорты с расширением .ts: этот модуль читает и scripts/zip.mjs (Node без сборщика).

// «Вечер» — последним: спокойный финал игры («Спокойной ночи!»).
export const ALL_SCENES: SceneDef[] = [forest, farm, yard, kitchen, evening];

// В релизной сборке — только выпущенные сцены (src/data/release.ts); в разработке и тестах — все.
export const SCENES: SceneDef[] = import.meta.env?.PROD ? ALL_SCENES.filter((s) => RELEASE_SCENES.includes(s.id)) : ALL_SCENES;

export function getScene(id: string): SceneDef | undefined {
  return SCENES.find((s) => s.id === id);
}
