import { Howl } from 'howler';
import { phraseText } from '../data/phrases';

// Голос рассказчика.
// 1) Если для фразы есть файл src/assets/voice/<id>.mp3 (или .ogg) — играем его.
// 2) Иначе — встроенный синтез речи браузера (временный голос прототипа).

const FILES = import.meta.glob('../assets/voice/*.{mp3,ogg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const voiceUrls = new Map<string, string[]>();
for (const [path, url] of Object.entries(FILES)) {
  const id = path.split('/').pop()!.replace(/\.\w+$/, '');
  voiceUrls.set(id, [...(voiceUrls.get(id) ?? []), url]);
}

export function hasRecordedVoice(id: string) {
  return voiceUrls.has(id);
}

let enabled = true;
let muted = false;
let generation = 0;
let current: Howl | null = null;
let ruVoice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices();
  const ru = voices.filter((v) => v.lang.toLowerCase().startsWith('ru'));
  // Предпочитаем «естественные» онлайн-голоса, если они есть в системе.
  ruVoice =
    ru.find((v) => /natural|neural|online/i.test(v.name) && /svetlana|dariya|female|ж/i.test(v.name)) ??
    ru.find((v) => /natural|neural|online/i.test(v.name)) ??
    ru.find((v) => /milena|irina|svetlana|google/i.test(v.name)) ??
    ru[0] ??
    null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function setVoiceEnabled(v: boolean) {
  enabled = v;
  if (!v) stopVoice();
}
export function setVoiceMuted(v: boolean) {
  muted = v;
  if (v) {
    current?.pause();
    if ('speechSynthesis' in window) speechSynthesis.pause();
  } else {
    current?.play();
    if ('speechSynthesis' in window) speechSynthesis.resume();
  }
}

export function stopVoice() {
  generation++;
  current?.stop();
  current?.unload();
  current = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function playFile(urls: string[], gen: number): Promise<void> {
  return new Promise((resolve) => {
    const h = new Howl({ src: urls, html5: false, volume: 1 });
    current = h;
    const done = () => {
      if (current === h) current = null;
      h.unload();
      resolve();
    };
    h.once('end', done);
    h.once('loaderror', done);
    h.once('playerror', done);
    if (gen === generation) h.play();
    else done();
  });
}

function speakSynth(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || !text) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    if (ruVoice) u.voice = ruVoice;
    u.rate = 0.88; // малышам — медленнее
    u.pitch = 1.15;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(guard);
      resolve();
    };
    // Страховка: в некоторых браузерах onend не приходит.
    const guard = setTimeout(finish, 1500 + text.length * 110);
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
  });
}

export interface SayOptions {
  /** Прервать то, что звучит сейчас (по умолчанию да). */
  interrupt?: boolean;
  /** Пауза после фразы, мс (эхо-приём: даём ребёнку повторить). */
  pauseAfter?: number;
}

/**
 * Произносит фразы по очереди. Промис разрешается, когда всё прозвучало
 * или когда очередь прервана следующим вызовом say()/stopVoice().
 */
export async function say(ids: (string | { id: string; pauseAfter?: number })[], opts: SayOptions = {}): Promise<boolean> {
  if (opts.interrupt !== false) stopVoice();
  const gen = generation;
  for (const item of ids) {
    const id = typeof item === 'string' ? item : item.id;
    const pauseAfter = typeof item === 'string' ? 0 : item.pauseAfter ?? 0;
    if (gen !== generation) return false;
    while (muted && gen === generation) await sleep(200);
    if (enabled) {
      const urls = voiceUrls.get(id);
      if (urls) await playFile(urls, gen);
      else await speakSynth(phraseText(id));
    }
    if (pauseAfter && gen === generation) await sleep(pauseAfter);
    else await sleep(120);
  }
  return gen === generation;
}
