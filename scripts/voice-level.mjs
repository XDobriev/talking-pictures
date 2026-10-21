// Выравнивание озвучки по тем ошибкам, которые пользователь находил на слух (20.10):
//   1) фразы разной громкости — polish() выравнивает по пику, а ухо слышит среднюю громкость (LUFS);
//   2) часть фразы тише остального («Слушай внимательно» на 4 дБ тише «Кто так говорит?»);
//   3) фраза заметно медленнее похожих («Найди сову!»).
//
//   node scripts/voice-level.mjs            — только отчёт (voice/level.tsv), файлы не меняются
//   node scripts/voice-level.mjs --apply    — исправить; оригиналы → voice/raw/level-orig/ (повторный запуск их не перезаписывает)
//   --only=id1,id2                          — только эти фразы
//
// Громкость меряет ffmpeg (EBU R128), неровность и темп — по кадрам 50 мс.
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import { MPEGDecoder } from 'mpg123-decoder';
import { PHRASES } from '../src/data/phrases.ts';
import { phraseWeight } from './lib/audio.mjs';

const DIR = 'src/assets/voice';
const ORIG = 'voice/raw/level-orig';
const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.replace(/^--/, '').split('=')[0], a.split('=')[1] ?? true]));
const only = args.only ? new Set(String(args.only).split(',')) : null;

// Цели. Шёпот («Тише-тише…», «Спокойной ночи») — на 3 LU тише: так задумано.
const TARGET = -14; // медиана фраз до выравнивания (−14,3) — баланс с музыкой и звуками в игре не меняется
const TARGET_WHISPER = -17;
const LOUD_TOL = 1; // ±1 LU на слух не различить — не трогаем
const UNEVEN_DB = 3.5; // кусок фразы тише остальных больше чем на столько — выравниваем
const SLOW = 1.25; // медленнее медианы своей группы больше чем в 1,25 раза — ускоряем
const MAX_TEMPO = 1.2;

// Эхо (по слогам), звукоподражания («ку-ка-ре-ку») и шёпот медленные и неровные по замыслу —
// их только выравниваем по громкости. Остальное сравниваем с фразами того же типа:
// у коротких «Найди сову!» своя естественная скорость, у «Сова спит днём…» — своя.
const kind = (id) =>
  /_echo$/.test(id) ? 'эхо' : /_sound$/.test(id) ? 'звук' : PHRASES[id]?.mood === 'whisper' ? 'шёпот' : (id.match(/_(ask|name|fact|helped)$/)?.[1] ?? (id.startsWith('task_') ? 'task' : 'общие'));
const EXPRESSIVE = new Set(['эхо', 'звук', 'шёпот']);
// Перепад громкости внутри задуман: звукоподражание в конце («Шур-шур!», «плюх!») и сочувственное «Кому-то грустно».
const KEEP_SHAPE = new Set(['bush_name', 'fish_fact', 'bunny_fact', 'task_sad']); // «Прыг-скок!» — тоже
// Правки на слух (пользователь, 21.10): применяются при каждом запуске от оригинала, иначе их затёр бы следующий проход.
const MANUAL = {
  next: { tempo: 1.15 }, // «Играем дальше?» — «слишком растянуто»
  bye_sleep: { tempo: 1.12 }, // «Спокойной ночи!» — «сделай быстрее немного»
};

const decoder = new MPEGDecoder();
await decoder.ready;
async function analyze(file) {
  await decoder.reset();
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(readFileSync(file)));
  const ch = channelData[0];
  const frame = Math.round(sampleRate * 0.05);
  const db = [];
  for (let i = 0; i + frame <= ch.length; i += frame) {
    let s = 0;
    for (let k = i; k < i + frame; k++) s += ch[k] * ch[k];
    db.push(10 * Math.log10(s / frame + 1e-12));
  }
  const peak = Math.max(...db);
  const speech = db.map((v) => v > peak - 30);
  // Куски речи между паузами ≥ 150 мс; уровень куска — средняя мощность.
  const segs = [];
  let start = -1;
  let gap = 0;
  for (let i = 0; i <= db.length; i++) {
    if (i < db.length && speech[i]) {
      if (start < 0) start = i;
      gap = 0;
    } else if (start >= 0 && (++gap >= 3 || i === db.length)) {
      const end = i - gap + 1;
      if (end - start >= 4) {
        const p = db.slice(start, end).reduce((a, v) => a + 10 ** (v / 10), 0) / (end - start);
        segs.push({ start, end, level: 10 * Math.log10(p) });
      }
      start = -1;
      gap = 0;
    }
  }
  const first = speech.indexOf(true);
  const last = speech.lastIndexOf(true);
  const levels = segs.map((s) => s.level);
  const uneven = levels.length >= 2 ? Math.max(...levels) - Math.min(...levels) : 0;
  return { speechSec: ((last - first + 1) * frame) / sampleRate, uneven, segs: segs.length };
}

/** Громкость по EBU R128 (ffmpeg loudnorm, первый проход; JSON — в конце stderr). */
function lufs(file) {
  const { stderr } = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-i', file, '-af', 'loudnorm=I=-16:TP=-1.5:print_format=json', '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const j = JSON.parse(stderr.slice(stderr.lastIndexOf('{')));
  return { i: Number(j.input_i), tp: Number(j.input_tp), lra: Number(j.input_lra), thresh: Number(j.input_thresh) };
}

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.mp3'))
  .map((f) => f.replace(/\.mp3$/, ''))
  .filter((id) => PHRASES[id] && (!only || only.has(id)));

const rows = [];
for (const id of files) {
  const file = `${DIR}/${id}.mp3`;
  const a = await analyze(file);
  const l = lufs(file);
  rows.push({ id, kind: kind(id), ...a, ...l, rate: a.speechSec / phraseWeight(PHRASES[id].text) });
}
// Темп сравниваем внутри группы: эхо и шёпот медленные по замыслу.
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const med = {};
for (const k of new Set(rows.map((r) => r.kind))) med[k] = median(rows.filter((r) => r.kind === k).map((r) => r.rate));

function setFlags(r) {
  const target = r.kind === 'шёпот' ? TARGET_WHISPER : TARGET;
  const peers = rows.filter((x) => x.kind === r.kind).length;
  r.slow = !EXPRESSIVE.has(r.kind) && !KEEP_SHAPE.has(r.id) && r.kind !== 'общие' && peers >= 5 && r.rate > med[r.kind] * SLOW ? Math.min(MAX_TEMPO, r.rate / (med[r.kind] * 1.1)) : 0;
  r.fixUneven = !EXPRESSIVE.has(r.kind) && !KEEP_SHAPE.has(r.id) && r.uneven > UNEVEN_DB;
  // Пик выше −1 дБ (с учётом межотсчётных пиков mp3) может хрипеть на громких колонках — через ограничитель.
  r.fixLoud = Math.abs(r.i - target) > LOUD_TOL || r.tp > -1;
  r.manual = MANUAL[r.id];
  r.target = target;
  return r;
}
rows.forEach(setFlags);

writeFileSync(
  'voice/level.tsv',
  'id\tгруппа\tLUFS\tпик дБ\tнеровность дБ\tтемп/медиана\tисправить\n' +
    rows
      .map((r) =>
        [
          r.id,
          r.kind,
          r.i.toFixed(1),
          r.tp.toFixed(1),
          r.uneven.toFixed(1),
          (r.rate / med[r.kind]).toFixed(2),
          [r.fixLoud && (r.tp > -1 ? 'пик' : 'громкость'), r.fixUneven && 'неровность', r.slow && `темп ×${r.slow.toFixed(2)}`].filter(Boolean).join(', '),
        ].join('\t'),
      )
      .join('\n') +
    '\n',
);

const loudVals = rows.filter((r) => r.kind !== 'шёпот').map((r) => r.i);
console.log(`Фраз: ${rows.length}. Громкость (без шёпота): от ${Math.min(...loudVals).toFixed(1)} до ${Math.max(...loudVals).toFixed(1)} LUFS (цель ${TARGET}).`);
console.log(`Громкость вне ±${LOUD_TOL} LU: ${rows.filter((r) => r.fixLoud).length}`);
console.log(`Неровные (> ${UNEVEN_DB} дБ, без эхо): ${rows.filter((r) => r.fixUneven).map((r) => `${r.id} ${r.uneven.toFixed(1)}`).join(', ') || '—'}`);
console.log(`Медленные (> ×${SLOW} медианы): ${rows.filter((r) => r.slow).map((r) => `${r.id} ×${(r.rate / med[r.kind]).toFixed(2)}`).join(', ') || '—'}`);

if (args.apply) {
  mkdirSync(ORIG, { recursive: true });
  let n = 0;
  for (const cur of rows) {
    if (!cur.fixLoud && !cur.fixUneven && !cur.slow && !cur.manual) continue;
    const file = `${DIR}/${cur.id}.mp3`;
    const orig = `${ORIG}/${cur.id}.mp3`;
    if (!existsSync(orig)) copyFileSync(file, orig);
    // Всегда от оригинала и с флагами по оригиналу: повторный запуск не накапливает обработку
    // (20.10 двойное выравнивание подняло тишину в «Найди самокат!» до шума).
    const a = await analyze(orig);
    const r = setFlags({ id: cur.id, kind: cur.kind, ...a, ...lufs(orig), rate: a.speechSec / phraseWeight(PHRASES[cur.id].text) });
    // Окно выравнивателя ~0,5 с: фразы короткие, с окном 2 с он их почти не трогал.
    const tempo = r.manual?.tempo ?? r.slow;
    const pre = [r.fixUneven && 'dynaudnorm=f=100:g=5:p=0.9:m=6', tempo && `atempo=${tempo.toFixed(3)}`].filter(Boolean);
    const tmp = `${ORIG}/.tmp-${r.id}.wav`;
    execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', orig, ...(pre.length ? ['-af', pre.join(',')] : []), '-ar', '24000', '-ac', '1', tmp]);
    // Усиление ровно на разницу с целью; короткие пики мягко срезает ограничитель (на речи 2–4 дБ среза не слышно).
    // Срез на −2 дБ, а после сжатия в mp3 пик проверяется: если подрос выше −1 дБ — ниже порог среза
    // (а не громкость всей фразы: иначе фразы с резкими пиками выходят на 2–3 LU тише соседних).
    const gain = r.target - lufs(tmp).i;
    let limit = 0.79;
    for (let attempt = 0; attempt < 4; attempt++) {
      const af = `volume=${gain.toFixed(2)}dB,alimiter=limit=${limit.toFixed(3)}:attack=1:release=60:level=disabled`;
      execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', tmp, '-af', af, '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', file]);
      const tp = lufs(file).tp;
      if (tp <= -1) break;
      limit *= 10 ** (-(tp + 1.3) / 20);
    }
    n++;
  }
  console.log(`Исправлено файлов: ${n}. Оригиналы — ${ORIG}/`);
}
decoder.free();
