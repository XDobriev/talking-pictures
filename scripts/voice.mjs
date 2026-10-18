// Озвучка всех фраз игры нейросетью Gemini TTS → src/assets/voice/<id>.mp3
//
//   node scripts/voice.mjs --cast            — кастинг: 3 фразы × несколько голосов → voice-casting/ (слушать и выбрать)
//   node scripts/voice.mjs --voice=Sulafat   — озвучить всё выбранным голосом (готовые файлы пропускаются)
//   node scripts/voice.mjs --only=owl_name,owl_fact --force   — переозвучить отдельные фразы
//   node scripts/voice.mjs --csv             — выгрузить таблицу фраз в voice/phrases.csv (для SpeechKit и проверки)
//
// Ключ: GEMINI_API_KEY в файле .env (Google AI Studio → Create API key). В репозиторий .env не попадает.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Mp3Encoder } from '@breezystack/lamejs';
import { PHRASES } from '../src/data/phrases.ts';

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
    const err = new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
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

/** Обрезать тишину по краям, оставить 80 мс воздуха, нормализовать пик до −1 дБ. */
function polish(pcm) {
  const thr = 300;
  let a = 0;
  let b = pcm.length - 1;
  while (a < b && Math.abs(pcm[a]) < thr) a++;
  while (b > a && Math.abs(pcm[b]) < thr) b--;
  const pad = Math.round(RATE * 0.08);
  const cut = pcm.slice(Math.max(0, a - pad), Math.min(pcm.length, b + pad));
  let peak = 1;
  for (const s of cut) peak = Math.max(peak, Math.abs(s));
  const gain = Math.min(4, (32767 * 0.89) / peak);
  return cut.map((s) => Math.max(-32768, Math.min(32767, Math.round(s * gain))));
}

function toMp3(pcm) {
  const enc = new Mp3Encoder(1, RATE, 64);
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (out.length) chunks.push(Buffer.from(out));
  }
  const end = enc.flush();
  if (end.length) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const retriable = e.status === 429 || e.status === 'noaudio' || e.status >= 500;
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
const voice = String(args.voice ?? process.env.GEMINI_TTS_VOICE ?? 'Sulafat');
const only = args.only ? String(args.only).split(',') : null;
mkdirSync(OUT, { recursive: true });
let made = 0;
let skipped = 0;
const failed = [];
for (const [id, p] of Object.entries(PHRASES)) {
  if (only && !only.includes(id)) continue;
  const file = `${OUT}/${id}.mp3`;
  if (existsSync(file) && !args.force) {
    skipped++;
    continue;
  }
  try {
    const pcm = await withRetry(() => tts(promptFor(id, p), voice), id);
    writeFileSync(file, toMp3(polish(pcm)));
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
