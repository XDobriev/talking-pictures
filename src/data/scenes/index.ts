import type { SceneDef } from '../../game/types';
import { evening } from './evening';
import { farm } from './farm';
import { forest } from './forest';
import { kitchen } from './kitchen';
import { yard } from './yard';

// «Вечер» — последним: спокойный финал игры («Спокойной ночи!»).
export const SCENES: SceneDef[] = [forest, farm, yard, kitchen, evening];

export function getScene(id: string): SceneDef | undefined {
  return SCENES.find((s) => s.id === id);
}
