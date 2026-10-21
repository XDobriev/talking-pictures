// Настоящие звуки животных из BigSoundBank (CC0) и Викисклада (Public domain / CC0) → src/assets/sfx/<name>.mp3 + LICENSES.md.
//
//   node scripts/sfx.mjs            — скачать недостающие и обработать
//   node scripts/sfx.mjs --force    — переделать все
//
// Сайт закрыт от простых запросов (403), поэтому качаем через настоящий браузер (Playwright).
// Перед скачиванием проверяем, что на странице звука указана лицензия CC0.
// Обработка: самый громкий фрагмент нужной длины → обрезка тишины → пик −9 дБ (тише голоса) → моно mp3.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import { MPEGDecoder } from 'mpg123-decoder';
import { chromium } from 'playwright';
import { toMp3 } from './lib/audio.mjs';

// Стандарт длины (21.10, по прослушиванию): короче ~2 с ребёнок не успевает узнать животное.
// Длинный исходник — окно LEN с самым громким местом; короткий крик (лай, мяу, уханье, звонок) с repeat —
// повторяется с паузой GAP, как в звукоподражании: «гав-гав», «у-ух, у-ух», «дзынь-дзынь».
const LEN = 2.6;
const MIN_LEN = 2.0;
const GAP = 0.35;

// name — SfxName в игре; id — номер звука на bigsoundbank.com; max — окно в секундах (по умолчанию LEN).
// Одобренные на слух 20.10 (moo, neigh, crow, quack, tweet, peep, horn, honk, coo) — со своими max, не трогать.
const SOURCES = [
  { name: 'moo', id: 2383, max: 2.2, who: 'коровка' },
  { name: 'bark', id: 682, repeat: true, who: 'щенок' },
  { name: 'meow', id: 1890, max: 1.4, repeat: true, who: 'кошка' }, // одно «мяу» 1,9 с — два подряд выходили 4,2 с
  { name: 'baa', id: 2343, max: 1.4, who: 'овечка' },
  { name: 'bleat', id: 279, repeat: true, who: 'коза' },
  { name: 'cluck', id: 453, who: 'курочка' },
  { name: 'neigh', id: 284, max: 2.0, who: 'лошадка' },
  { name: 'crow', id: 283, max: 2.8, who: 'петушок' },
  { name: 'hoot', id: 3459, repeat: true, who: 'сова' },
  { name: 'quack', id: 276, max: 1.2, who: 'уточка' },
  { name: 'croak', id: 819, max: 1.4, who: 'лягушка' },
  { name: 'buzz', id: 1000, who: 'пчёлка, божья коровка' },
  { name: 'squeak', id: 459, max: 1.0, who: 'белочка, мышка' },
  { name: 'tweet', id: 1670, max: 1.4, who: 'синичка' },
  { name: 'peep', id: 672, max: 1.2, who: 'цыплёнок' },
  { name: 'horn', id: 258, max: 1.2, who: 'машина' },
  { name: 'bell', id: 275, repeat: true, who: 'велосипед' },
  // На BigSoundBank нет гуся и воркования голубей — берём с Викисклада, только общественное достояние / CC0.
  // До 20.10 гусь «говорил» кряканьем утки (quack): в загадке «кто так говорит?» это сбивало бы ребёнка.
  { name: 'honk', commons: 'File:Geese Honking (loud).ogg', max: 1.6, who: 'гусь' },
  { name: 'coo', commons: 'File:Dove cooing.ogg', max: 2.0, who: 'голуби' },
  // Кухня (21.10): загадки «что капает?» и «что булькает?» — тоже настоящие записи, не синтез.
  // «Water drops dripping» с Викисклада — CC BY-SA, не подходит; берём «Drops of water #1» из BigSoundBank (CC0).
  { name: 'drops', id: 1384, who: 'кран: кап-кап' },
  { name: 'boil', commons: 'File:Boiling lentils.ogg', who: 'кастрюля: буль-буль' },
];
// Варианты на выбор по слуху (--candidates → voice-compare/sfx-21-10/, в игру не попадают):
// овечку, лягушку и «белочку/мышку» 20.10 на слух не узнали.
const CANDIDATES = [
  { name: 'ovechka-1', id: 2344, repeat: true, who: 'овечка: Sheep #2' },
  { name: 'ovechka-2', id: 2345, repeat: true, who: 'овечка: Sheep #3' },
  { name: 'ovechka-3', commons: 'File:Sheep bleating.ogg', repeat: true, who: 'овечка: Sheep bleating' },
  { name: 'ovechka-4', commons: 'File:Sheep bleat.ogg', repeat: true, who: 'овечка: Sheep bleat' },
  { name: 'lyagushka-1', id: 997, who: 'лягушка: Frogs #1' },
  { name: 'lyagushka-2', id: 998, who: 'лягушка: Frogs #2' },
  { name: 'lyagushka-3', commons: 'File:VoiceRecord02 11 2024 19 11frogmtr24a.oga', who: 'лягушка: запись с Викисклада' },
  { name: 'myshka-1', id: 1073, repeat: true, who: 'мышка: Garden dormouse (соня)' },
  { name: 'belochka-1', id: 185, who: 'белочка грызёт орешек: Rat nibbling' },
];

const keyOf = (s) => (s.commons ? `commons-${s.commons.replace(/^File:|\.\w+$/g, '').replace(/\W+/g, '_')}` : String(s.id));
const FREE = /^(public domain|cc0)/i;

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const force = process.argv.includes('--force');
// --only=bark,meow — переделать только эти (одобренные на слух остаются как есть)
const only = arg('only')?.split(',');
const candidates = process.argv.includes('--candidates');
const LIST = candidates ? CANDIDATES : SOURCES;
const CACHE = 'sfx-src'; // исходники (не в git)
const OUT = candidates ? 'voice-compare/sfx-21-10' : 'src/assets/sfx';
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

// ---------- скачивание ----------
const meta = existsSync(`${CACHE}/meta.json`) ? JSON.parse(readFileSync(`${CACHE}/meta.json`, 'utf8')) : {};
// Викисклад отдаёт файлы и сведения о лицензии через открытый API — браузер не нужен.
for (const s of LIST.filter((x) => x.commons && !existsSync(`${CACHE}/${keyOf(x)}.mp3`))) {
  const UA = { 'User-Agent': 'talking-pictures-sfx/1.0 (educational kids game)' };
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(s.commons)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;
  const page = Object.values((await (await fetch(api, { headers: UA })).json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  const license = info?.extmetadata?.LicenseShortName?.value ?? '';
  if (!info || !FREE.test(license)) {
    console.log(`✗ ${s.name}: ${s.commons} — лицензия «${license || '?'}», нужна Public domain / CC0 — пропускаю`);
    continue;
  }
  const raw = `${CACHE}/${keyOf(s)}.src${s.commons.match(/\.\w+$/)?.[0] ?? ''}`;
  writeFileSync(raw, Buffer.from(await (await fetch(info.url, { headers: UA })).arrayBuffer()));
  // декодер в обработке понимает только mp3 — переводим ffmpeg'ом
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', raw, '-ac', '1', '-c:a', 'libmp3lame', '-q:a', '2', `${CACHE}/${keyOf(s)}.mp3`]);
  const artist = (info.extmetadata.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim();
  meta[keyOf(s)] = { title: s.commons.replace(/^File:/, ''), url: info.descriptionurl, license, artist };
  console.log(`↓ ${s.name}: «${meta[keyOf(s)].title}» (${license}${artist ? `, ${artist}` : ''})`);
  writeFileSync(`${CACHE}/meta.json`, JSON.stringify(meta, null, 2));
}

const need = LIST.filter((s) => !s.commons && !existsSync(`${CACHE}/${s.id}.mp3`));
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

function extract(ch, rate, max, repeat) {
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
  const once = ch.slice(Math.max(0, (at + a) * frame - pad), Math.min(ch.length, (at + b + 1) * frame + pad));
  // плавные края у каждого повтора — без щелчков на стыках
  const fadeIn = Math.round(rate * 0.01);
  const fadeOut = Math.round(rate * 0.08);
  for (let i = 0; i < once.length; i++) {
    if (i < fadeIn) once[i] *= i / fadeIn;
    if (i > once.length - fadeOut) once[i] *= (once.length - i) / fadeOut;
  }
  // короткий крик — повторить с паузой, пока не наберётся MIN_LEN (не больше 3 раз)
  let copies = 1;
  if (repeat) while (copies < 3 && (copies * once.length + (copies - 1) * GAP * rate) / rate < MIN_LEN) copies++;
  const gapLen = Math.round(GAP * rate);
  const cut = new Float32Array(copies * once.length + (copies - 1) * gapLen);
  for (let k = 0; k < copies; k++) cut.set(once, k * (once.length + gapLen));
  let peak = 1e-6;
  for (const v of cut) peak = Math.max(peak, Math.abs(v));
  const gain = 0.355 / peak; // −9 дБ
  const out = new Int16Array(cut.length);
  for (let i = 0; i < cut.length; i++) out[i] = Math.max(-32768, Math.min(32767, Math.round(cut[i] * gain * 32767)));
  return out;
}

const decoder = new MPEGDecoder();
await decoder.ready;
const rows = [];
for (const s of LIST) {
  const src = `${CACHE}/${keyOf(s)}.mp3`;
  if (!existsSync(src)) continue;
  const out = `${OUT}/${s.name}.mp3`;
  const m = meta[keyOf(s)] ?? { title: `#${s.id}`, url: `https://bigsoundbank.com/` };
  const by = s.commons ? `Викисклад${m.artist ? `, ${m.artist}` : ''}` : 'BigSoundBank, Joseph Sardin';
  rows.push(`| \`${s.name}.mp3\` | ${s.who} | [${m.title}](${m.url}) — ${by} | ${m.license ?? 'CC0 1.0'} |`);
  const redo = force || candidates || only?.includes(s.name);
  if (existsSync(out) && !redo) continue;
  await decoder.reset();
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(readFileSync(src)));
  // в моно
  const mono = new Float32Array(channelData[0].length);
  for (const c of channelData) for (let i = 0; i < mono.length; i++) mono[i] += c[i] / channelData.length;
  const pcm = extract(mono, sampleRate, s.max ?? LEN, s.repeat);
  writeFileSync(out, toMp3(pcm, sampleRate));
  console.log(`✓ ${out}: ${(pcm.length / sampleRate).toFixed(2)} с, ${sampleRate} Гц`);
}
decoder.free();

if (candidates) {
  // для выбора на слух — табличка рядом с файлами, LICENSES.md игры не трогаем
  writeFileSync(`${OUT}/ИСТОЧНИКИ.md`, `| Файл | Что | Исходная запись | Лицензия |\n|---|---|---|---|\n${rows.join('\n')}\n`);
  console.log(`\nВарианты: ${rows.length} → ${OUT}/`);
  process.exit(0);
}

writeFileSync(
  `${OUT}/LICENSES.md`,
  `# Звуки: источники и лицензии\n\nЗаписи — [BigSoundBank](https://bigsoundbank.com/licenses.html) (Joseph Sardin, лицензия **CC0 1.0**) ` +
    `и [Викисклад](https://commons.wikimedia.org/) (только **Public domain** / **CC0**): ` +
    `коммерческое использование разрешено, указание автора не обязательно. ` +
    `Обработка: фрагмент, обрезка тишины, громкость, моно — \`scripts/sfx.mjs\`.\n\n| Файл | Кто | Исходная запись | Лицензия |\n|---|---|---|---|\n${rows.join('\n')}\n\n` +
    `Звуки, которых нет в таблице, синтезируются в коде (\`src/audio/sfx.ts\`).\n`,
);
console.log(`\nГотово: ${rows.length} звуков, лицензии — ${OUT}/LICENSES.md`);
