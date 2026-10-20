// Озвучка всех фраз игры нейросетью Gemini TTS → src/assets/voice/<id>.mp3
//
//   node scripts/voice.mjs --cast            — кастинг: 3 фразы × несколько голосов → voice-casting/ (слушать и выбрать)
//   node scripts/voice.mjs --voice=Sulafat   — озвучить всё выбранным голосом (готовые файлы пропускаются)
//   node scripts/voice.mjs --only=owl_name,owl_fact --force   — переозвучить отдельные фразы
//   node scripts/voice.mjs --batch=7 --plain --model=gemini-3.8-flash-lite-tts — другая модель (своя квота), только фразы
//   node scripts/voice.mjs --recut [--only=…]  — перерезать сохранённые пачки (voice/raw/batch-*) без запросов
//   node scripts/voice.mjs --csv            — выгрузить таблицу фраз в voice/phrases.csv (для SpeechKit и проверки)
//
// Ключ: GEMINI_API_KEY в файле .env (Google AI Studio → Create API key). В репозиторий .env не попадает.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PHRASES } from '../src/data/phrases.ts';
import { phraseWeight, polish, splitPhrases, toMp3 } from './lib/audio.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

// ---------- .env ----------
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const MODEL = process.env.GEMINI_TTS_MODEL ?? 'gemini-3.1-flash-tts-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash-preview-tts';
const OUT = 'src/assets/voice';
const RATE = 24000;
// сырой PCM каждой фразы — в voice/raw (не в git), чтобы перечищать без повторной генерации
const RAW = 'voice/raw';
mkdirSync(RAW, { recursive: true });
const keepRaw = (id, pcm) => writeFileSync(`${RAW}/${id}.pcm`, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength));
// Новый файл фразы ещё не проверен: вычёркиваем id из реестра voice/verified.txt (его ведёт voice-qa.mjs).
const VERIFIED = 'voice/verified.txt';
function writeVoice(id, pcm) {
  writeFileSync(`${OUT}/${id}.mp3`, toMp3(pcm));
  if (!existsSync(VERIFIED)) return;
  const list = readFileSync(VERIFIED, 'utf8').split(/\s+/).filter((x) => x && x !== id);
  writeFileSync(VERIFIED, list.join('\n') + '\n');
}

// Подача по настроению фразы. Ударения передаём знаком ударения над гласной (из разметки «+»).
const STYLE = {
  warm: 'тепло, ласково и неторопливо, с улыбкой в голосе, как добрая воспитательница говорит с малышом трёх лет',
  excited: 'радостно и искренне, с восторгом, но не громко, как мама хвалит малыша',
  whisper: 'тихо, почти шёпотом, нежно и спокойно, как перед сном',
  curious: 'с интересом и лёгкой загадочностью, приглашая поиграть, медленно и чётко',
  gentle: 'мягко, сочувственно и спокойно',
};

function withAccents(p) {
  const src = p.stressed ?? p.text;
  // «б+елочка» → «бе́лочка» (U+0301 после ударной гласной)
  return src.replace(/\+([аеёиоуыэюяАЕЁИОУЫЭЮЯ])/g, '$1́');
}

function promptFor(id, p) {
  const mood = p.mood ?? (/_echo$/.test(id) ? 'curious' : /_ask$|_sound$/.test(id) ? 'curious' : 'warm');
  const extra = /_echo$/.test(id) ? ' Слоги произноси раздельно и очень чётко, с маленькими паузами между ними.' : '';
  return `Произнеси по-русски ${STYLE[mood]}. Читай только текст после двоеточия, ничего не добавляй.${extra}\n: ${withAccents(p)}`;
}

async function tts(text, voice, model = MODEL) {
  const key = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    signal: AbortSignal.timeout(180000), // пачка из 7 фраз иногда генерируется дольше 2 минут
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
  });
  if (res.status === 404 && model !== FALLBACK_MODEL) return tts(text, voice, FALLBACK_MODEL);
  if (!res.ok) {
    const body = await res.text();
    const quota = body.match(/"quotaId":\s*"([^"]+)"/)?.[1] ?? '';
    const err = new Error(`HTTP ${res.status} ${quota}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const b64 = json.candidates?.[0]?.content?.parts?.find((x) => x.inlineData)?.inlineData?.data;
  if (!b64) {
    // модель иногда отвечает текстом вместо звука — это лечится повтором
    const err = new Error(`в ответе нет аудио (finishReason: ${json.candidates?.[0]?.finishReason ?? '?'})`);
    err.status = 'noaudio';
    throw err;
  }
  const buf = Buffer.from(b64, 'base64');
  return new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
}


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      // дневную квоту повтор не спасёт — сразу наверх
      const daily = e.status === 429 && /PerDay/i.test(e.message);
      const retriable = !daily && (e.status === 429 || e.status === 'noaudio' || e.status >= 500);
      if (!retriable || attempt >= 6) throw e;
      const wait = Math.min(90000, 4000 * 2 ** (attempt - 1));
      console.log(`  … ${label}: ${e.status}, повтор через ${Math.round(wait / 1000)} с`);
      await sleep(wait);
    }
  }
}

// ---------- CSV ----------
if (args.csv) {
  mkdirSync('voice', { recursive: true });
  const rows = [['id', 'text', 'stressed', 'mood']];
  for (const [id, p] of Object.entries(PHRASES)) rows.push([id, p.text, p.stressed ?? '', p.mood ?? '']);
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  writeFileSync('voice/phrases.csv', '﻿' + csv);
  console.log(`✓ voice/phrases.csv — ${rows.length - 1} фраз`);
  process.exit(0);
}

if (!process.env.GEMINI_API_KEY) {
  console.error('Нет GEMINI_API_KEY. Создайте файл .env в корне проекта со строкой:\nGEMINI_API_KEY=ваш_ключ\n(ключ: https://aistudio.google.com/apikey)');
  process.exit(1);
}

// ---------- кастинг ----------
if (args.cast) {
  const voices = String(args.voices ?? 'Sulafat,Leda,Aoede,Achernar,Vindemiatrix,Kore').split(',');
  const sample = ['welcome', 'squirrel_fact', 'squirrel_echo', 'praise_1', 'task_sleep'];
  mkdirSync('voice-casting', { recursive: true });
  for (const voice of voices) {
    for (const id of sample) {
      const file = `voice-casting/${voice}-${id}.mp3`;
      if (existsSync(file)) continue;
      const pcm = await withRetry(() => tts(promptFor(id, PHRASES[id]), voice), `${voice}/${id}`);
      writeFileSync(file, toMp3(polish(pcm)));
      console.log(`✓ ${file}`);
      await sleep(Number(args.delay ?? 2500));
    }
  }
  console.log('Готово: откройте папку voice-casting и послушайте.');
  process.exit(0);
}

// ---------- вся озвучка ----------
// Рассказчица — один голос на всю игру; маскот-светлячок — свой голос (отдельный персонаж).
const voice = String(args.voice ?? process.env.GEMINI_TTS_VOICE ?? 'Leda');
const mascotVoice = String(args.mascot ?? process.env.GEMINI_TTS_MASCOT ?? 'Achernar');
const MASCOT = new Set(['welcome', 'hint_firefly', 'tutorial_tap']);
const voiceFor = (id) => (MASCOT.has(id) ? mascotVoice : voice);
if (args.model) process.env.GEMINI_TTS_MODEL = String(args.model);
const model = String(args.model ?? MODEL);

const only = args.only ? String(args.only).split(',') : null;
mkdirSync(OUT, { recursive: true });
let made = 0;
let skipped = 0;
const failed = [];
// Сначала то, что звучит чаще всего: приветствие, похвала, задания, герои первых уровней.
const PRIORITY = [/^welcome|^praise|^win$|^sticker$|^hint/, /^task_/, /^(squirrel|hedgehog|bunny)_/, /^(owl|duck|frog|bee|fox|bear)_/];
const rank = (id) => {
  const i = PRIORITY.findIndex((re) => re.test(id));
  return i === -1 ? PRIORITY.length : i;
};
const ordered = Object.entries(PHRASES).sort(([a], [b]) => rank(a) - rank(b));
const todo = ordered.filter(([id]) => (!only || only.includes(id)) && (args.force || !existsSync(`${OUT}/${id}.mp3`)));
skipped = ordered.length - todo.length;

// ---------- пакетный режим: много фраз за один запрос ----------
// Лимит бесплатного ключа считается в запросах, поэтому просим прочитать 10–14 фраз подряд
// с длинными паузами и режем результат по самым длинным паузам.

// Нарезка — splitPhrases из lib/audio.mjs. Запись пачки целиком кладём в voice/raw/batch-*.pcm
// (+ .json со списком фраз), чтобы при ошибке перерезать без нового запроса: --recut.

if (args.recut) {
  for (const f of readdirSync(RAW).filter((x) => /^batch-.*\.json$/.test(x))) {
    const ids = JSON.parse(readFileSync(`${RAW}/${f}`, 'utf8'));
    const buf = readFileSync(`${RAW}/${f.replace('.json', '.pcm')}`);
    const parts = splitPhrases(new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2), ids.map((id) => phraseWeight(PHRASES[id].text)));
    if (!parts) continue;
    parts.forEach((part, k) => {
      if (only && !only.includes(ids[k])) return;
      writeVoice(ids[k], polish(part));
      console.log(`✓ ${ids[k]}  ${(part.length / RATE).toFixed(1)} с`);
    });
  }
  process.exit(0);
}

function batchPrompt(items, mood) {
  const lines = items.map(([, p]) => withAccents(p)).join('\n\n');
  // --plain: только фразы, без инструкции. Модели 3.8 иначе зачитывают инструкцию вслух,
  // а systemInstruction не принимают («Developer instruction is not enabled», перепроверено 19.10). Цена — нет управления подачей.
  // gemini-3.1-flash-tts-preview инструкцию в тексте понимает и вслух не читает — ей --plain не нужен.
  if (args.plain) return lines;
  return (
    `Прочитай по-русски ${STYLE[mood]} фразы ниже, строго по порядку, каждую ровно как написано. ` +
    `После КАЖДОЙ фразы делай длинную паузу — две секунды полной тишины. ` +
    `Ничего не добавляй между фразами, не читай номера и служебные слова. ` +
    `Если в фразе слоги разделены дефисами, произноси их раздельно, с короткими паузами.\n\n${lines}`
  );
}

if (args.batch) {
  const size = Number(args.batch === true ? 12 : args.batch);
  // одна подача и один голос на запрос
  const groups = new Map();
  for (const item of todo) {
    const [id, p] = item;
    // меньше групп — меньше запросов: «мягко» читаем как «тепло», маскот всегда тёплый
    let mood = p.mood ?? (/_echo$|_ask$|_sound$/.test(id) ? 'curious' : 'warm');
    if (mood === 'gentle' || MASCOT.has(id)) mood = 'warm';
    const key = `${voiceFor(id)}|${mood}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const review = [];
  outer: for (const [key, items] of groups) {
    const [v, mood] = key.split('|');
    // «С интересом» (вопросы, звуки, эхо по слогам) модель читает с длинными паузами между словами,
    // и на 7 фразах разрезы съезжают: 20.10 из 6 таких пачек 4 ушли в брак. По 4 фразы — надёжнее.
    const step = mood === 'curious' ? Math.min(size, 4) : size;
    for (let i = 0; i < items.length; i += step) {
      const chunk = items.slice(i, i + step);
      try {
        const pcm = await withRetry(() => tts(batchPrompt(chunk, mood), v, model), `${key} ×${chunk.length}`);
        const batchId = `batch-${Date.now()}`;
        keepRaw(batchId, pcm);
        writeFileSync(`${RAW}/${batchId}.json`, JSON.stringify(chunk.map(([id]) => id)));
        const parts = splitPhrases(pcm, chunk.map(([, p]) => phraseWeight(p.text)));
        if (!parts) {
          console.log(`✗ ${key}: не удалось разрезать на ${chunk.length} фраз — эти фразы озвучу поштучно`);
          failed.push(...chunk.map(([id]) => id));
          continue;
        }
        // Проверка правдоподобия: у хороших записей 0,08–0,18 с на единицу веса (медиана 0,11).
        // Модель бывает недочитывает пачку или зачитывает вслух саму инструкцию (так было с gemini-3.8-flash-tts) —
        // тогда куски выходят за 0,05–0,3, и вся пачка отбрасывается: соседние фразы при этом тоже съезжают.
        const clean = parts.map((part) => polish(part));
        const rates = clean.map((c, k) => c.length / RATE / phraseWeight(chunk[k][1].text));
        const med = [...rates].sort((a, b) => a - b)[Math.floor(rates.length / 2)];
        // медиана: <0,07 — модель тянула паузы между словами и разрезы прошли посреди фраз;
        // >0,22 — читала лишнее. Неторопливое чтение (медиана ~0,19) расшифровка признала верным.
        const odd = rates.map((r, k) => (r < 0.05 || r > 0.3 || med < 0.07 || med > 0.22 ? chunk[k][0] : null)).filter(Boolean);
        if (odd.length) {
          console.log(`✗ ${key}: неправдоподобная длительность у ${odd.join(', ')} — пачка отброшена (сырой звук: ${RAW}/${batchId}.pcm)`);
          failed.push(...chunk.map(([id]) => id));
          await sleep(Number(args.delay ?? 3000));
          continue;
        }
        clean.forEach((c, k) => {
          const [id, p] = chunk[k];
          writeVoice(id, c);
          made++;
          review.push(id);
          console.log(`✓ ${id}  «${p.text}»  ${(c.length / RATE).toFixed(1)} с  [${v}]`);
        });
      } catch (e) {
        console.log(`✗ ${key}: ${e.message}`);
        failed.push(...chunk.map(([id]) => id));
        if (e.status === 429) {
          console.log('Лимит запросов исчерпан — запустите снова позже, готовые файлы пропустятся.');
          break outer;
        }
      }
      await sleep(Number(args.delay ?? 3000));
    }
  }
  // пачечные файлы обязательно проверить расшифровкой: нарезка может съехать при правдоподобных длительностях
  if (review.length) writeFileSync('voice/new.txt', review.join('\n') + '\n');
  console.log(
    `\nГотово: новых ${made}, уже были ${skipped}, не вышло ${failed.length}.` +
      (review.length ? `\nПроверьте новые (${review.length}): npm run voice:qa -- --no-trim --only=voice/new.txt --delete-bad` : ''),
  );
  process.exit(0);
}

for (const [id, p] of todo) {
  const file = `${OUT}/${id}.mp3`;
  try {
    const pcm = await withRetry(() => tts(promptFor(id, p), voiceFor(id), model), id);
    keepRaw(id, pcm);
    writeVoice(id, polish(pcm));
    made++;
    console.log(`✓ ${id}  «${p.text}»`);
  } catch (e) {
    failed.push(id);
    console.log(`✗ ${id}: ${e.message}`);
    if (e.status === 429 && /quota|day|daily/i.test(e.message)) {
      console.log('Дневной лимит бесплатного ключа исчерпан — запустите скрипт снова завтра, готовые файлы пропустятся.');
      break;
    }
  }
  await sleep(Number(args.delay ?? 2500));
}
console.log(`\nГотово: новых ${made}, уже были ${skipped}, ошибок ${failed.length}${failed.length ? ` (${failed.join(', ')})` : ''}. Голос: ${voice}`);
