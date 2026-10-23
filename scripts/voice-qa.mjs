// Проверка озвучки без ушей:
// 1) перечищает тишину по краям каждого mp3 (адаптивный порог);
// 2) отдаёт файлы пачками в Gemini (текстовая модель) на расшифровку и сравнивает с ожидаемой фразой.
// Несовпадения → voice/review.txt; с --delete-bad плохие файлы удаляются, чтобы voice.mjs их переозвучил.
//
//   node scripts/voice-qa.mjs [--unverified] [--only=…] [--delete-bad] [--no-trim] [--model=…]
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { MPEGDecoder } from 'mpg123-decoder';
import { PHRASES } from '../src/data/phrases.ts';
import { normText, polish, similarity, toMp3 } from './lib/audio.mjs';
import { gemini, mp3Part, TEXT_MODELS } from './lib/gemini.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.replace(/^--/, '').split('=')[0], a.split('=')[1] ?? true]));
const DIR = 'src/assets/voice';
const ask = gemini(args.model ? String(args.model).split(',') : TEXT_MODELS);
// Реестр проверенных: id, прошедшие расшифровку. voice.mjs вычёркивает id, когда переписывает файл.
// --unverified — проверить всё, чего в реестре нет (так не теряются файлы, чья проверка упала из-за сети).
const VERIFIED = 'voice/verified.txt';
const verified = new Set(existsSync(VERIFIED) ? readFileSync(VERIFIED, 'utf8').split(/\s+/).filter(Boolean) : []);
// --only=voice/review.txt (или id через запятую) — проверить только эти; --size=1 — по одному файлу на запрос
const only = args.only
  ? new Set((existsSync(args.only) ? readFileSync(args.only, 'utf8').split(/\s+/) : String(args.only).split(',')).filter(Boolean))
  : null;
const files = readdirSync(DIR).filter((f) => {
  const id = f.replace(/\.mp3$/, '');
  return f.endsWith('.mp3') && (!only || only.has(id)) && (!args.unverified || !verified.has(id));
});
if (!files.length) {
  console.log('Нечего проверять: все файлы в реестре проверенных.');
  process.exit(0);
}

// ---------- 1. тишина ----------
const decoder = new MPEGDecoder();
await decoder.ready;
const durations = {};
for (const f of files) {
  const buf = readFileSync(`${DIR}/${f}`);
  await decoder.reset(); // reset() асинхронный: без await декодер работает с освобождённой памятью и падает
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(buf));
  const ch = channelData[0];
  const pcm = new Int16Array(ch.length);
  for (let i = 0; i < ch.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(ch[i] * 32767)));
  const clean = args['no-trim'] ? pcm : polish(pcm, sampleRate);
  if (!args['no-trim']) writeFileSync(`${DIR}/${f}`, toMp3(clean, sampleRate));
  durations[f] = clean.length / sampleRate;
}
decoder.free();
console.log(`Тишина подрезана: ${files.length} файлов`);

// ---------- 2. расшифровка ----------
// Повторы, перегрузка и лимиты — в lib/gemini.mjs.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function transcribe(batch) {
  // Пачкой модель путает порядок ответов, поэтому надёжен только режим по одному (--size=1): там JSON не нужен
  const single = batch.length === 1;
  const parts = [
    {
      text: single
        ? 'Дословно запиши, что произнесено в этой короткой аудиозаписи на русском (со всеми словами, включая звукоподражания). Ответь только текстом.'
        : `Ниже ${batch.length} коротких аудиозаписей на русском. Для каждой по порядку дословно запиши, что произнесено ` +
          `(со всеми словами, включая звукоподражания). Ответь только JSON-массивом строк длиной ${batch.length}.`,
    },
  ];
  for (const f of batch) parts.push(mp3Part(`${DIR}/${f}`));
  const text = await ask(parts, single ? { temperature: 0 } : { responseMimeType: 'application/json', temperature: 0 });
  return single ? [text.trim()] : JSON.parse(text || '[]');
}

const bad = [];
const rows = [];
const SIZE = Number(args.size ?? 1);
for (let i = 0; i < files.length; i += SIZE) {
  const batch = files.slice(i, i + SIZE);
  let heard;
  try {
    heard = await transcribe(batch);
  } catch (e) {
    console.log(`✗ пачка ${i / SIZE + 1}: ${e.message}`);
    if (e.daily) break;
    continue;
  }
  batch.forEach((f, k) => {
    const id = f.replace(/\.mp3$/, '');
    const expected = PHRASES[id]?.text ?? '';
    const got = String(heard[k] ?? '');
    const sim = similarity(normText(expected), normText(got));
    const ok = sim >= 0.72;
    rows.push({ id, sim, ok, got, dur: durations[f] });
    if (!ok) bad.push(id);
    console.log(`${ok ? '✓' : '✗'} ${id.padEnd(18)} ${(sim * 100).toFixed(0).padStart(3)}%  ${durations[f].toFixed(1)} с  «${got}»`);
  });
  await sleep(1500);
}

mkdirSync('voice', { recursive: true });
writeFileSync(
  'voice/qa.tsv',
  'id\tсовпадение\tдлительность\tрасслышано\n' + rows.map((r) => `${r.id}\t${(r.sim * 100).toFixed(0)}%\t${r.dur.toFixed(1)}\t${r.got}`).join('\n'),
);
writeFileSync('voice/review.txt', bad.join('\n') + (bad.length ? '\n' : ''));
if (args['delete-bad']) for (const id of bad) unlinkSync(`${DIR}/${id}.mp3`);
for (const r of rows) (r.ok ? verified.add(r.id) : verified.delete(r.id));
writeFileSync(VERIFIED, [...verified].sort().join('\n') + '\n');
const unchecked = files.length - rows.length;
console.log(
  `\nИтог: ок ${rows.length - bad.length}, не совпало ${bad.length}${args['delete-bad'] && bad.length ? ' (удалены — переозвучит voice.mjs)' : ''}` +
    `${unchecked ? `, не проверено ${unchecked} (сеть/лимит — проверятся при следующем --unverified)` : ''}. Отчёт: voice/qa.tsv`,
);
