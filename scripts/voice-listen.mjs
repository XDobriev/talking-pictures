// Страница для прослушивания озвучки человеком: voice/listen.html (открывается прямо с диска).
//   npm run voice:listen            — все готовые фразы
//   npm run voice:listen -- --new   — только ещё не оценённые на слух (нет в voice/heard.txt)
//   npm run voice:listen -- --compare=sfx-21-10,tasks-21-10 — сверху варианты на выбор из voice-compare/<папка>/
//   npm run voice:listen -- --recheck — все фразы с чистыми оценками (прежние отметки в браузере не подхватываются)
// На странице: текст фразы, кнопка «играть», оценка «пойдёт» / «переделать» + причина.
// Оценки хранятся в браузере; «Скопировать итог» даёт текст, который нужно вставить Claude.
// Оценка сбрасывается сама, если файл переозвучили (ключ — id + размер файла).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { exec } from 'node:child_process';
import { resolve } from 'node:path';
import { PHRASES } from '../src/data/phrases.ts';

const DIR = 'src/assets/voice';
const OUT = 'voice/listen.html';
const onlyNew = process.argv.includes('--new');
const storeKey = process.argv.includes('--recheck') ? `tp-voice-recheck-${Date.now()}` : 'tp-voice-listen';
const heard = new Set(existsSync('voice/heard.txt') ? readFileSync('voice/heard.txt', 'utf8').split(/\s+/).filter(Boolean) : []);
const verified = new Set(existsSync('voice/verified.txt') ? readFileSync('voice/verified.txt', 'utf8').split(/\s+/).filter(Boolean) : []);
const files = new Set(readdirSync(DIR).filter((f) => f.endsWith('.mp3')).map((f) => f.replace(/\.mp3$/, '')));

// Группа — герой («squirrel_ask» → «белочка»), общие фразы — отдельно.
const KINDS = ['_ask', '_name', '_fact', '_echo', '_sound', '_helped'];
const groupOf = (id) => {
  const k = KINDS.find((s) => id.endsWith(s));
  return k ? id.slice(0, -k.length) : '';
};
const title = (g) => (g ? (PHRASES[`${g}_name`]?.text ?? g).replace(/^Это\s+/, '').split(/[.!?…]/)[0] : 'Общие фразы и задания');

const items = Object.entries(PHRASES)
  .filter(([id]) => files.has(id) && (!onlyNew || !heard.has(id)))
  .map(([id, p]) => ({
    id,
    text: p.text,
    stressed: (p.stressed ?? '').replace(/\+([аеёиоуыэюяАЕЁИОУЫЭЮЯ])/g, '$1́'),
    group: groupOf(id),
    size: statSync(`${DIR}/${id}.mp3`).size,
    verified: verified.has(id),
    src: `../${DIR}/${id}.mp3`,
  }));
const groups = [...new Set(items.map((i) => i.group))].map((g) => ({ g, title: title(g), items: items.filter((i) => i.group === g) }));

// Записи животных: в уровнях «на слух» по ним ребёнок угадывает героя — главное, чтобы животное узнавалось.
// Кто есть кто — из таблицы src/assets/sfx/LICENSES.md (её пишет scripts/sfx.mjs). В heard.txt — как «sfx:<имя>».
const SFX = 'src/assets/sfx';
const sfxItems = [...readFileSync(`${SFX}/LICENSES.md`, 'utf8').matchAll(/^\| `(\w+)\.mp3` \| ([^|]+) \|/gm)]
  .map(([, name, who]) => ({ id: `sfx:${name}`, name, who: who.trim() }))
  .filter((s) => existsSync(`${SFX}/${s.name}.mp3`) && (!onlyNew || !heard.has(s.id)))
  .map((s) => ({
    id: s.id,
    text: `Звук: ${s.who}`,
    stressed: '',
    group: 'sfx',
    size: statSync(`${SFX}/${s.name}.mp3`).size,
    verified: true,
    src: `../${SFX}/${s.name}.mp3`,
    reasons: ['не узнаётся', 'шум', 'тихо', 'громко', 'обрезано'],
  }));
if (sfxItems.length) groups.unshift({ g: 'sfx', title: 'Звуки животных — узнаётся ли, кто это?', items: sfxItems });
items.push(...sfxItems);

// --compare=sfx-21-10,tasks-21-10 — варианты на выбор из voice-compare/<папка>/ (в игру не попали), в начале страницы.
// «a-было-<id>» / «b-стало-<id>» — пара для фразы; «<имя>-N» — варианты звука (подписи — из ИСТОЧНИКИ.md рядом).
// В итоге — как «cmp:<папка>/<файл>».
const compare = process.argv.find((a) => a.startsWith('--compare='))?.split('=')[1]?.split(',') ?? [];
const cmpGroups = [];
for (const folder of compare) {
  const dir = `voice-compare/${folder}`;
  if (!existsSync(dir)) continue;
  const notes = existsSync(`${dir}/ИСТОЧНИКИ.md`)
    ? Object.fromEntries([...readFileSync(`${dir}/ИСТОЧНИКИ.md`, 'utf8').matchAll(/^\| `([\w-]+)\.mp3` \| ([^|]+) \|/gm)].map(([, f, w]) => [f, w.trim()]))
    : {};
  const byKey = new Map();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mp3')).sort()) {
    const name = f.replace(/\.mp3$/, '');
    const pair = name.match(/^[ab]-(было|стало)-(.+)$/);
    const key = pair ? pair[2] : name.replace(/-\d+$/, '');
    const phrase = pair && PHRASES[key];
    const it = {
      id: `cmp:${folder}/${name}`,
      text: pair ? `${pair[1] === 'было' ? 'Было' : 'Стало'}: ${phrase?.text ?? key}` : `Вариант ${name.match(/-(\d+)$/)?.[1] ?? ''} — ${notes[name] ?? name}`,
      stressed: '',
      group: `cmp:${folder}/${key}`,
      size: statSync(`${dir}/${f}`).size,
      verified: true,
      src: `../${dir}/${f}`,
      reasons: pair ? ['лучше другой', 'интонация', 'быстро', 'медленно', 'ударение'] : ['не узнаётся', 'шум', 'тихо', 'громко', 'обрезано'],
    };
    if (!byKey.has(key)) byKey.set(key, { title: pair ? `«${phrase?.text ?? key}» — было или стало? Пометь «пойдёт» лучший` : `Выбери вариант: ${(notes[name] ?? key).split(':')[0]} — пометь «пойдёт» подходящие`, items: [] });
    byKey.get(key).items.push(it);
  }
  for (const [key, g] of byKey) cmpGroups.push({ g: `cmp:${folder}/${key}`, ...g });
}
groups.unshift(...cmpGroups);
items.push(...cmpGroups.flatMap((g) => g.items));

const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Прослушивание озвучки</title>
<style>
:root{--paper:#f6efe1;--card:#fffaf0;--ink:#3d3a2f;--soft:#6b6453;--ok:#3f5a32;--bad:#a8324a;--focus:#e0a43a;--line:#d9c7a4}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.4 system-ui,'Segoe UI',sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--paper);border-bottom:2px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
h1{font-size:20px;margin:0 12px 0 0}.stat{color:var(--soft)}.stat b{color:var(--ink)}
button{font:inherit;cursor:pointer;border-radius:10px;border:2px solid var(--line);background:var(--card);color:var(--ink);padding:6px 12px}
button.primary{background:var(--ink);color:var(--card);border-color:var(--ink)}
main{max-width:920px;margin:0 auto;padding:8px 16px 80px}
h2{font-size:17px;margin:24px 0 8px;color:var(--soft)}
.row{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;background:var(--card);border:2px solid transparent;border-radius:14px;padding:10px 12px;margin:6px 0}
.row.cur{border-color:var(--focus)}.row.ok{background:#eef3e6}.row.bad{background:#f8e6e9}
.play{width:44px;height:44px;border-radius:50%;padding:0;font-size:18px}
.text{font-size:18px}.meta{font-size:13px;color:var(--soft)}
.verdict{display:flex;gap:6px}.verdict .ok.on{background:var(--ok);color:#fff;border-color:var(--ok)}.verdict .bad.on{background:var(--bad);color:#fff;border-color:var(--bad)}
.why{grid-column:2/4;display:none;gap:6px;flex-wrap:wrap;align-items:center}.row.bad .why{display:flex}
.why button{font-size:14px;padding:4px 10px}.why button.on{background:var(--ink);color:var(--card)}
.why input{flex:1;min-width:180px;font:inherit;padding:5px 8px;border-radius:8px;border:2px solid var(--line)}
.keys{font-size:13px;color:var(--soft)}kbd{border:1px solid var(--line);border-radius:4px;padding:0 4px;background:var(--card)}
#out{display:none;position:fixed;inset:auto 16px 16px 16px;max-width:920px;margin:0 auto;background:var(--card);border:2px solid var(--ink);border-radius:14px;padding:12px}
#out textarea{width:100%;height:160px;font:14px/1.4 ui-monospace,monospace}
button:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
</style></head><body>
<header>
  <h1>Прослушивание озвучки</h1>
  <span class="stat">оценено <b id="done">0</b> из ${items.length} · переделать: <b id="bad">0</b></span>
  <button class="primary" id="copy">Скопировать итог для Claude</button>
  <span class="keys"><kbd>Пробел</kbd> играть · <kbd>1</kbd> пойдёт · <kbd>2</kbd> переделать · <kbd>↓</kbd><kbd>↑</kbd> следующая/предыдущая</span>
</header>
<main id="list"></main>
<div id="out"><b>Скопировано.</b> Вставь это в чат с Claude (если не скопировалось — выдели и скопируй вручную):<textarea id="outText" readonly></textarea><button id="close">Закрыть</button></div>
<script>
const GROUPS = ${JSON.stringify(groups)};
const REASONS = ['ударение', 'интонация', 'быстро', 'медленно', 'обрезано', 'лишние слова', 'другой голос'];
const KEY = ${JSON.stringify(storeKey)};
let marks = {};
try { marks = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch {} };
const all = GROUPS.flatMap((g) => g.items);
const mk = (i) => i.id + ':' + i.size; // переозвученный файл — новая оценка
const list = document.getElementById('list');
const audio = new Audio();
let cur = 0;

for (const g of GROUPS) {
  const h = document.createElement('h2'); h.textContent = g.title; list.append(h);
  for (const it of g.items) {
    const r = document.createElement('div'); r.className = 'row'; r.dataset.id = it.id;
    r.innerHTML = '<button class="play" title="Играть">▶</button>' +
      '<div><div class="text"></div><div class="meta"></div></div>' +
      '<div class="verdict"><button class="ok">Пойдёт</button><button class="bad">Переделать</button></div>' +
      '<div class="why"></div>';
    r.querySelector('.text').textContent = it.text;
    r.querySelector('.meta').textContent = it.id + (it.stressed ? ' · ударения: ' + it.stressed : '') + (it.verified ? '' : ' · не проверено расшифровкой');
    const why = r.querySelector('.why');
    for (const w of it.reasons || REASONS) { const b = document.createElement('button'); b.textContent = w; b.dataset.reason = w; why.append(b); }
    const inp = document.createElement('input'); inp.placeholder = 'что не так (необязательно)'; why.append(inp);
    list.append(r);
    it.el = r;
  }
}

function render(it) {
  const m = marks[mk(it)] || {};
  it.el.classList.toggle('ok', m.v === 'ok'); it.el.classList.toggle('bad', m.v === 'bad');
  it.el.querySelector('.verdict .ok').classList.toggle('on', m.v === 'ok');
  it.el.querySelector('.verdict .bad').classList.toggle('on', m.v === 'bad');
  for (const b of it.el.querySelectorAll('.why button')) b.classList.toggle('on', (m.why || []).includes(b.dataset.reason));
  it.el.querySelector('.why input').value = m.note || '';
}
function stats() {
  const ms = all.map((i) => marks[mk(i)]).filter(Boolean);
  document.getElementById('done').textContent = ms.filter((m) => m.v).length;
  document.getElementById('bad').textContent = ms.filter((m) => m.v === 'bad').length;
}
function select(n, play) {
  cur = Math.max(0, Math.min(all.length - 1, n));
  all.forEach((i, k) => i.el.classList.toggle('cur', k === cur));
  all[cur].el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (play) playIt(all[cur]);
}
function playIt(it) { audio.src = it.src + '?' + it.size; audio.currentTime = 0; audio.play(); }
function setV(it, v) {
  const m = marks[mk(it)] || {}; m.v = v; marks[mk(it)] = m; save(); render(it); stats();
}

all.forEach((it, k) => {
  render(it);
  it.el.querySelector('.play').onclick = () => { select(k); playIt(it); };
  it.el.querySelector('.verdict .ok').onclick = () => { select(k); setV(it, 'ok'); };
  it.el.querySelector('.verdict .bad').onclick = () => { select(k); setV(it, 'bad'); };
  for (const b of it.el.querySelectorAll('.why button')) b.onclick = () => {
    const m = marks[mk(it)] || { v: 'bad' }; const w = new Set(m.why || []);
    w.has(b.dataset.reason) ? w.delete(b.dataset.reason) : w.add(b.dataset.reason);
    m.why = [...w]; marks[mk(it)] = m; save(); render(it);
  };
  it.el.querySelector('.why input').oninput = (e) => { const m = marks[mk(it)] || { v: 'bad' }; m.note = e.target.value; marks[mk(it)] = m; save(); };
});
stats(); select(0);

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); playIt(all[cur]); }
  else if (e.key === '1') { setV(all[cur], 'ok'); select(cur + 1, true); }
  else if (e.key === '2') { setV(all[cur], 'bad'); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); select(cur + 1, true); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); select(cur - 1, true); }
});

document.getElementById('copy').onclick = async () => {
  const ok = all.filter((i) => (marks[mk(i)] || {}).v === 'ok').map((i) => i.id);
  const bad = all.filter((i) => (marks[mk(i)] || {}).v === 'bad').map((i) => {
    const m = marks[mk(i)]; return '- ' + i.id + ' «' + i.text + '»' + (m.why && m.why.length ? ' — ' + m.why.join(', ') : '') + (m.note ? ' — ' + m.note : '');
  });
  const txt = 'Прослушивание озвучки: оценено ' + (ok.length + bad.length) + ' из ' + all.length + '.\\n' +
    'ПЕРЕДЕЛАТЬ (' + bad.length + '):\\n' + (bad.join('\\n') || '—') + '\\nПОЙДЁТ (' + ok.length + '): ' + (ok.join(', ') || '—');
  const ta = document.getElementById('outText'); ta.value = txt; document.getElementById('out').style.display = 'block';
  try { await navigator.clipboard.writeText(txt); } catch { ta.select(); document.execCommand('copy'); }
};
document.getElementById('close').onclick = () => (document.getElementById('out').style.display = 'none');
</script></body></html>`;

writeFileSync(OUT, html);
console.log(`✓ ${OUT}: ${items.length} фраз в ${groups.length} группах`);
if (!process.argv.includes('--no-open')) exec(`start "" "${resolve(OUT)}"`, { shell: 'cmd.exe' });
