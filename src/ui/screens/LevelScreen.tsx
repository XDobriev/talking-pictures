import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Mood } from '../../art';
import { playSfx, say, stopVoice } from '../../audio';
import { PRAISE } from '../../data/phrases';
import { RageDetector, hintStage, hintThresholds } from '../../game/input';
import { resolveTargets } from '../../game/query';
import { riddleSteps } from '../../game/riddle';
import { markLevelDone, useStore } from '../../game/store';
import { track } from '../../game/telemetry';
import type { SceneDef, SceneObject, SfxName } from '../../game/types';
import { HoldButton } from '../Button';
import { FireflyFlight, FoundFlight, GhostHand } from '../Flights';
import { FireflyArt, HomeIcon } from '../icons';
import { Particles, type ParticleKind, type ParticlesHandle } from '../Particles';
import { SceneView, type Reaction } from '../SceneView';
import { TaskBar, slotCenter } from '../TaskBar';
import { WinOverlay } from '../WinOverlay';

const FIREFLY_COOLDOWN = 15000;
// Правый нижний угол: в нарисованных сценах он свободен (нижняя полоса — пустая трава).
const FIREFLY_POS = { x: 1770, y: 930 };
const ECHO_PAUSE = 2200;

const PARTICLE_FOR: Partial<Record<SfxName, ParticleKind>> = {
  rustle: 'leaves',
  drip: 'drops',
  sparkle: 'sparkles',
  bubble: 'bubbles',
};

interface Flight {
  key: number;
  obj: SceneObject;
  slot: number;
}

export function LevelScreen({
  scene,
  levelIndex,
  onHome,
  onNext,
  onReplay,
}: {
  scene: SceneDef;
  levelIndex: number;
  onHome(): void;
  onNext(): void;
  onReplay(): void;
}) {
  const { platform, save, update } = useStore();
  const level = scene.levels[levelIndex];
  const targets = useMemo(() => resolveTargets(scene, level), [scene, level]);
  const seq = level.mode === 'sequence';
  const promptKey = level.prompt ?? 'ask';

  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'finishing' | 'won'>('playing');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [moods, setMoods] = useState<Record<string, Mood>>(() =>
    Object.fromEntries(scene.objects.filter((o) => o.tags.emotion === 'sad').map((o) => [o.id, 'sad' as Mood])),
  );
  const [hint, setHint] = useState<0 | 1 | 2>(0);
  const [wiggleKey, setWiggleKey] = useState(0);
  const [firefly, setFirefly] = useState<{ key: number; target: SceneObject } | null>(null);
  const [fireflyReadyAt, setFireflyReadyAt] = useState(0);
  const [now, setNow] = useState(() => performance.now());
  const [showHand, setShowHand] = useState(() => !save.tutorialDone && levelIndex === 0);

  const lastActivity = useRef(performance.now());
  const promptPending = useRef(false);
  const currentRef = useRef(0);
  const foundRef = useRef(found);
  const particles = useRef<ParticlesHandle>(null);
  const rage = useRef(new RageDetector());
  const seqKey = useRef(0);
  const startedAt = useRef(performance.now());
  const settingsRef = useRef(save.settings);
  settingsRef.current = save.settings;

  /** Цели, которые засчитываются прямо сейчас. */
  const active = useMemo(() => {
    if (seq) {
      const t = targets[current];
      return t && !found.has(t.id) ? [t] : [];
    }
    return targets.filter((t) => !found.has(t.id));
  }, [seq, targets, current, found]);

  const promptFor = useCallback(
    (t: SceneObject | undefined) => (seq && t ? t.voice[promptKey] ?? t.voice.name : level.task),
    [seq, promptKey, level.task],
  );

  // Уровень «на слух»: загадка — настоящий звук, «Кто говорит: ква-ква?» голосом — только в подсказке (см. riddleSteps).
  const soundLevel = level.prompt === 'sound';
  const riddleKey = useRef(0);
  /** Проиграть загадку; новая загадка или находка отменяет недоигранную. */
  const playRiddle = useCallback(async (t: SceneObject, withVoice: boolean) => {
    const key = ++riddleKey.current;
    stopVoice();
    for (const step of riddleSteps(t, withVoice)) {
      if (key !== riddleKey.current) return false;
      if ('sfx' in step) await playSfx(step.sfx);
      else if (!(await say([step.say]))) return false;
    }
    return key === riddleKey.current;
  }, []);

  /** Повторить задание; withVoice — с подсказкой голосом (бездействие, касание слота, светлячок). */
  const sayPrompt = useCallback(
    (withVoice = false) => {
      const t = seq ? targets[currentRef.current] : undefined;
      if (soundLevel && t) return playRiddle(t, withVoice);
      return say([promptFor(t)]);
    },
    [seq, targets, promptFor, soundLevel, playRiddle],
  );

  const flushPrompt = useCallback(() => {
    if (!promptPending.current) return;
    promptPending.current = false;
    // Новое задание — отсчёт до подсказки заново. Иначе 12 с шли от касания, рассказ о находке их съедал,
    // и подсказка к новой загадке приходила через 3–4 с после неё.
    lastActivity.current = performance.now();
    void sayPrompt();
  }, [sayPrompt]);

  // ---- старт уровня ----
  useEffect(() => {
    platform.gameplayStart();
    track('level_start', { level: level.id });
    if (soundLevel) {
      // «Слушай внимательно! Кто так говорит?» → кваканье
      void say([level.task]).then((ok) => ok && playRiddle(targets[0], false));
    } else {
      const first = promptFor(targets[0]);
      void say(seq && level.task !== first ? [level.task, first] : [first]);
    }
    return () => {
      stopVoice();
      platform.gameplayStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- подсказки по бездействию ----
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const t = performance.now();
      setNow(t);
      const stage = hintStage(t - lastActivity.current, hintThresholds(level.query));
      setHint((prev) => {
        if (stage === prev) return prev;
        if (stage === 1) {
          setWiggleKey((k) => k + 1);
          void sayPrompt(true);
        }
        if (stage === 2) {
          setWiggleKey((k) => k + 1);
          if (soundLevel) void say(['hint_look']).then((ok) => ok && sayPrompt(true));
          else void say(['hint_look', promptFor(seq ? targets[currentRef.current] : undefined)]);
          track('hint_passive', { level: level.id });
        }
        return stage;
      });
    }, 500);
    return () => clearInterval(id);
  }, [phase, sayPrompt, promptFor, seq, targets, level.id, level.query, soundLevel]);

  const activity = () => {
    lastActivity.current = performance.now();
    riddleKey.current++; // любое касание отменяет недоигранную загадку: голос не вступит поверх нового звука
    if (hint) setHint(0);
  };

  const react = (o: SceneObject) => {
    if (!o.reaction) return;
    setReactions((r) => ({ ...r, [o.id]: { n: (r[o.id]?.n ?? 0) + 1, type: o.reaction! } }));
  };

  const win = useCallback(() => {
    setPhase('won');
    update((s) => markLevelDone(level.id, targets[0].id)(s));
    track('level_complete', { level: level.id, seconds: Math.round((performance.now() - startedAt.current) / 1000) });
    platform.gameplayStop();
    void say(['win', 'sticker']);
  }, [update, level.id, targets, platform]);

  const handleFound = (obj: SceneObject) => {
    const next = new Set(foundRef.current).add(obj.id);
    foundRef.current = next;
    setFound(next);
    track('target_found', { level: level.id, target: obj.id, seconds: Math.round((performance.now() - startedAt.current) / 1000) });
    if (showHand) {
      setShowHand(false);
      update((s) => ({ ...s, tutorialDone: true }));
    }
    const slot = targets.findIndex((t) => t.id === obj.id);
    setFlights((f) => [...f, { key: ++seqKey.current, obj, slot }]);
    playSfx(obj.sfx ?? 'pop');
    setTimeout(() => playSfx('chime'), 900);
    particles.current?.spawn('stars', obj.rect.x, obj.rect.y);

    const emotion = level.type === 'emotion';
    if (emotion) {
      setMoods((m) => ({ ...m, [obj.id]: 'happy' }));
      particles.current?.spawn('hearts', obj.rect.x, obj.rect.y - obj.rect.h / 2);
    }

    const v = obj.voice;
    const echo = v.echo ? (settingsRef.current.echoPause ? { id: v.echo, pauseAfter: ECHO_PAUSE } : v.echo) : null;
    const lines = [
      PRAISE[Math.floor(Math.random() * PRAISE.length)],
      v.name,
      ...(v.fact ? [v.fact] : []),
      ...(emotion && v.helped ? [v.helped] : []),
      ...(echo ? [echo] : []),
    ];

    const allDone = targets.every((t) => next.has(t.id));
    if (allDone) {
      setPhase('finishing');
      // Ждём, пока прозвучит рассказ о последней находке, но не дольше 12 с.
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        win();
      };
      void say(lines).then(finish);
      setTimeout(finish, 12000);
      return;
    }
    if (seq) {
      const nextIdx = targets.findIndex((t) => !next.has(t.id));
      currentRef.current = nextIdx;
      setCurrent(nextIdx);
      promptPending.current = true;
    }
    void say(lines).then((ok) => ok && flushPrompt());
  };

  const onObject = (obj: SceneObject, x: number, y: number) => {
    activity();
    if (phase !== 'playing') return;
    if (active.some((t) => t.id === obj.id)) return handleFound(obj);
    // Не та цель — не ошибка, а маленькое открытие: предмет называет себя.
    react(obj);
    playSfx(obj.sfx ?? 'pop');
    const kind = obj.sfx && PARTICLE_FOR[obj.sfx];
    if (kind && !obj.findable) particles.current?.spawn(obj.id === 'bush' ? 'butterflies' : kind, x, y);
    track('wrong_tap', { level: level.id, object: obj.id });
    void say([obj.voice.name]).then((ok) => ok && flushPrompt());
  };

  const onEmpty = (x: number, y: number) => {
    activity();
    if (rage.current.tap(performance.now())) {
      particles.current?.spawn('bubbles', x, y);
      [0, 120, 260, 420].forEach((d) => setTimeout(() => playSfx('bubble'), d));
    }
  };

  const onSlot = (t: SceneObject) => {
    activity();
    if (found.has(t.id)) return void say([t.voice.name, ...(t.voice.fact ? [t.voice.fact] : [])]);
    if (seq) return void sayPrompt(true);
    void say([t.voice.ask ?? level.task]);
  };

  const fireflyReady = now >= fireflyReadyAt;
  const onFirefly = () => {
    activity();
    const target = active[0];
    if (!target || !fireflyReady || phase !== 'playing') return;
    setFirefly({ key: ++seqKey.current, target });
    const t = performance.now();
    setFireflyReadyAt(t + FIREFLY_COOLDOWN);
    setNow(t);
    playSfx('sparkle');
    track('hint_used', { level: level.id, target: target.id });
    if (soundLevel) void say(['hint_firefly']).then((ok) => ok && playRiddle(target, true));
    else void say(['hint_firefly', promptFor(seq ? target : undefined)]);
    setTimeout(() => setFirefly((f) => (f?.target.id === target.id ? null : f)), 4700);
  };

  const pulse = useMemo(() => {
    const s = new Set<string>();
    if (hint === 2 && active[0]) s.add(active[0].id);
    if (firefly) s.add(firefly.target.id);
    return s;
  }, [hint, active, firefly]);

  const prefer = useMemo(() => new Set(active.map((t) => t.id)), [active]);
  const cooldown = Math.max(0, Math.min(1, (fireflyReadyAt - now) / FIREFLY_COOLDOWN));
  const handTarget = showHand && phase === 'playing' && found.size === 0 ? targets[0] : null;

  return (
    <div className="absolute inset-0" data-testid="level" data-level={level.id}>
      <SceneView
        scene={scene}
        found={found}
        pulse={pulse}
        prefer={prefer}
        moods={moods}
        reactions={reactions}
        disabled={phase !== 'playing'}
        onObject={onObject}
        onEmpty={onEmpty}
      />
      <Particles ref={particles} />

      <TaskBar
        scene={scene}
        targets={targets}
        found={found}
        current={seq ? current : -1}
        hideSilhouettes={level.hideSilhouettes}
        wiggleKey={wiggleKey}
        onSlot={onSlot}
      />

      {flights.map((f) => (
        <FoundFlight
          key={f.key}
          scene={scene}
          obj={f.obj}
          to={slotCenter(f.slot, targets.length)}
          mood={level.type === 'emotion' ? 'happy' : undefined}
        />
      ))}
      {firefly && <FireflyFlight key={firefly.key} from={FIREFLY_POS} target={firefly.target} />}
      {handTarget && <GhostHand from={slotCenter(0, targets.length)} target={handTarget} />}

      {/* Выход посреди уровня — только удержанием: случайное касание не уносит малыша в меню. */}
      <div className="absolute z-30" style={{ left: 18, top: 14 }}>
        <HoldButton label="домой" onPress={onHome} size={130} tone="paper">
          <HomeIcon />
        </HoldButton>
      </div>

      <div className="absolute z-30" style={{ left: FIREFLY_POS.x - 80, top: FIREFLY_POS.y - 80 }}>
        <motion.button
          type="button"
          aria-label="светлячок"
          data-testid="светлячок"
          onPointerDown={(e) => {
            if (!e.isPrimary) return;
            e.stopPropagation();
            onFirefly();
          }}
          className="relative h-[160px] w-[160px] rounded-full"
          animate={fireflyReady && hint > 0 ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ repeat: fireflyReady && hint > 0 ? Infinity : 0, duration: 1.2 }}
        >
          <span className="paper cut absolute inset-0 rounded-full" style={{ background: 'var(--color-dusk)', ['--cut-shadow' as string]: 'var(--color-dusk-deep)' }} />
          <svg viewBox="0 0 160 160" className="absolute inset-0">
            <circle
              cx={80}
              cy={80}
              r={72}
              fill="none"
              stroke="#fff3b0"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={452}
              strokeDashoffset={452 * cooldown}
              transform="rotate(-90 80 80)"
              opacity={cooldown > 0 ? 0.9 : 0}
            />
          </svg>
          <span className={`absolute inset-[18px] ${firefly ? 'opacity-0' : ''} ${cooldown > 0 ? 'opacity-40 grayscale' : ''}`} style={{ transition: 'opacity 300ms' }}>
            <FireflyArt glow={fireflyReady} />
          </span>
        </motion.button>
      </div>

      {phase === 'won' && (
        <WinOverlay
          scene={scene}
          sticker={targets[0]}
          hasNext={levelIndex < scene.levels.length - 1}
          onNext={onNext}
          onHome={onHome}
          onReplay={onReplay}
        />
      )}
    </div>
  );
}
