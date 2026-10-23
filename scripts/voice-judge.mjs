// Нейросеть-оценщик: то, что слышит человек, но не видят ни расшифровка (voice-qa.mjs), ни форма звука (voice-lint.mjs):
// ударения, интонация вопроса, второй голос, посторонние звуки, раздельность слогов в эхо.
// Gemini получает запись и ожидаемый текст с ударениями и отвечает по пунктам (JSON).
// Ничего не удаляет: замечания — в «послушать» (voice/suspect.txt, страница npm run voice:listen -- --suspect).
// Реестр оценённых — voice/judged.txt (id:размер файла — переозвученный файл оценится заново).
//
//   node scripts/voice-judge.mjs [--only=…] [--all] [--model=…]
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { PHRASES } from '../src/data/phrases.ts';
import { gemini, mp3Part, TEXT_MODELS } from './lib/gemini.mjs';

const DIR = 'src/assets/voice';
const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.replace(/^--/, '').split('=')[0], a.split('=')[1] ?? true]));
const ask = gemini(args.model ? String(args.model).split(',') : TEXT_MODELS);
const JUDGED = 'voice/judged.txt';
const judged = new Set(existsSync(JUDGED) ? readFileSync(JUDGED, 'utf8').split(/\s+/).filter(Boolean) : []);
const heard = new Set(existsSync('voice/heard.txt') ? readFileSync('voice/heard.txt', 'utf8').split(/\s+/).filter(Boolean) : []);
const key = (id) => `${id}:${statSync(`${DIR}/${id}.mp3`).size}`;
const only = args.only
  ? new Set((existsSync(args.only) ? readFileSync(args.only, 'utf8').split(/\s+/) : String(args.only).split(',')).filter(Boolean))
  : null;
// По умолчанию — ещё не оценённые; --all — заново все (или все из --only)
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.mp3'))
  .map((f) => f.replace(/\.mp3$/, ''))
  .filter((id) => PHRASES[id] && (!only || only.has(id)) && (args.all || !judged.has(key(id))))
  // Сначала одобренные человеком (voice/heard.txt): замечания к ним — ложные, по ним видно, насколько оценщику верить
  .sort((a, b) => Number(heard.has(b)) - Number(heard.has(a)));
if (!files.length) {
  console.log('Нечего оценивать: все файлы уже оценены.');
  process.exit(0);
}

// «Найд+и б+елочку» → «НайдИ бЕлочку»: заглавная гласная модели понятнее знака ударения
const marked = (p) => (p.stressed ?? p.text).replace(/\+([а-яё])/gi, (_, v) => v.toUpperCase());
const MASCOT = new Set(['welcome', 'hint_firefly', 'tutorial_tap']);

function prompt(id) {
  const p = PHRASES[id];
  const echo = /_echo$/.test(id);
  const question = /\?\s*$/.test(p.text) || /\?/.test(p.text);
  return [
    'Ты — строгий звукорежиссёр детской игры. Послушай запись (синтез речи) и сравни с ожидаемым текстом.',
    `Ожидаемый текст: «${p.text}». Ударные гласные — заглавные: «${marked(p)}».`,
    `Голос: ${MASCOT.has(id) ? 'светлячок, весёлый детский персонаж' : 'женщина-рассказчица, тёплая подача'}${p.mood === 'whisper' ? ', здесь шёпотом — так задумано' : ''}.`,
    // Раздельность слогов не спрашиваем: 23.10 оценщик назвал «слитным» одобренное на слух «ли-са» и пропустил
    // слитное «мыш-ка». Её меряет voice-lint.mjs по провалам громкости.
    echo ? 'Это фраза для повторения: слово после «Скажи:» читается по слогам — это задумано, раздельность слогов не оценивай.' : '',
    /_sound$/.test(id) ? 'Звукоподражания («ку-ка-ре-ку», «ква-ква») произносятся выразительно — это не ошибка.' : '',
    'Ответь JSON-объектом с полями:',
    '"stress": массив слов, где ударение в записи НЕ там, где в ожидаемом тексте (каждое — строка «слово: как прозвучало»), пустой, если всё верно;',
    question ? '"question": true, если фраза звучит как вопрос (вопросительная интонация), иначе false;' : '',
    '"voice": true, если всю запись говорит один и тот же голос, false — если голос меняется или слышен второй;',
    '"defects": массив замеченных дефектов звука (обрезано начало или конец слова, посторонний шум, щелчок, искажение, лишний звук или слово, проглоченное слово), пустой, если их нет.',
    'Отмечай только то, что уверенно слышно. Обычная живая подача — не дефект.',
  ]
    .filter(Boolean)
    .join('\n');
}

const SUSPECT = 'voice/suspect.txt';
const suspect = new Map(
  (existsSync(SUSPECT) ? readFileSync(SUSPECT, 'utf8').split('\n') : []).filter(Boolean).map((l) => [l.split('\t')[0], l.split('\t')[1] ?? '']),
);
const rows = [];
for (const id of files) {
  let v;
  try {
    const text = await ask([{ text: prompt(id) }, mp3Part(`${DIR}/${id}.mp3`)], { responseMimeType: 'application/json', temperature: 0 });
    v = JSON.parse(text || '{}');
  } catch (e) {
    console.log(`✗ ${id}: ${e.message}`);
    if (e.daily) break;
    continue;
  }
  const notes = [
    ...(v.stress ?? []).map((s) => `ударение: ${s}`),
    v.question === false && 'не звучит как вопрос',
    v.voice === false && 'голос меняется',
    ...(v.defects ?? []).map((d) => `дефект: ${d}`),
  ].filter(Boolean);
  rows.push({ id, notes });
  console.log(`${notes.length ? '?' : '✓'} ${id.padEnd(18)} ${notes.join('; ')}`);
  judged.add(key(id));
  // замечания оценщика — отдельной частью причины, чтобы не затирать пометки voice-lint
  const lint = (suspect.get(id) ?? '').split(' | ').filter((s) => s && !s.startsWith('оценщик:'));
  const why = [...lint, ...(notes.length ? [`оценщик: ${notes.join('; ')}`] : [])].join(' | ');
  if (why) suspect.set(id, why);
  else suspect.delete(id);
}
writeFileSync(JUDGED, [...judged].sort().join('\n') + '\n');
writeFileSync(SUSPECT, [...suspect].map(([id, why]) => `${id}\t${why}`).join('\n') + (suspect.size ? '\n' : ''));
writeFileSync('voice/judge.tsv', 'id\tзамечания\n' + rows.map((r) => `${r.id}\t${r.notes.join('; ')}`).join('\n') + '\n');
console.log(`\nИтог: оценено ${rows.length}, с замечаниями ${rows.filter((r) => r.notes.length).length}${files.length - rows.length ? `, не оценено ${files.length - rows.length} (сеть/лимит — оценятся при следующем запуске)` : ''}. Отчёт: voice/judge.tsv`);
