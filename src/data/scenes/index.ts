import type { SceneDef } from '../../game/types';
import { forest } from './forest';

export const SCENES: SceneDef[] = [forest];

export function getScene(id: string): SceneDef | undefined {
  return SCENES.find((s) => s.id === id);
}
