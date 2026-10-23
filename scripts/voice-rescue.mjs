// Спасение забракованных пачек озвучки без новых запросов: сырой звук пачки лежит в voice/raw/batch-*.pcm (+ .json со
// списком фраз), а voice.mjs отбрасывает его целиком, если паузы не дали разрезать на фразы (≈ 40% запросов 22–23.10).
// Здесь разрез ищется по смыслу: запись делится на куски по всем паузам, каждый кусок расшифровывает Whisper
// (на компьютере, без лимитов), и куски собираются в фразы так, чтобы текст каждой группы был ближе всего к своей фразе.
// Фраза с совпадением от 80% сохраняется; дальше её, как и любую новую, проверяют voice-lint и voice-qa.
//
//   node scripts/voice-rescue.mjs [--dry] [--only=batch-123,batch-456] [--all]
//   --dry — только показать, что получилось бы; --all — и уже разобранные пачки (реестр voice/raw/rescued.txt)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import { pipeline } from '@huggingface/transformers';
import { PHRASES } from '../src/data/phrases.ts';
import { normText, polish, similarity, toMp3, RATE } from './lib/audio.mjs';

const RAW = 'voice/raw';
const DIR = 'src/assets/voice';
const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.replace(/^--/, '').split('=')[0], a.split('=')[1] ?? true]));
const DONE = `${RAW}/rescued.txt`;
const done = new Set(existsSync(DONE) ? readFileSync(DONE, 'utf8').split(/\s+/).filter(Boolean) : []);
const only = args.only ? new Set(String(args.only).split(',')) : null;

const batches = readdirSync(RAW)
  .filter((f) => /^batch-\d+\.json$/.test(f))
  .map((f) => f.replace(/\.json$/, ''))
  .filter((b) => existsSync(`${RAW}/${b}.pcm`) && (!only || only.has(b)) && (args.all || only || !done.has(b)))
  .map((b) => ({ b, ids: JSON.parse(readFileSync(`${RAW}/${b}.json`, 'utf8')) }))
  // нужна хоть одна фраза, которой ещё нет в игре (и которая не удалена из текстов)
  .filter(({ ids }) => ids.some((id) => PHRASES[id] && !existsSync(`${DIR}/${id}.mp3`)));
if (!batches.length) {
  console.log('Нечего спасать: в сохранённых пачках нет неозвученных фраз.');
  process.exit(0);
}

const asr = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-large-v3-turbo', { dtype: 'q8' });

/** Куски речи между паузами ≥ 100 мс (кадры 10 мс, речь — не тише пика −35 дБ). Время — в отсчётах 24 кГц. */
function pieces(pcm) {
  const n = RATE / 100;
  const db = [];
  for (let i = 0; i + n <= pcm.length; i += n) {
    let s = 0;
    for (let k = i; k < i + n; k++) s += pcm[k] * pcm[k];
    db.push(10 * Math.log10(s / n + 1e-9));
  }
  const peak = Math.max(...db);
  const out = [];
  let start = -1;
  let quiet = 0;
  for (let f = 0; f <= db.length; f++) {
    if (f < db.length && db[f] > peak - 35) {
      if (start < 0) start = f;
      quiet = 0;
    } else if (start >= 0 && (++quiet >= 10 || f === db.length)) {
      const end = f - quiet + 1;
      if (end - start >= 6) out.push({ a: start * n, b: end * n });
      start = -1;
      quiet = 0;
    }
  }
  return out;
}

/** Кусок 24 кГц int16 → 16 кГц float32 для Whisper (с 100 мс запаса по краям). */
function to16k(pcm, a, b) {
  const pad = RATE / 10;
  const seg = pcm.subarray(Math.max(0, a - pad), Math.min(pcm.length, b + pad));
  const buf = execFileSync(ffmpeg, ['-v', 'error', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', '-', '-ar', '16000', '-f', 'f32le', '-'], {
    input: Buffer.from(seg.buffer, seg.byteOffset, seg.byteLength),
    maxBuffer: 64 << 20,
  });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
}

// Сравниваем без пробелов, дефисов и повторов букв: «бе лоч ка» из трёх кусков = «бе-лоч-ка»
const squash = (s) => normText(s).replace(/ /g, '').replace(/(\p{L})\1+/gu, '$1');

let saved = 0;
for (const { b, ids } of batches) {
  const buf = readFileSync(`${RAW}/${b}.pcm`);
  const pcm = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
  const P = pieces(pcm);
  const heard = [];
  for (const p of P) heard.push((await asr(to16k(pcm, p.a, p.b), { language: 'russian', task: 'transcribe' })).text.trim());

  // Разбиение кусков 0..P−1 на ids.length групп подряд; куски до первой и после последней группы — лишние (допускаются).
  // dp[k][j] — лучшая сумма совпадений, если первые k фраз заняли куски до j (не включая).
  const K = ids.length;
  const want = ids.map((id) => squash(PHRASES[id]?.text ?? ''));
  const MAXG = 8; // фраза — не больше 8 кусков
  const score = (k, i, j) => similarity(want[k], squash(heard.slice(i, j).join(' ')));
  const dp = Array.from({ length: K + 1 }, () => new Float64Array(P.length + 1).fill(-Infinity));
  const from = Array.from({ length: K + 1 }, () => new Int32Array(P.length + 1).fill(-1));
  for (let j = 0; j <= P.length; j++) dp[0][j] = 0; // лишние куски в начале
  for (let k = 1; k <= K; k++)
    for (let j = 1; j <= P.length; j++)
      for (let i = Math.max(0, j - MAXG); i < j; i++) {
        // между фразами допускаем один лишний кусок (модель иногда вставляет вздох или «эм»)
        for (const skip of [0, 1]) {
          const prev = i - skip;
          if (prev < 0 || dp[k - 1][prev] === -Infinity) continue;
          const v = dp[k - 1][prev] + score(k - 1, i, j) - skip * 0.1;
          if (v > dp[k][j]) {
            dp[k][j] = v;
            from[k][j] = i * 2 + skip;
          }
        }
      }
  let j = 0;
  for (let x = 0; x <= P.length; x++) if (dp[K][x] > dp[K][j]) j = x;
  const groups = [];
  for (let k = K; k >= 1; k--) {
    const i = from[k][j] >> 1;
    groups.unshift({ i, j });
    j = i - (from[k][j] & 1);
  }

  console.log(`\n${b}: ${K} фраз, ${P.length} кусков`);
  groups.forEach(({ i, j }, k) => {
    const id = ids[k];
    const got = heard.slice(i, j).join(' ');
    const sim = score(k, i, j);
    const need = PHRASES[id] && !existsSync(`${DIR}/${id}.mp3`);
    const ok = sim >= 0.8;
    console.log(`${ok ? '✓' : '✗'} ${id.padEnd(18)} ${(sim * 100).toFixed(0).padStart(3)}%  «${got}»${need ? '' : '  (уже есть)'}`);
    if (!ok || !need || args.dry) return;
    // края — середина паузы до соседнего куска (не больше 300 мс), дальше polish() обрежет тишину сам
    const a = Math.max(0, P[i].a - Math.min(RATE * 0.3, i > 0 ? (P[i].a - P[i - 1].b) / 2 : RATE * 0.3));
    const e = Math.min(pcm.length, P[j - 1].b + Math.min(RATE * 0.3, j < P.length ? (P[j].a - P[j - 1].b) / 2 : RATE * 0.3));
    writeFileSync(`${DIR}/${id}.mp3`, toMp3(polish(pcm.slice(a, e))));
    // как writeVoice в voice.mjs: старый оригинал выравнивания — не про эту запись
    if (existsSync(`voice/raw/level-orig/${id}.mp3`)) unlinkSync(`voice/raw/level-orig/${id}.mp3`);
    saved++;
  });
  if (!args.dry) done.add(b);
}
if (!args.dry) writeFileSync(DONE, [...done].sort().join('\n') + '\n');
console.log(`\nИтог: пачек ${batches.length}, спасено фраз ${saved}${args.dry ? ' (--dry: ничего не записано)' : ' — проверят voice-lint и voice-qa (--unverified)'}.`);
