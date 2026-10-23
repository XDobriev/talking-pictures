// Проверка озвучки по форме звука — то, чего не видит расшифровка (voice-qa.mjs проверяет только слова):
//   1) эхо слитно: «Скажи: бе-лоч-ка!» расшифруется верно, даже если слоги не разделены паузами;
//   2) обрыв на краю: речь начинается или кончается вплотную к краю файла (срезано слово);
//   3) прилипший кусок: короткий звук у края, отделённый паузой, — хвост соседней фразы из пачки;
//   4) длинная пауза посреди обычной фразы;
//   5) чужой голос: высота голоса (основной тон, F0) далеко от остальных фраз того же персонажа.
// Без сети и лимитов, несколько секунд на все файлы.
//
//   node scripts/voice-lint.mjs                 — отчёт по всем файлам (voice/lint.tsv)
//   node scripts/voice-lint.mjs --unverified    — только не прошедшие voice-qa (свежая озвучка)
//   --only=id1,id2 | --only=voice/new.txt       — только эти
//   --delete-bad                                — удалить брак (переозвучит voice.mjs); сомнительные — только в отчёт
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { MPEGDecoder } from 'mpg123-decoder';
import { PHRASES } from '../src/data/phrases.ts';

const DIR = 'src/assets/voice';
const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.replace(/^--/, '').split('=')[0], a.split('=')[1] ?? true]));
const verified = new Set(existsSync('voice/verified.txt') ? readFileSync('voice/verified.txt', 'utf8').split(/\s+/).filter(Boolean) : []);
const only = args.only
  ? new Set((existsSync(args.only) ? readFileSync(args.only, 'utf8').split(/\s+/) : String(args.only).split(',')).filter(Boolean))
  : null;
const MASCOT = new Set(['welcome', 'hint_firefly', 'tutorial_tap']); // как в voice.mjs
const isEcho = (id) => /_echo$/.test(id);
const expressive = (id) => isEcho(id) || /_sound$/.test(id);

const FRAME = 0.01; // с

/** Уровень по кадрам 10 мс (дБ) и основной тон по кадрам 40 мс. */
function measure(ch, rate) {
  const n = Math.round(rate * FRAME);
  const db = [];
  for (let i = 0; i + n <= ch.length; i += n) {
    let s = 0;
    for (let k = i; k < i + n; k++) s += ch[k] * ch[k];
    db.push(10 * Math.log10(s / n + 1e-12));
  }
  // F0 автокорреляцией: окно 40 мс, 75–450 Гц; кадр голосовой, если пик корреляции > 0,6
  const win = Math.round(rate * 0.04);
  const minLag = Math.floor(rate / 450);
  const maxLag = Math.ceil(rate / 75);
  const peakDb = Math.max(...db);
  const f0 = [];
  for (let i = 0; i + win + maxLag <= ch.length; i += win) {
    if (db[Math.floor(i / n)] < peakDb - 20) continue;
    let e0 = 0;
    for (let k = i; k < i + win; k++) e0 += ch[k] * ch[k];
    let best = 0;
    let lag = 0;
    for (let L = minLag; L <= maxLag; L++) {
      let c = 0;
      let e1 = 0;
      for (let k = i; k < i + win; k++) {
        c += ch[k] * ch[k + L];
        e1 += ch[k + L] * ch[k + L];
      }
      const r = c / Math.sqrt(e0 * e1 + 1e-12);
      if (r > best) [best, lag] = [r, L];
    }
    if (best > 0.6) f0.push(rate / lag);
  }
  return { db, peakDb, f0 };
}

const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);

/** Куски речи и паузы между ними: речь — кадры не тише пика −30 дБ, пауза — от 60 мс. */
function segments(db, peakDb) {
  const speech = db.map((v) => v > peakDb - 30);
  const segs = [];
  let start = -1;
  let gap = 0;
  for (let i = 0; i <= db.length; i++) {
    if (i < db.length && speech[i]) {
      if (start < 0) start = i;
      gap = 0;
    } else if (start >= 0 && (++gap >= 6 || i === db.length)) {
      segs.push({ start, end: i - gap + 1 });
      start = -1;
      gap = 0;
    }
  }
  return segs;
}

/**
 * Глубина провалов громкости (дБ): огибающая сглажена до 50 мс, для каждого локального минимума —
 * насколько он ниже меньшего из соседних максимумов (как «выступ» горы, только вниз).
 */
function dips(db) {
  const env = db.map((_, i) => {
    const w = db.slice(Math.max(0, i - 2), i + 3);
    return 10 * Math.log10(w.reduce((s, v) => s + 10 ** (v / 10), 0) / w.length);
  });
  const peak = Math.max(...env);
  const a = env.findIndex((v) => v > peak - 30);
  const b = env.findLastIndex((v) => v > peak - 30);
  const out = [];
  for (let i = a + 1; i < b; i++) {
    if (!(env[i] <= env[i - 1] && env[i] < env[i + 1])) continue;
    // с каждой стороны — самый высокий уровень, пока не встретится точка ниже этого минимума
    // (тогда провал — часть более глубокого, и его посчитает тот минимум)
    let l = -Infinity;
    for (let j = i - 1; j >= a && env[j] >= env[i]; j--) l = Math.max(l, env[j]);
    let r = -Infinity;
    for (let j = i + 1; j <= b && env[j] >= env[i]; j++) r = Math.max(r, env[j]);
    out.push(Math.min(l, r) - env[i]);
  }
  return out.filter((d) => d > 3);
}

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.mp3'))
  .map((f) => f.replace(/\.mp3$/, ''))
  .filter((id) => PHRASES[id] && (!only || only.has(id)) && (!args.unverified || !verified.has(id)));
if (!files.length) {
  console.log('Нечего проверять: новых файлов нет.');
  process.exit(0);
}

const decoder = new MPEGDecoder();
await decoder.ready;
const rows = [];
for (const id of files) {
  await decoder.reset();
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(readFileSync(`${DIR}/${id}.mp3`)));
  const { db, peakDb, f0 } = measure(channelData[0], sampleRate);
  const segs = segments(db, peakDb);
  const text = PHRASES[id].text;
  const gaps = segs.slice(1).map((s, k) => (s.start - segs[k].end) * FRAME);
  const r = {
    id,
    voice: MASCOT.has(id) ? 'маскот' : 'рассказчица',
    dur: db.length * FRAME,
    lead: segs.length ? segs[0].start * FRAME : 0,
    tail: segs.length ? (db.length - segs.at(-1).end) * FRAME : 0,
    // самый короткий крайний кусок и пауза, которой он отделён
    edgeBlob: segs.length > 1 ? Math.min((segs[0].end - segs[0].start) * FRAME, (segs.at(-1).end - segs.at(-1).start) * FRAME) : 1,
    edgeGap: segs.length > 1 ? Math.max(gaps[0], gaps.at(-1)) : 0,
    maxGap: gaps.length ? Math.max(...gaps) : 0,
    f0: median(f0),
    voicedShare: f0.length,
  };
  if (isEcho(id)) {
    // Между слогами модель обычно не молчит, а делает провал громкости (одобренное на слух «ли-са» —
    // провал на 15–20 дБ без тишины). Считаем только в самом слове — после паузы за «Скажи:»
    // (в «Скажи» свои провалы на согласных). Слабейший из стольких самых глубоких, сколько дефисов,
    // показывает, разделены ли слоги вообще.
    const want = (text.match(/-/g) ?? []).length;
    const say = segs.findIndex((s, k) => k > 0 && (s.start - segs[k - 1].end) * FRAME >= 0.2);
    r.sayPause = say > 0 ? (segs[say].start - segs[say - 1].end) * FRAME : 0;
    const d = say > 0 ? dips(db.slice(segs[say].start)).sort((a, b) => b - a) : [];
    r.syllables = want;
    r.weakest = want === 0 ? 99 : d.length >= want ? d[want - 1] : 0;
  }
  rows.push(r);
}
decoder.free();

// Пороги подобраны 23.10 по 163 файлам, прошедшим расшифровку (из них 40 одобрены на слух).
// Брак — только то, чего у хороших файлов не бывает; остальное — «послушать» (voice/suspect.txt → страница прослушивания).
// Высоту голоса сравниваем с медианой своего персонажа, а не со всеми: светлячок выше рассказчицы.
const f0med = {};
for (const v of new Set(rows.map((r) => r.voice))) f0med[v] = median(rows.filter((r) => r.voice === v && r.f0).map((r) => r.f0));
for (const r of rows) {
  const bad = [];
  const doubt = [];
  // у хороших тишина по краям 0,06–0,21 с (polish оставляет 90 мс): меньше 30 мс — речь упирается в край
  if (r.lead < 0.03) bad.push(`обрыв в начале (${r.lead.toFixed(2)} с тишины)`);
  if (r.tail < 0.03) bad.push(`обрыв в конце (${r.tail.toFixed(2)} с тишины)`);
  if (isEcho(r.id)) {
    // у хороших пауза после «Скажи:» 0,29–0,89 с; без неё «Скажи: я-го-да!» — 4 с сплошного звука
    if (r.sayPause < 0.2) bad.push('эхо без паузы после «Скажи:» — всё слитно');
    // одобренные «ё-жик», «ли-са» — провал 15+ дБ; «му-хо-мор» с провалом < 10 дБ — слоги слились
    else if (r.weakest < 10) doubt.push(`слоги почти не разделены (провал ${r.weakest.toFixed(0)} дБ)`);
  }
  if (!expressive(r.id) && PHRASES[r.id].mood !== 'whisper' && r.maxGap > 1) doubt.push(`пауза посреди фразы ${r.maxGap.toFixed(1)} с`);
  // у рассказчицы 162–369 Гц (выше — радость и вопросы), подмена голоса на мужской — ниже 140
  const ratio = r.f0 / f0med[r.voice];
  if (r.f0 && ratio < 0.73) bad.push(`голос ниже обычного: ${r.f0.toFixed(0)} Гц при ${f0med[r.voice].toFixed(0)} — похоже на чужой голос`);
  else if (r.f0 && ratio > 1.6 && PHRASES[r.id].mood !== 'whisper') doubt.push(`голос заметно выше обычного: ${r.f0.toFixed(0)} Гц при ${f0med[r.voice].toFixed(0)}`);
  r.bad = bad;
  r.doubt = doubt;
}

const cols = ['id', 'voice', 'dur', 'lead', 'tail', 'maxGap', 'f0', 'syllables', 'sayPause', 'weakest'];
writeFileSync(
  'voice/lint.tsv',
  [...cols, 'итог'].join('\t') + '\n' +
    rows.map((r) => [...cols.map((c) => (typeof r[c] === 'number' ? +r[c].toFixed(2) : (r[c] ?? ''))), [...r.bad, ...r.doubt].join('; ')].join('\t')).join('\n') + '\n',
);
const bad = rows.filter((r) => r.bad.length);
const doubt = rows.filter((r) => !r.bad.length && r.doubt.length);
for (const r of bad) console.log(`✗ ${r.id.padEnd(18)} ${r.bad.join('; ')}`);
for (const r of doubt) console.log(`? ${r.id.padEnd(18)} ${r.doubt.join('; ')}`);
// «послушать» копится между запусками (проверяется часть файлов), пока человек не прослушает фразу
const SUSPECT = 'voice/suspect.txt';
const suspect = new Map(
  (existsSync(SUSPECT) ? readFileSync(SUSPECT, 'utf8').split('\n') : []).filter(Boolean).map((l) => [l.split('\t')[0], l.split('\t')[1] ?? '']),
);
for (const r of rows) {
  if (r.doubt.length && !r.bad.length) suspect.set(r.id, r.doubt.join('; '));
  else suspect.delete(r.id);
}
writeFileSync(SUSPECT, [...suspect].map(([id, why]) => `${id}\t${why}`).join('\n') + (suspect.size ? '\n' : ''));
if (args['delete-bad'] && bad.length) {
  for (const r of bad) {
    unlinkSync(`${DIR}/${r.id}.mp3`);
    verified.delete(r.id);
  }
  writeFileSync('voice/verified.txt', [...verified].sort().join('\n') + '\n');
}
console.log(
  `\nИтог: файлов ${rows.length}, брак ${bad.length}${args['delete-bad'] && bad.length ? ' (удалены — переозвучит voice.mjs)' : ''}, послушать ${doubt.length}. Отчёт: voice/lint.tsv, список «послушать»: ${SUSPECT}`,
);
