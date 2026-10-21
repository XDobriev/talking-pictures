// Упаковка dist/ в архив для Консоли Яндекс Игр с проверкой требований:
// п. 1.21 — не больше 100 МБ в распакованном виде; п. 1.22 — index.html в корне, имена без пробелов и кириллицы.
import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';
import { PHRASES } from '../src/data/phrases.ts';
import { RELEASE_SCENES, requiredPhrases } from '../src/data/release.ts';
import { ALL_SCENES } from '../src/data/scenes/index.ts';

// Выпущенные id уровней и героев — по ним в сохранениях игроков лежат пройденные уровни и наклейки.
// Файл пополняется после каждой сборки архива; тест src/game/release.test.ts не даёт их переименовать или удалить.
const IDS_FILE = 'release-ids.json';

const DIST = 'dist';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const files = {};
let total = 0;
const problems = [];

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(DIST, full).split('\\').join('/');
    if (/[\s]|[^\x20-\x7e]/.test(rel)) problems.push(`недопустимое имя (пробел/кириллица): ${rel}`);
    if (statSync(full).isDirectory()) walk(full);
    else {
      const buf = readFileSync(full);
      total += buf.length;
      files[rel] = [buf, { level: /\.(png|webp|jpg|mp3|ogg|woff2?)$/.test(rel) ? 0 : 9 }];
    }
  }
};
walk(DIST);

if (!files['index.html']) problems.push('нет index.html в корне');
if (total > 100 * 1024 * 1024) problems.push(`размер ${(total / 1048576).toFixed(1)} МБ > 100 МБ`);
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
if (!html.includes('src="/sdk.js"')) problems.push('в index.html нет <script src="/sdk.js">');
if (/https?:\/\/(?!sdk\.games\.s3)/.test(html.replace(/xmlns="[^"]+"/g, ''))) problems.push('в index.html есть внешние ссылки');

// Выпускаемые сцены (src/data/release.ts) должны существовать.
for (const id of RELEASE_SCENES) if (!ALL_SCENES.some((s) => s.id === id)) problems.push(`в RELEASE_SCENES есть «${id}», а такой сцены нет`);

// в релизе нет запасного синтеза речи (src/audio/voice.ts) — без файла фраза просто не прозвучит.
// Нужны общие фразы и фразы выпускаемых сцен; будущие сцены релиз не держат.
const required = requiredPhrases(ALL_SCENES, Object.keys(PHRASES));
const voiced = new Set(readdirSync('src/assets/voice').map((f) => f.replace(/\.\w+$/, '')));
const silent = required.filter((id) => !voiced.has(id));
if (silent.length) problems.push(`не озвучено ${silent.length} фраз выпускаемых сцен (npm run voice): ${silent.slice(0, 8).join(', ')}${silent.length > 8 ? '…' : ''}`);
// каждый файл голоса должен пройти проверку расшифровкой (реестр ведёт scripts/voice-qa.mjs)
const verified = new Set(existsSync('voice/verified.txt') ? readFileSync('voice/verified.txt', 'utf8').split(/\s+/).filter(Boolean) : []);
const unverified = required.filter((id) => voiced.has(id) && !verified.has(id));

// Уже выпущенные уровни и герои не должны пропадать: у игроков по ним сохранён прогресс.
const releasedIds = existsSync(IDS_FILE) ? JSON.parse(readFileSync(IDS_FILE, 'utf8')) : { levels: [], objects: [] };
const nowLevels = new Set(ALL_SCENES.flatMap((s) => s.levels.map((l) => l.id)));
const nowObjects = new Set(ALL_SCENES.flatMap((s) => s.objects.map((o) => o.id)));
const lost = [...releasedIds.levels.filter((id) => !nowLevels.has(id)), ...releasedIds.objects.filter((id) => !nowObjects.has(id))];
if (lost.length) problems.push(`пропали id, которые уже у игроков в сохранениях: ${lost.join(', ')}`);
if (unverified.length) problems.push(`не проверено расшифровкой ${unverified.length} файлов (npm run voice:qa -- --unverified --no-trim --delete-bad): ${unverified.slice(0, 8).join(', ')}`);

if (problems.length) {
  console.error('Архив не собран:\n- ' + problems.join('\n- '));
  process.exit(1);
}

mkdirSync('release', { recursive: true });
const out = `release/talking-pictures-${pkg.version}.zip`;
const zip = zipSync(files);
writeFileSync(out, zip);
console.log(`✓ ${out}: ${Object.keys(files).length} файлов, ${(total / 1048576).toFixed(2)} МБ → ${(zip.length / 1048576).toFixed(2)} МБ в архиве`);
console.log(`  сцены: ${RELEASE_SCENES.join(', ')}`);

const released = ALL_SCENES.filter((s) => RELEASE_SCENES.includes(s.id));
const merge = (old, add) => [...new Set([...old, ...add])].sort();
writeFileSync(
  IDS_FILE,
  JSON.stringify(
    {
      levels: merge(releasedIds.levels, released.flatMap((s) => s.levels.map((l) => l.id))),
      objects: merge(releasedIds.objects, released.flatMap((s) => s.objects.map((o) => o.id))),
    },
    null,
    2,
  ) + '\n',
);
console.log(`  ${IDS_FILE} обновлён — закоммитьте его вместе с версией`);
