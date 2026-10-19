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

const voiced = run(['scripts/voice.mjs', '--batch=7', '--model=gemini-2.5-flash-preview-tts']);
const checked = run(['scripts/voice-qa.mjs', '--unverified', '--no-trim', '--delete-bad']);

const phrases = readFileSync('src/data/phrases.ts', 'utf8').match(/^\s+\w+: \{ text:/gm)?.length ?? 0;
const files = readdirSync('src/assets/voice').filter((f) => f.endsWith('.mp3')).length;
const verified = existsSync('voice/verified.txt') ? readFileSync('voice/verified.txt', 'utf8').split(/\s+/).filter(Boolean).length : 0;
const summary = `${day}: озвучено ${files} из ${phrases}, проверено ${verified}. Озвучка: ${voiced} | Проверка: ${checked}`;
say(`\n${summary}`);
writeFileSync('voice/logs/last.txt', summary + '\n');
