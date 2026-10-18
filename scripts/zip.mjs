// Упаковка dist/ в архив для Консоли Яндекс Игр с проверкой требований:
// п. 1.21 — не больше 100 МБ в распакованном виде; п. 1.22 — index.html в корне, имена без пробелов и кириллицы.
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';

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

if (problems.length) {
  console.error('Архив не собран:\n- ' + problems.join('\n- '));
  process.exit(1);
}

mkdirSync('release', { recursive: true });
const out = `release/talking-pictures-${pkg.version}.zip`;
const zip = zipSync(files);
writeFileSync(out, zip);
console.log(`✓ ${out}: ${Object.keys(files).length} файлов, ${(total / 1048576).toFixed(2)} МБ → ${(zip.length / 1048576).toFixed(2)} МБ в архиве`);
