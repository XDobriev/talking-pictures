// Вторая расшифровка — без интернета и лимитов: Whisper (открытая модель распознавания речи) прямо на компьютере.
// Две роли:
//   1) второе мнение к voice-qa.mjs (Gemini): расслышал заметно другое (< 72%) — фраза идёт в «послушать» (voice/suspect.txt);
//   2) --verify: запасная проверка, когда Gemini перегружен или кончился лимит — непроверенный файл с совпадением
//      от 85% (строже, чем у Gemini) записывается в voice/verified.txt. Удаляет брак только Gemini.
// Модель скачивается один раз в node_modules/@huggingface/transformers/.cache. ~12 с на фразу.
// Реестр — voice/whispered.txt (id:размер файла — переозвученный файл проверится заново).
//
//   node scripts/voice-whisper.mjs [--verify]            — ещё не проверенные Whisper, отчёт voice/whisper.tsv
//   --all | --only=id1,id2 | --only=voice/new.txt        — заново все / только эти
//   --model=onnx-community/whisper-small                 — другая модель (по умолчанию large-v3-turbo)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import { pipeline } from '@huggingface/transformers';
import { PHRASES } from '../src/data/phrases.ts';
import { normText, similarity } from './lib/audio.mjs';

const DIR = 'src/assets/voice';
const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.replace(/^--/, '').split('=')[0], a.split('=')[1] ?? true]));
const verified = new Set(existsSync('voice/verified.txt') ? readFileSync('voice/verified.txt', 'utf8').split(/\s+/).filter(Boolean) : []);
const only = args.only
  ? new Set((existsSync(args.only) ? readFileSync(args.only, 'utf8').split(/\s+/) : String(args.only).split(',')).filter(Boolean))
  : null;
const DONE = 'voice/whispered.txt';
const done = new Set(existsSync(DONE) ? readFileSync(DONE, 'utf8').split(/\s+/).filter(Boolean) : []);
const key = (id) => `${id}:${statSync(`${DIR}/${id}.mp3`).size}`;
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.mp3'))
  .map((f) => f.replace(/\.mp3$/, ''))
  .filter((id) => PHRASES[id] && (!only || only.has(id)) && (args.all || only || !done.has(key(id))));
if (!files.length) {
  console.log('Нечего проверять: все файлы уже проверены Whisper.');
  process.exit(0);
}

// large-v3-turbo: small путал «на пеньке» → «на пинке», «Светлячок» → «Светлечок» (23.10), turbo — нет
const MODEL = String(args.model ?? 'onnx-community/whisper-large-v3-turbo');
const asr = await pipeline('automatic-speech-recognition', MODEL, { dtype: 'q8' });

/** mp3 → 16 кГц моно float32 (столько ждёт Whisper) через ffmpeg. */
function load(file) {
  const buf = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-ar', '16000', '-ac', '1', '-f', 'f32le', '-'], { maxBuffer: 64 << 20 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
}

/**
 * Куски речи между паузами ≥ 0,35 с. Целиком Whisper теряет то, что звучит после длинной паузы
 * (23.10: «…на дереве? Найди!», «…: чик-чирик!» — в записи хвост есть, в расшифровке нет), поэтому — по кускам.
 */
function chunks(pcm) {
  const n = 160; // 10 мс при 16 кГц
  const db = [];
  for (let i = 0; i + n <= pcm.length; i += n) {
    let s = 0;
    for (let k = i; k < i + n; k++) s += pcm[k] * pcm[k];
    db.push(10 * Math.log10(s / n + 1e-12));
  }
  const peak = Math.max(...db);
  const out = [];
  let start = -1;
  let quiet = 0;
  for (let f = 0; f <= db.length; f++) {
    if (f < db.length && db[f] > peak - 30) {
      if (start < 0) start = f;
      quiet = 0;
    } else if (start >= 0 && (++quiet >= 35 || f === db.length)) {
      const end = f - quiet + 1;
      // 100 мс запаса с каждой стороны — без него Whisper глотает первый согласный
      if (end - start >= 15) out.push(pcm.subarray(Math.max(0, (start - 10) * n), Math.min(pcm.length, (end + 10) * n)));
      start = -1;
      quiet = 0;
    }
  }
  return out;
}

/** На тянущемся звуке Whisper зацикливается («жжжж…» на сотни букв, «тише, тише, …») — схлопываем повторы. */
const unloop = (s) =>
  s
    .replace(/(\p{L})\1{3,}/gu, '$1$1$1')
    .replace(/(\p{L}+-)\1{2,}/gu, '$1$1')
    .replace(/(\p{L}+)(?:[\s,!.]+\1\b){2,}/giu, '$1, $1');
// Эхо Whisper слышит словом («Скажи бабочка»), а в тексте слоги через дефис — сравниваем без дефисов;
// протяжные «бе-е-е» / «Беее» — без повторов букв
const plain = (s) => normText(s.replace(/(\p{L})-(?=\p{L})/gu, '$1')).replace(/(\p{L})\1+/gu, '$1');

const rows = [];
const t0 = Date.now();
for (const id of files) {
  const parts = [];
  // Эхо — целиком: по кускам «ве-дёр-ко» распадается на слоги, и каждый слышится как попало (23.10); хвостов после слова у эхо нет
  const pcm = load(`${DIR}/${id}.mp3`);
  for (const c of /_echo$/.test(id) ? [pcm] : chunks(pcm)) parts.push((await asr(c, { language: 'russian', task: 'transcribe' })).text.trim());
  const got = unloop(parts.join(' '));
  const sim = similarity(plain(PHRASES[id].text), plain(got));
  const verifiedNow = args.verify && !verified.has(id) && sim >= 0.85;
  if (verifiedNow) verified.add(id);
  rows.push({ id, sim, got, verifiedNow });
  done.add(key(id));
  console.log(`${sim >= 0.72 ? '✓' : '✗'} ${id.padEnd(18)} ${(sim * 100).toFixed(0).padStart(3)}%  «${got}»${verifiedNow ? '  → проверено (Gemini не смог)' : ''}`);
}

// Замечания Whisper — отдельной частью причины, как у оценщика: voice-lint и voice-judge их не затирают
const SUSPECT = 'voice/suspect.txt';
const suspect = new Map(
  (existsSync(SUSPECT) ? readFileSync(SUSPECT, 'utf8').split('\n') : []).filter(Boolean).map((l) => [l.split('\t')[0], l.split('\t')[1] ?? '']),
);
for (const r of rows) {
  const rest = (suspect.get(r.id) ?? '').split(' | ').filter((s) => s && !s.startsWith('whisper:'));
  const why = [...rest, ...(r.sim < 0.72 ? [`whisper: расслышал «${r.got}» (${(r.sim * 100).toFixed(0)}%)`] : [])].join(' | ');
  if (why) suspect.set(r.id, why);
  else suspect.delete(r.id);
}
writeFileSync(SUSPECT, [...suspect].map(([id, why]) => `${id}\t${why}`).join('\n') + (suspect.size ? '\n' : ''));
writeFileSync(DONE, [...done].sort().join('\n') + '\n');
if (args.verify) writeFileSync('voice/verified.txt', [...verified].sort().join('\n') + '\n');
writeFileSync('voice/whisper.tsv', 'id\tсовпадение\tрасслышано\n' + rows.map((r) => `${r.id}\t${(r.sim * 100).toFixed(0)}%\t${r.got}`).join('\n') + '\n');
const fallback = rows.filter((r) => r.verifiedNow).length;
console.log(
  `\nИтог: файлов ${rows.length}, ниже 72% (в «послушать»): ${rows.filter((r) => r.sim < 0.72).length}` +
    `${fallback ? `, проверено вместо Gemini: ${fallback}` : ''}, ${((Date.now() - t0) / rows.length / 1000).toFixed(1)} с на файл. Отчёт: voice/whisper.tsv`,
);
