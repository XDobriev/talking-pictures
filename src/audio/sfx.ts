import type { SfxName } from '../game/types';

// Процедурные звуки на Web Audio — запасной вариант.
// Настоящие записи лежат в src/assets/sfx/<name>.mp3 (scripts/sfx.mjs, CC0) и подхватываются автоматически.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let muted = false;

export function audioCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  return ctx;
}

/** Вызывать из обработчика первого касания: браузеры не дают звук без жеста. */
export function unlockSfx() {
  const c = audioCtx();
  if (c && c.state !== 'running') void c.resume();
}

/** iOS Safari переводит контекст в interrupted после звонка/блокировки — будим явно. */
export function resumeSfx() {
  if (ctx && ctx.state !== 'running') void ctx.resume();
}

export function setSfxEnabled(v: boolean) {
  enabled = v;
}
export function setSfxMuted(v: boolean) {
  muted = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.9, ctx.currentTime, 0.05);
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, peak = 0.3, delay = 0) {
  const c = ctx!;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  env(g, t, peak, Math.min(0.02, dur / 4), dur);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, filterFreq: number, q = 1, peak = 0.25, delay = 0, type: BiquadFilterType = 'bandpass') {
  const c = ctx!;
  const t = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterFreq;
  f.Q.value = q;
  const g = c.createGain();
  env(g, t, peak, 0.03, dur);
  src.connect(f).connect(g).connect(master!);
  src.start(t);
  src.stop(t + dur + 0.05);
}

/** Трель/вибрато — для птиц и кваканья. */
function warble(f: number, rate: number, depth: number, dur: number, type: OscillatorType, peak: number, delay = 0) {
  const c = ctx!;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = f;
  lfo.frequency.value = rate;
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain).connect(o.frequency);
  env(g, t, peak, 0.02, dur);
  o.connect(g).connect(master!);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

const SYNTH: Record<SfxName, () => void> = {
  pop: () => tone('sine', 520, 1100, 0.12, 0.35),
  chime: () => {
    [880, 1320, 1760].forEach((f, i) => tone('sine', f, f, 0.9, 0.12, i * 0.07));
  },
  sparkle: () => {
    [1568, 2093, 2637, 3136].forEach((f, i) => tone('triangle', f, f * 1.01, 0.35, 0.06, i * 0.06));
  },
  rustle: () => {
    noise(0.35, 3200, 0.8, 0.18);
    noise(0.25, 5200, 0.8, 0.1, 0.12);
  },
  squeak: () => {
    tone('square', 1800, 2600, 0.07, 0.05);
    tone('square', 1900, 2800, 0.07, 0.05, 0.1);
  },
  hoot: () => {
    tone('sine', 420, 380, 0.35, 0.3);
    tone('sine', 420, 360, 0.5, 0.3, 0.45);
  },
  quack: () => {
    warble(300, 30, 60, 0.18, 'sawtooth', 0.12);
    warble(280, 30, 60, 0.2, 'sawtooth', 0.12, 0.25);
  },
  croak: () => {
    warble(140, 18, 40, 0.25, 'square', 0.1);
    warble(130, 18, 40, 0.3, 'square', 0.1, 0.32);
  },
  buzz: () => warble(220, 90, 20, 0.6, 'sawtooth', 0.06),
  tweet: () => {
    tone('sine', 2400, 3600, 0.08, 0.12);
    tone('sine', 2600, 3800, 0.08, 0.12, 0.12);
    tone('sine', 2200, 3400, 0.1, 0.12, 0.24);
  },
  drip: () => {
    tone('sine', 1400, 600, 0.12, 0.2);
    tone('sine', 1300, 500, 0.12, 0.16, 0.3);
  },
  bubble: () => {
    tone('sine', 300, 900, 0.1, 0.25);
    tone('sine', 400, 1200, 0.08, 0.18, 0.12);
  },
  whoosh: () => noise(0.4, 900, 0.6, 0.15, 0, 'lowpass'),
  grunt: () => {
    tone('triangle', 160, 110, 0.22, 0.25);
    noise(0.15, 400, 1, 0.08);
  },
  // --- ферма: грубые наброски, голос всё равно называет звукоподражание ---
  moo: () => warble(150, 5, 8, 0.9, 'sawtooth', 0.08),
  bark: () => {
    for (const d of [0, 0.2]) {
      tone('square', 520, 300, 0.09, 0.1, d);
      noise(0.08, 900, 1, 0.12, d);
    }
  },
  meow: () => {
    tone('triangle', 600, 950, 0.18, 0.18);
    tone('triangle', 950, 520, 0.35, 0.18, 0.17);
  },
  baa: () => warble(420, 8, 45, 0.6, 'sawtooth', 0.07),
  bleat: () => warble(520, 11, 60, 0.5, 'sawtooth', 0.07),
  peep: () => {
    tone('sine', 3000, 3400, 0.07, 0.1);
    tone('sine', 3000, 3400, 0.07, 0.1, 0.15);
  },
  cluck: () => {
    [0, 0.12, 0.24].forEach((d) => tone('square', 720, 460, 0.05, 0.07, d));
  },
  neigh: () => warble(760, 13, 140, 0.7, 'sawtooth', 0.05),
  crow: () => {
    tone('sawtooth', 520, 820, 0.18, 0.07);
    tone('sawtooth', 820, 860, 0.25, 0.07, 0.2);
    tone('sawtooth', 860, 480, 0.4, 0.07, 0.47);
  },
};

const FILES = import.meta.glob('../assets/sfx/*.{mp3,ogg,wav}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const fileFor = (name: string) =>
  Object.entries(FILES).find(([p]) => p.split('/').pop()!.replace(/\.\w+$/, '') === name)?.[1];
// Только Web Audio: HTML <audio> вызывает системный плеер браузера — частая причина отказа (п. 1.6.1.6 / 1.6.2.5).
const bufferCache = new Map<string, Promise<AudioBuffer | null>>();

function loadBuffer(c: AudioContext, url: string) {
  let p = bufferCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((b) => c.decodeAudioData(b))
      .catch(() => null);
    bufferCache.set(url, p);
  }
  return p;
}

export function playSfx(name: SfxName) {
  if (!enabled || muted) return;
  const c = audioCtx();
  if (!c || !master) return;
  if (c.state !== 'running') void c.resume();
  const url = fileFor(name);
  if (url) {
    void loadBuffer(c, url).then((buf) => {
      if (!buf || muted) return;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(master!);
      src.start();
    });
    return;
  }
  try {
    SYNTH[name]();
  } catch {
    /* звук не критичен для игры */
  }
}
