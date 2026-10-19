// Удаляет dist перед сборкой. Не fs.rmSync: в Node 24 на Windows он молча ничего не делает,
// если в пути есть кириллица (у нас «Учеба\Проекты»). unlinkSync/rmdirSync работают.
import { existsSync, readdirSync, rmdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

function remove(p) {
  if (statSync(p).isDirectory()) {
    for (const name of readdirSync(p)) remove(join(p, name));
    rmdirSync(p);
  } else unlinkSync(p);
}

for (const dir of process.argv.slice(2).length ? process.argv.slice(2) : ['dist']) {
  if (existsSync(dir)) remove(dir);
  if (existsSync(dir)) throw new Error(`не удалось удалить ${dir}`);
}
