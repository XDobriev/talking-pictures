// Настоящие звуки животных из BigSoundBank (CC0) → src/assets/sfx/<name>.mp3 + LICENSES.md.
//
//   node scripts/sfx.mjs            — скачать недостающие и обработать
//   node scripts/sfx.mjs --force    — переделать все
//
// Сайт закрыт от простых запросов (403), поэтому качаем через настоящий браузер (Playwright).
// Перед скачиванием проверяем, что на странице звука указана лицензия CC0.
// Обработка: самый громкий фрагмент нужной длины → обрезка тишины → пик −9 дБ (тише голоса) → моно mp3.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { MPEGDecoder } from 'mpg123-decoder';
import { chromium } from 'playwright';
import { toMp3 } from './lib/audio.mjs';

// name — SfxName в игре; id — номер звука на bigsoundbank.com; max — сколько секунд оставить
const SOURCES = [
  { name: 'moo', id: 2383, max: 2.2, who: 'коровка' },
  { name: 'bark', id: 682, max: 1.2, who: 'щенок' },
  { name: 'meow', id: 1890, max: 1.6, who: 'кошка' },
  { name: 'baa', id: 2343, max: 1.4, who: 'овечка' },
  { name: 'bleat', id: 279, max: 1.6, who: 'коза' },
  { name: 'cluck', id: 453, max: 1.6, who: 'курочка' },
  { name: 'neigh', id: 284, max: 2.0, who: 'лошадка' },
  { name: 'crow', id: 283, max: 2.8, who: 'петушок' },
  { name: 'hoot', id: 3459, max: 1.8, who: 'сова' },
  { name: 'quack', id: 276, max: 1.2, who: 'уточка, гусь' },
  { name: 'croak', id: 819, max: 1.4, who: 'лягушка' },
  { name: 'buzz', id: 1000, max: 1.4, who: 'пчёлка, божья коровка' },
  { name: 'squeak', id: 459, max: 1.0, who: 'белочка, мышка' },
  { name: 'tweet', id: 1670, max: 1.4, who: 'синичка' },
  { name: 'peep', id: 672, max: 1.2, who: 'цыплёнок' },
];

const force = process.argv.includes('--force');
const CACHE = 'sfx-src'; // исходники (не в git)
const OUT = 'src/assets/sfx';
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

// ---------- скачивание ----------
const meta = existsSync(`${CACHE}/meta.json`) ? JSON.parse(readFileSync(`${CACHE}/meta.json`, 'utf8')) : {};
const need = SOURCES.filter((s) => !existsSync(`${CACHE}/${s.id}.mp3`));
if (need.length) {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  for (const s of need) {
    const num = String(s.id).padStart(4, '0');
    const url = `https://bigsoundbank.com/sound-${num}.html`;
    const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
    const title = (await page.title()).replace(/\s+—.*$/, '');
    if (!res?.ok()) {
      console.log(`✗ ${s.name}: страница ${url} — HTTP ${res?.status()}`);
      continue;
    }
    const body = await page.textContent('body');
    if (!/CC0/.test(body ?? '')) {
      console.log(`✗ ${s.name}: на странице ${url} не найдена лицензия CC0 — пропускаю`);
      continue;
    }
    const mp3 = await page.request.get(`https://bigsoundbank.com/UPLOAD/mp3/${num}.mp3`);
    if (!mp3.ok()) {
      console.log(`✗ ${s.name}: файл — HTTP ${mp3.status()}`);
      continue;
    }
    writeFileSync(`${CACHE}/${s.id}.mp3`, await mp3.body());
    meta[s.id] = { title, url };
    console.log(`↓ ${s.name}: «${title}»`);
  }
  await browser.close();
  writeFileSync(`${CACHE}/meta.json`, JSON.stringify(meta, null, 2));
}

// ---------- обработка ----------
function frameRms(pcm, frame) {
  const n = Math.floor(pcm.length / frame);
  const out = new Float64Array(n);
  for (let f = 0; f < n; f++) {
    let s = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) s += pcm[i] * pcm[i];
    out[f] = Math.sqrt(s / frame);
  }
  return out;
}

function extract(ch, rate, max) {
  const frame = Math.round(rate * 0.02);
  const rms = frameRms(ch, frame);
  // окно max секунд с наибольшей энергией
  const win = Math.min(rms.length, Math.round(max / 0.02));
  let sum = 0;
  for (let i = 0; i < win; i++) sum += rms[i] ** 2;
  let best = sum;
  let at = 0;
  for (let i = win; i < rms.length; i++) {
    sum += rms[i] ** 2 - rms[i - win] ** 2;
    if (sum > best) [best, at] = [sum, i - win + 1];
  }
  // внутри окна — обрезка тихих краёв относительно пика окна
  const seg = rms.subarray(at, at + win);
  const peakRms = Math.max(...seg);
  let a = 0;
  let b = seg.length - 1;
  while (a < b && seg[a] < peakRms * 0.08) a++;
  while (b > a && seg[b] < peakRms * 0.08) b--;
  const pad = Math.round(rate * 0.03);
  const cut = ch.slice(Math.max(0, (at + a) * frame - pad), Math.min(ch.length, (at + b + 1) * frame + pad));
  let peak = 1e-6;
  for (const v of cut) peak = Math.max(peak, Math.abs(v));
  const gain = 0.355 / peak; // −9 дБ
  const out = new Int16Array(cut.length);
  const fadeIn = Math.round(rate * 0.01);
  const fadeOut = Math.round(rate * 0.12);
  for (let i = 0; i < cut.length; i++) {
    let g = gain;
    if (i < fadeIn) g *= i / fadeIn;
    if (i > cut.length - fadeOut) g *= (cut.length - i) / fadeOut;
    out[i] = Math.max(-32768, Math.min(32767, Math.round(cut[i] * g * 32767)));
  }
  return out;
}

const decoder = new MPEGDecoder();
await decoder.ready;
const rows = [];
for (const s of SOURCES) {
  const src = `${CACHE}/${s.id}.mp3`;
  if (!existsSync(src)) continue;
  const out = `${OUT}/${s.name}.mp3`;
  const m = meta[s.id] ?? { title: `#${s.id}`, url: `https://bigsoundbank.com/` };
  rows.push(`| \`${s.name}.mp3\` | ${s.who} | [${m.title}](${m.url}) | CC0 1.0 |`);
  if (existsSync(out) && !force) continue;
  await decoder.reset();
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(readFileSync(src)));
  // в моно
  const mono = new Float32Array(channelData[0].length);
  for (const c of channelData) for (let i = 0; i < mono.length; i++) mono[i] += c[i] / channelData.length;
  const pcm = extract(mono, sampleRate, s.max);
  writeFileSync(out, toMp3(pcm, sampleRate));
  console.log(`✓ ${out}: ${(pcm.length / sampleRate).toFixed(2)} с, ${sampleRate} Гц`);
}
decoder.free();

writeFileSync(
  `${OUT}/LICENSES.md`,
  `# Звуки: источники и лицензии\n\nВсе записи — [BigSoundBank](https://bigsoundbank.com/licenses.html) (Joseph Sardin), лицензия **CC0 1.0** ` +
    `(общественное достояние): коммерческое использование разрешено, указание автора не обязательно. ` +
    `Обработка: фрагмент, обрезка тишины, громкость, моно — \`scripts/sfx.mjs\`.\n\n| Файл | Кто | Исходная запись | Лицензия |\n|---|---|---|---|\n${rows.join('\n')}\n\n` +
    `Звуки, которых нет в таблице, синтезируются в коде (\`src/audio/sfx.ts\`).\n`,
);
console.log(`\nГотово: ${rows.length} звуков, лицензии — ${OUT}/LICENSES.md`);
