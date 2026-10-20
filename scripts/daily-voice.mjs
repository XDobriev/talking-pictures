// Ежедневная озвучка без участия человека (запускается Планировщиком заданий Windows, см. scripts/schedule-voice.ps1):
//   1) voice.mjs озвучивает недостающие фразы, пока не кончится суточный лимит;
//   2) voice-qa.mjs проверяет расшифровкой всё, чего нет в реестре voice/verified.txt, и удаляет брак
//      (брак переозвучится завтра).
// Лог — voice/logs/<дата>.log, последняя сводка — voice/logs/last.txt. В git ничего не коммитится.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));
mkdirSync('voice/logs', { recursive: true });
const day = new Date().toISOString().slice(0, 10);
const log = `voice/logs/${day}.log`;
const say = (s) => appendFileSync(log, `${s}\n`);

function run(args) {
  say(`\n$ node ${args.join(' ')}  [${new Date().toLocaleTimeString('ru-RU')}]`);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 45 * 60 * 1000 });
  say((r.stdout ?? '') + (r.stderr ?? ''));
  return (r.stdout ?? '').trim().split('\n').at(-1) ?? '';
}

const extra = existsSync('voice/extra-models.txt') ? readFileSync('voice/extra-models.txt', 'utf8').split(/\s+/).filter(Boolean) : [];
const MAIN = ['scripts/voice.mjs', '--batch=7', '--model=gemini-2.5-flash-preview-tts'];
// С запасными моделями основная сначала тратит лимит на эхо (их запасные 3.8 не берут), потом — на остальное.
let voiced = extra.length ? `эхо: ${run([...MAIN, '--echo-only'])} | ${run(MAIN)}` : run(MAIN);
// Запасные модели (своя квота у каждой) — только если пользователь одобрил их тембр на слух:
// по одной на строку в voice/extra-models.txt.
// 3.8 зачитывает инструкцию о подаче вслух, а systemInstruction не принимает — им только фразы (--plain),
// и без эхо: слоги «ве-дёр-ко» они читают слитно (20.10). Эхо остаётся основной модели.
// 3.1 инструкцию в тексте понимает и вслух не читает (проверено расшифровкой 19.10) — ей обычный режим.
for (const model of extra) {
  const plain = /^gemini-3\.8-/.test(model) ? ['--plain', '--skip-echo'] : [];
  voiced += ` | ${model}: ${run(['scripts/voice.mjs', '--batch=7', ...plain, `--model=${model}`])}`;
}
const checked = run(['scripts/voice-qa.mjs', '--unverified', '--no-trim', '--delete-bad']);
// Общая громкость (−14 LUFS), выравнивание внутри фразы и темп — как у уже выровненных (см. voice-level.mjs).
const leveled = run(['scripts/voice-level.mjs', '--apply']);

const phrases = readFileSync('src/data/phrases.ts', 'utf8').match(/^\s+\w+: \{ text:/gm)?.length ?? 0;
const files = readdirSync('src/assets/voice').filter((f) => f.endsWith('.mp3')).length;
const verified = existsSync('voice/verified.txt') ? readFileSync('voice/verified.txt', 'utf8').split(/\s+/).filter(Boolean).length : 0;
const summary = `${day}: озвучено ${files} из ${phrases}, проверено ${verified}. Озвучка: ${voiced} | Проверка: ${checked} | Выравнивание: ${leveled}`;
say(`\n${summary}`);
writeFileSync('voice/logs/last.txt', summary + '\n');
