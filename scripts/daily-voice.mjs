// Ежедневная озвучка без участия человека (запускается Планировщиком заданий Windows, см. scripts/schedule-voice.ps1):
//   1) voice.mjs озвучивает недостающие фразы, пока не кончится суточный лимит;
//   2) voice-lint.mjs проверяет форму звука (эхо слитно, обрыв, чужой голос) и удаляет брак — до расшифровки,
//      чтобы не тратить на него её лимит;
//   3) voice-qa.mjs проверяет расшифровкой всё, чего нет в реестре voice/verified.txt, и удаляет брак
//      (брак переозвучится завтра).
// Лог — voice/logs/<дата>.log (пишется по ходу, а не в конце: 22.10 процесс закрыли посреди проверки
// и в логе не осталось ничего), последняя сводка — voice/logs/last.txt. В git ничего не коммитится.
import { spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));
mkdirSync('voice/logs', { recursive: true });
const day = new Date().toISOString().slice(0, 10);
const log = `voice/logs/${day}.log`;
const say = (s) => appendFileSync(log, `${s}\n`);

// Gemini работает только с включённым VPN: перед началом ждём, пока API ответит (до 15 минут — заодно
// дожидаемся сети после пробуждения). Не дождались — ничего не запускаем (24.10 все 278 запросов упали
// с «fetch failed»), Планировщик повторит запуск позже в тот же день.
const LAST = 'voice/logs/last.txt';
const NO_API = 'Нет доступа к Gemini';
// Сегодня полный запуск уже был — повторные срабатывания Планировщика не нужны.
if (existsSync(LAST)) {
  const prev = readFileSync(LAST, 'utf8');
  if (prev.startsWith(`${day}:`) && !prev.includes(NO_API)) process.exit(0);
}

function envKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (!existsSync('.env')) return '';
  return readFileSync('.env', 'utf8').match(/^\s*GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m)?.[1] ?? '';
}

// true — API отвечает (VPN включён, сеть есть). Без VPN: fetch failed, таймаут или отказ по региону.
async function geminiReachable() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${envKey()}`, {
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let reachable = await geminiReachable();
for (let i = 0; !reachable && i < 30; i++) {
  if (i === 0) say(`[${new Date().toLocaleTimeString('ru-RU')}] Gemini недоступен (VPN выключен или нет сети) — жду до 15 минут`);
  await new Promise((r) => setTimeout(r, 30000));
  reachable = await geminiReachable();
}
if (!reachable) {
  const msg = `${day}: ${NO_API} (включите VPN) — запуск пропущен, Планировщик повторит позже`;
  say(msg);
  writeFileSync(LAST, `${msg}\n`);
  process.exit(0);
}

// Метка «идёт запуск»: если она осталась от прошлого раза — тот запуск оборвался (компьютер выключили,
// закрыли окно). Его незаконченные шаги доделают шаги этого запуска: проверки берут всё непроверенное.
const RUNNING = 'voice/logs/running.txt';
const broken = existsSync(RUNNING) ? readFileSync(RUNNING, 'utf8').trim() : '';
if (broken) say(`! Прошлый запуск (${broken}) не закончился — его непроверенные файлы проверятся сейчас`);
writeFileSync(RUNNING, new Date().toLocaleString('ru-RU'));

function run(args) {
  say(`\n$ node ${args.join(' ')}  [${new Date().toLocaleTimeString('ru-RU')}]`);
  const from = statSync(log).size;
  const fd = openSync(log, 'a');
  spawnSync(process.execPath, args, { stdio: ['ignore', fd, fd], timeout: 45 * 60 * 1000 });
  closeSync(fd);
  const out = readFileSync(log).subarray(from).toString('utf8');
  // «Assertion failed … async.c» — сбой Node на Windows при выходе после fetch, уже после итоговой строки
  return out.trim().split('\n').filter((l) => !/^Assertion failed/.test(l)).at(-1) ?? '';
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
const linted = run(['scripts/voice-lint.mjs', '--unverified', '--delete-bad']);
const checked = run(['scripts/voice-qa.mjs', '--unverified', '--no-trim', '--delete-bad']);
// Общая громкость (−14 LUFS), выравнивание внутри фразы и темп — как у уже выровненных (см. voice-level.mjs).
const leveled = run(['scripts/voice-level.mjs', '--apply']);
// Whisper на компьютере, без лимитов: второе мнение к расшифровке и запасная проверка того, что Gemini не успел.
const whispered = run(['scripts/voice-whisper.mjs', '--verify']);
// Оценщик (ударения, интонация, второй голос) — последним: тратит тот же лимит, что расшифровка, а она важнее;
// и после выравнивания, иначе изменённый файл оценивался бы второй раз. Ничего не удаляет, только пополняет «послушать».
const judgedNow = run(['scripts/voice-judge.mjs']);

const phrases = readFileSync('src/data/phrases.ts', 'utf8').match(/^\s+\w+: \{ text:/gm)?.length ?? 0;
const files = readdirSync('src/assets/voice').filter((f) => f.endsWith('.mp3')).map((f) => f.replace(/\.mp3$/, ''));
const verified = new Set(existsSync('voice/verified.txt') ? readFileSync('voice/verified.txt', 'utf8').split(/\s+/).filter(Boolean) : []);
const unchecked = files.filter((id) => !verified.has(id)).length;
const summary =
  `${day}: озвучено ${files.length} из ${phrases}, проверено ${files.length - unchecked}` +
  `${unchecked ? `, НЕ проверено ${unchecked} (проверятся при следующем запуске)` : ''}` +
  `${broken ? `. Прошлый запуск (${broken}) оборвался` : ''}. ` +
  `Озвучка: ${voiced} | Форма звука: ${linted} | Расшифровка: ${checked} | Выравнивание: ${leveled} | Whisper: ${whispered} | Оценщик: ${judgedNow}`;
say(`\n${summary}`);
writeFileSync(LAST, summary + '\n');
// unlinkSync, а не rmSync: rmSync в этом пути (кириллица) молча не удаляет файл (23.10)
unlinkSync(RUNNING);
