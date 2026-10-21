import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { muteFor, say, stopVoice, unlockAudio, unmuteFor } from './audio';
import { SCENES } from './data/scenes';
import { useStore } from './game/store';
import { track } from './game/telemetry';
import { AdOverlay, RotateOverlay } from './ui/Overlays';
import { StartScreen } from './ui/screens/StartScreen';
import { Stage } from './ui/Stage';

// Первому экрану нужен только StartScreen. Остальное — отдельными файлами: на бюджетном телефоне с 3G
// так стартовый экран появляется раньше, а догрузка идёт, пока ребёнок смотрит на кнопку «Играть».
const loadMenu = () => import('./ui/screens/MenuScreen');
const loadLevel = () => import('./ui/screens/LevelScreen');
const loadAlbum = () => import('./ui/screens/AlbumScreen');
const loadFinale = () => import('./ui/screens/FinaleScreen');
const loadGate = () => import('./ui/ParentGate');
const loadParent = () => import('./ui/ParentMenu');
const MenuScreen = lazy(() => loadMenu().then((m) => ({ default: m.MenuScreen })));
const LevelScreen = lazy(() => loadLevel().then((m) => ({ default: m.LevelScreen })));
const AlbumScreen = lazy(() => loadAlbum().then((m) => ({ default: m.AlbumScreen })));
const FinaleScreen = lazy(() => loadFinale().then((m) => ({ default: m.FinaleScreen })));
const ParentGate = lazy(() => loadGate().then((m) => ({ default: m.ParentGate })));
const ParentMenu = lazy(() => loadParent().then((m) => ({ default: m.ParentMenu })));
const DevInspector = lazy(() => import('./ui/DevInspector').then((m) => ({ default: m.DevInspector })));

type Screen = { name: 'start' } | { name: 'menu' } | { name: 'album' } | { name: 'finale' } | { name: 'level'; index: number; run: number };

export function App() {
  const { platform, save } = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'start' });
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
  const [overlay, setOverlay] = useState<null | 'gate' | 'parent'>(null);
  const [ad, setAd] = useState(false);

  // Системные паузы: вкладка, звонок, стартовая реклама площадки, окна покупок.
  useEffect(() => {
    platform.onPause(() => muteFor('pause'));
    platform.onResume(() => unmuteFor('pause'));
    platform.onAdState((showing) => {
      setAd(showing);
      if (showing) muteFor('ad');
      else unmuteFor('ad');
    });
    // Игра готова: стартовый экран с кнопкой «Играть» уже на месте (Game Ready, п. 1.19.2).
    platform.gameReady();
    track('session_start', { platform: platform.name, lang: platform.lang() });
    // Подгружаем остальные экраны заранее, сразу после первого кадра.
    const t = setTimeout(() => void Promise.all([loadLevel(), loadMenu(), loadAlbum(), loadFinale(), loadGate(), loadParent()]), 0);
    return () => clearTimeout(t);
  }, [platform]);

  const go = (s: Screen) => {
    stopVoice();
    setScreen(s);
  };

  const startLevel = async (index: number, withAd: boolean) => {
    // Реклама — только после неигрового действия («Дальше»), сразу, без задержки > 2 с (п. 4.4).
    if (withAd) {
      track('ad_shown', { kind: 'interstitial' });
      await platform.showInterstitial();
    }
    go({ name: 'level', index, run: Date.now() });
  };

  const onPlay = () => {
    unlockAudio();
    if (!save.tutorialDone) {
      void say(['welcome']);
      // Самый первый запуск — сразу в игру, без меню: малышу не нужно выбирать.
      setTimeout(() => setScreen({ name: 'level', index: 0, run: Date.now() }), 2600);
      return;
    }
    go({ name: 'menu' });
  };

  return (
    // reducedMotion="user": при системной настройке «меньше движения» framer-motion отключает
    // сдвиги и масштаб (полёт находки, пульс кнопок), оставляя плавное появление.
    <MotionConfig reducedMotion="user">
    <Stage>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen.name === 'level' ? `level-${screen.index}-${screen.run}` : screen.name === 'menu' ? `menu-${sceneId}` : screen.name}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {screen.name === 'start' && <StartScreen onPlay={onPlay} />}
          <Suspense fallback={null}>
          {screen.name === 'menu' && (
            <MenuScreen
              scene={scene}
              onScene={setSceneId}
              onLevel={(i) => void startLevel(i, false)}
              onParent={() => setOverlay('gate')}
              onAlbum={() => go({ name: 'album' })}
              onFinale={() => go({ name: 'finale' })}
            />
          )}
          {screen.name === 'album' && <AlbumScreen onHome={() => go({ name: 'menu' })} />}
          {screen.name === 'finale' && <FinaleScreen scene={scene} onHome={() => go({ name: 'menu' })} />}
          {screen.name === 'level' && (
            <LevelScreen
              scene={scene}
              levelIndex={screen.index}
              onHome={() => go({ name: 'menu' })}
              onReplay={() => void startLevel(screen.index, true)}
              onNext={() => void startLevel(Math.min(screen.index + 1, scene.levels.length - 1), true)}
              onFinale={() => go({ name: 'finale' })}
            />
          )}
          </Suspense>
        </motion.div>
      </AnimatePresence>

      <Suspense fallback={null}>
        {overlay === 'gate' && <ParentGate onCancel={() => setOverlay(null)} onPass={() => setOverlay('parent')} />}
        {overlay === 'parent' && <ParentMenu onClose={() => setOverlay(null)} />}
        {import.meta.env.DEV && <DevInspector scene={screen.name === 'level' ? scene : null} />}
      </Suspense>
      {ad && <AdOverlay mock={platform.name === 'mock'} />}
      <RotateOverlay />
    </Stage>
    </MotionConfig>
  );
}
