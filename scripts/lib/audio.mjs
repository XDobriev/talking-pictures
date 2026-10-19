// Общие утилиты обработки голоса для scripts/voice.mjs и scripts/voice-qa.mjs.
import { Mp3Encoder } from '@breezystack/lamejs';

export const RATE = 24000;

/** RMS по кадрам 20 мс. */
function frameRms(pcm, rate) {
  const frame = Math.round(rate * 0.02);
  const n = Math.floor(pcm.length / frame);
  const out = new Float64Array(n);
  for (let f = 0; f < n; f++) {
    let s = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) s += pcm[i] * pcm[i];
    out[f] = Math.sqrt(s / frame);
  }
  return { rms: out, frame };
}

/**
 * Обрезать тишину по краям с порогом от уровня шума записи, оставить 90 мс «воздуха»,
 * нормализовать пик до −1 дБ. Работает и для шёпота (порог адаптивный).
 */
export function polish(pcm, rate = RATE) {
  const { rms, frame } = frameRms(pcm, rate);
  if (!rms.length) return pcm;
  const sorted = [...rms].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const peakRms = sorted[Math.floor(sorted.length * 0.95)];
  const thr = Math.max(floor * 2.5, peakRms * 0.06, 120);
  let a = 0;
  let b = rms.length - 1;
  while (a < b && rms[a] < thr) a++;
  while (b > a && rms[b] < thr) b--;
  const pad = Math.round(rate * 0.09);
  const cut = pcm.slice(Math.max(0, a * frame - pad), Math.min(pcm.length, (b + 1) * frame + pad));
  let peak = 1;
  for (const s of cut) peak = Math.max(peak, Math.abs(s));
  const gain = Math.min(4, (32767 * 0.89) / peak);
  const out = new Int16Array(cut.length);
  for (let i = 0; i < cut.length; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(cut[i] * gain)));
  // 15 мс плавного входа/выхода — без щелчков
  const fade = Math.round(rate * 0.015);
  for (let i = 0; i < fade && i < out.length; i++) {
    out[i] = Math.round((out[i] * i) / fade);
    out[out.length - 1 - i] = Math.round((out[out.length - 1 - i] * i) / fade);
  }
  return out;
}

/** «Вес» фразы для оценки её длительности: буквы, слоги через дефис читаются медленнее, паузы на знаках. */
export function phraseWeight(text) {
  const letters = (text.match(/[а-яёa-z]/gi) ?? []).length;
  const hyphens = (text.match(/-/g) ?? []).length;
  const stops = (text.match(/[.,:!?—]/g) ?? []).length;
  return letters + hyphens * 3 + stops * 2 + 4;
}

/**
 * Разрезать запись пачки на фразы. Кандидаты в разрезы — паузы ≥ 160 мс; из них динамическим
 * программированием выбираются N−1 так, чтобы паузы были длинными, а длительность каждой фразы —
 * близкой к ожидаемой по её весу. Так «Скажи: у-точ-ка» не рвётся по внутренней паузе, даже если
 * модель где-то сделала паузу между фразами короче. null — если пауз меньше, чем нужно.
 */
export function splitPhrases(pcm, weights, rate = RATE) {
  const n = weights.length;
  if (n === 1) return [pcm];
  const { rms, frame } = frameRms(pcm, rate);
  const loud = Array.from(rms, (v) => v > 420);
  const first = loud.indexOf(true);
  const last = loud.lastIndexOf(true) + 1;
  if (first < 0) return null;
  const gaps = [];
  for (let f = first, start = -1; f <= last; f++) {
    const silent = f < last && !loud[f];
    if (silent && start < 0) start = f;
    if (!silent && start >= 0) {
      if (f - start >= 8) gaps.push({ start, end: f, len: f - start });
      start = -1;
    }
  }
  if (gaps.length < n - 1) return null;

  // единица времени на «вес»: всё звучание минус n−1 самых длинных пауз (это межфразовые, если модель послушалась)
  const longest = [...gaps].sort((a, b) => b.len - a.len).slice(0, n - 1).reduce((s, g) => s + g.len, 0);
  const unit = (last - first - longest) / weights.reduce((s, w) => s + w, 0);
  // на синтетических пачках (склейка настоящих фраз, 5% «торопливых» пауз) — 298/300 верных против 231/300 у «самых длинных пауз»
  const segCost = (k, from, to) => Math.log(Math.max(1, to - from) / (unit * weights[k])) ** 2;
  const gapScore = (g) => Math.log(g.len);

  // dp[k][j] — лучшая стоимость, если k-й разрез (k = 1..n−1) стоит в паузе j
  const G = gaps.length;
  const dp = Array.from({ length: n }, () => new Float64Array(G).fill(Infinity));
  const from = Array.from({ length: n }, () => new Int32Array(G).fill(-1));
  for (let j = 0; j < G; j++) dp[1][j] = segCost(0, first, gaps[j].start) - gapScore(gaps[j]);
  for (let k = 2; k < n; k++)
    for (let j = k - 1; j < G; j++)
      for (let i = k - 2; i < j; i++) {
        const c = dp[k - 1][i] + segCost(k - 1, gaps[i].end, gaps[j].start) - gapScore(gaps[j]);
        if (c < dp[k][j]) {
          dp[k][j] = c;
          from[k][j] = i;
        }
      }
  let best = Infinity;
  let j = -1;
  for (let i = n - 2; i < G; i++) {
    const c = dp[n - 1][i] + segCost(n - 1, gaps[i].end, last);
    if (c < best) [best, j] = [c, i];
  }
  const chosen = [];
  for (let k = n - 1; k >= 1; k--) {
    chosen.unshift(gaps[j]);
    j = from[k][j];
  }
  const cuts = chosen.map((g) => Math.round(((g.start + g.end) / 2) * frame));
  const parts = [];
  let prev = 0;
  for (const c of [...cuts, pcm.length]) {
    parts.push(pcm.slice(prev, c));
    prev = c;
  }
  return parts;
}

export function toMp3(pcm, rate = RATE) {
  const enc = new Mp3Encoder(1, rate, 64);
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (out.length) chunks.push(Buffer.from(out));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

/** Нормализация текста для сравнения расшифровки с ожидаемой фразой. */
export function normText(s) {
  return s
    .toLowerCase()
    .replace(/́|\+/g, '')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Похожесть строк 0..1 (Левенштейн). */
export function similarity(a, b) {
  if (!a && !b) return 1;
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m][n] / Math.max(m, n);
}
