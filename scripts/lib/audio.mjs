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
