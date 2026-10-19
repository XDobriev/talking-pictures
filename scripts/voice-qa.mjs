// Проверка озвучки без ушей:
// 1) перечищает тишину по краям каждого mp3 (адаптивный порог);
// 2) отдаёт файлы пачками в Gemini (текстовая модель) на расшифровку и сравнивает с ожидаемой фразой.
// Несовпадения → voice/review.txt; с --delete-bad плохие файлы удаляются, чтобы voice.mjs их переозвучил.
//
//   node scripts/voice-qa.mjs [--delete-bad] [--no-trim] [--model=gemini-2.5-flash]
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { MPEGDecoder } from 'mpg123-decoder';
import { PHRASES } from '../src/data/phrases.ts';
import { normText, polish, similarity, toMp3 } from './lib/audio.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.replace(/^--/, '').split('=')[0], a.split('=')[1] ?? true]));
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const DIR = 'src/assets/voice';
const MODEL = String(args.model ?? 'gemini-2.5-flash');
const files = readdirSync(DIR).filter((f) => f.endsWith('.mp3'));

// ---------- 1. тишина ----------
const decoder = new MPEGDecoder();
await decoder.ready;
const durations = {};
for (const f of files) {
  const buf = readFileSync(`${DIR}/${f}`);
  decoder.reset();
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
async function transcribe(batch) {
  const parts = [
    {
      text:
        `Ниже ${batch.length} коротких аудиозаписей на русском. Для каждой по порядку дословно запиши, что произнесено ` +
        `(со всеми словами, включая звукоподражания). Ответь только JSON-массивом строк длиной ${batch.length}.`,
    },
  ];
  for (const f of batch) parts.push({ inlineData: { mimeType: 'audio/mp3', data: readFileSync(`${DIR}/${f}`).toString('base64') } });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    signal: AbortSignal.timeout(90000),
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '[]';
  return JSON.parse(text);
}

const bad = [];
const rows = [];
const SIZE = 12;
for (let i = 0; i < files.length; i += SIZE) {
  const batch = files.slice(i, i + SIZE);
  let heard;
  try {
    heard = await transcribe(batch);
  } catch (e) {
    console.log(`✗ пачка ${i / SIZE + 1}: ${e.message}`);
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
  await new Promise((r) => setTimeout(r, 1500));
}

mkdirSync('voice', { recursive: true });
writeFileSync(
  'voice/qa.tsv',
  'id\tсовпадение\tдлительность\tрасслышано\n' + rows.map((r) => `${r.id}\t${(r.sim * 100).toFixed(0)}%\t${r.dur.toFixed(1)}\t${r.got}`).join('\n'),
);
writeFileSync('voice/review.txt', bad.join('\n') + (bad.length ? '\n' : ''));
if (args['delete-bad']) for (const id of bad) unlinkSync(`${DIR}/${id}.mp3`);
console.log(`\nИтог: ок ${rows.length - bad.length}, не совпало ${bad.length}${args['delete-bad'] && bad.length ? ' (удалены — переозвучит voice.mjs)' : ''}. Отчёт: voice/qa.tsv`);
