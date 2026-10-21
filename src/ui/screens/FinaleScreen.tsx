import { useEffect, useMemo } from 'react';
import { SceneBackground } from '../../art';
import { say } from '../../audio';
import { partyGuests } from '../../game/story';
import { track } from '../../game/telemetry';
import type { SceneDef } from '../../game/types';
import { RoundButton } from '../Button';
import { HeroParade, paradeDuration } from '../HeroParade';
import { HomeIcon } from '../icons';
import { fireConfetti } from '../WinOverlay';

// Финал сцены: все герои из её заданий собираются на праздник и танцуют. Это цель истории сцены
// («у белочки праздник — собираем гостей»), видимая в конце тропинки. Героев можно трогать — они называют себя.

const STEP = 0.26;

export function FinaleScreen({ scene, onHome }: { scene: SceneDef; onHome(): void }) {
  const guests = useMemo(() => partyGuests(scene), [scene]);

  useEffect(() => {
    track('finale_open', { scene: scene.id });
    const stops: (() => void)[] = [];
    const timers = [0, 1, 2].map((i) => setTimeout(() => stops.push(fireConfetti()), paradeDuration(guests.length, STEP) - 1200 + i * 3200));
    const voice = setTimeout(() => scene.story && void say([scene.story.finale]), 400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(voice);
      stops.forEach((s) => s());
    };
  }, [scene, guests.length]);

  return (
    <div className="absolute inset-0" data-testid="finale">
      <div className="absolute inset-0 brightness-[0.95] saturate-[0.9]">
        <SceneBackground id={scene.background} />
      </div>
      {/* Темнее, чем в меню: те же герои нарисованы на фоне, взгляд должен остаться на празднике. */}
      <div className="absolute inset-0 bg-night/55" />
      <div className="absolute inset-x-0 bottom-[70px] top-[200px] flex items-center justify-center">
        <HeroParade scene={scene} heroes={guests} size={guests.length > 12 ? 170 : 200} width={1600} step={STEP} />
      </div>
      <div className="absolute z-30" style={{ left: 40, top: 36 }}>
        <RoundButton label="домой" onPress={onHome} size={130} tone="paper">
          <HomeIcon />
        </RoundButton>
      </div>
    </div>
  );
}
