import type { SceneDef } from '../../game/types';
import { farm } from './farm';
import { forest } from './forest';
import { yard } from './yard';

export const SCENES: SceneDef[] = [forest, farm, yard];

export function getScene(id: string): SceneDef | undefined {
  return SCENES.find((s) => s.id === id);
}
