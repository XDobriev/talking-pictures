import { audioCtx } from './sfx';

// Тихая фоновая музыка: генеративная «музыкальная шкатулка» на пентатонике.
// Громкость ~0.25 от звуков, как в плане. Будет заменена записанным треком (src/assets/music/*.mp3).

const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // до-ре-ми-соль-ля-до
let enabled = true;
let muted = false;
let running = false;
let gain: GainNode | null = null;
let timer: number | null = null;
let step = 0;

const VOLUME = 0.05;

function pluck(f: number, when: number) {
  const c = audioCtx()!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'triangle';
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.5, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
  o.connect(g).connect(gain!);
  o.start(when);
  o.stop(when + 1.7);
}

function tick() {
  const c = audioCtx();
  if (!c || !gain || !running) return;
  // Медленная мелодия с паузами: не утомляет и не мешает голосу.
  const pattern = [0, 2, 4, -1, 3, 2, 0, -1, 1, 3, 5, -1, 4, 2, 1, -1];
  const n = pattern[step % pattern.length];
  if (n >= 0) pluck(NOTES[n] / (step % 32 < 16 ? 1 : 2), c.currentTime + 0.02);
  if (step % 4 === 0) pluck(NOTES[0] / 4, c.currentTime + 0.02);
  step++;
}

function apply() {
  const c = audioCtx();
  if (!c || !gain) return;
  const on = enabled && !muted && running;
  gain.gain.setTargetAtTime(on ? VOLUME : 0, c.currentTime, 0.4);
}

export function startMusic() {
  const c = audioCtx();
  if (!c) return;
  if (!gain) {
    gain = c.createGain();
    gain.gain.value = 0;
    gain.connect(c.destination);
  }
  if (!running) {
    running = true;
    timer = window.setInterval(tick, 650);
  }
  apply();
}

export function stopMusic() {
  running = false;
  if (timer) clearInterval(timer);
  timer = null;
  apply();
}

export function setMusicEnabled(v: boolean) {
  enabled = v;
  apply();
}

/** Приглушить на время голоса/рекламы/паузы. */
export function setMusicMuted(v: boolean) {
  muted = v;
  apply();
}
