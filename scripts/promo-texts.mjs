// Проверка длины текстов карточки (promo/texts.md) по лимитам Консоли Яндекс Игр.
import { readFileSync } from 'node:fs';

const LIMITS = {
  'Название': [1, 50],
  'Короткое описание': [1, 70],
  'SEO-описание': [50, 160],
  'Об игре': [100, 1000],
  'Как играть': [100, 1000],
};
const md = readFileSync('promo/texts.md', 'utf8');
let bad = 0;
for (const part of md.split(/^## /m).slice(1)) {
  const [head, ...rest] = part.split('\n');
  const name = head.replace(/\s*\(.*$/, '').trim();
  const text = rest.join('\n').trim();
  const [min, max] = LIMITS[name] ?? [0, Infinity];
  const ok = text.length >= min && text.length <= max;
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${name}: ${text.length} (${min}–${max})`);
}
process.exitCode = bad ? 1 : 0;
