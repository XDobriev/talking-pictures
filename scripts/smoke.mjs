// Сквозная проверка в настоящем браузере: старт → уровень 1 → победа → «дальше» → меню → родительская зона → альбом.
// Запуск: npm run build && npm run e2e   (скриншоты — в screenshots/)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 4179;
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview не стартовал')), 20000);
  server.stdout.on('data', (d) => {
    if (String(d).includes(String(PORT))) {
      clearTimeout(t);
      resolve();
    }
  });
});

const errors = [];
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome', headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}

/** Нажатие по центру элемента — как палец; не ждёт «стабильности» пульсирующих кнопок. */
const tapId = async (page, id) => {
  const el = page.getByTestId(id).first();
  await el.waitFor({ timeout: 8000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`нет кнопки ${id}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    results.push(`✗ ${name}: ${e.message.split('\n')[0]}`);
    throw e;
  }
};

try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, hasTouch: false });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/sdk\.js|404/.test(m.text())) errors.push(`console: ${m.text()}`);
  });

  const tapObj = async (id) => {
    const box = await page.locator(`[data-obj="${id}"]`).boundingBox();
    if (!box) throw new Error(`нет объекта ${id}`);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };

  await step('стартовый экран', async () => {
    await page.goto(`http://localhost:${PORT}/?noads`);
    await page.getByTestId('start').waitFor({ timeout: 15000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/01-start.png` });
  });

  await step('первый запуск ведёт сразу в уровень 1', async () => {
    await tapId(page, 'играть');
    await page.locator('[data-level="forest_who1"]').waitFor({ timeout: 8000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/02-level1.png` });
  });

  await step('неверное касание не ломает игру', async () => {
    await tapObj('spruce');
    await page.waitForTimeout(300);
    await tapObj('fox');
    await page.waitForTimeout(300);
  });

  await step('уровень 1 проходится по порядку', async () => {
    for (const id of ['squirrel', 'hedgehog', 'bunny']) {
      await tapObj(id);
      await page.waitForTimeout(id === 'squirrel' ? 600 : 300);
      if (id === 'squirrel') await page.screenshot({ path: `${OUT}/03-found-flight.png` });
    }
    await page.getByTestId('win').waitFor({ timeout: 15000 });
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${OUT}/04-win.png` });
  });

  await step('«дальше» открывает уровень на слух', async () => {
    await tapId(page, 'дальше');
    await page.locator('[data-level="forest_sound"]').waitFor({ timeout: 8000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/05-level-sound.png` });
  });

  await step('светлячок показывает цель', async () => {
    await tapId(page, 'светлячок');
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/06-firefly.png` });
  });

  await step('беспорядочное тапанье пускает пузыри', async () => {
    for (let i = 0; i < 6; i++) await page.mouse.click(560 + i * 4, 90);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/07-bubbles.png` });
  });

  await step('домой → меню уровней', async () => {
    await tapId(page, 'домой');
    await page.getByTestId('menu').waitFor({ timeout: 5000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/08-menu.png` });
  });

  await step('родительская зона открывается удержанием', async () => {
    await tapId(page, 'для взрослых');
    await page.getByTestId('parent-gate').waitFor();
    await page.screenshot({ path: `${OUT}/09-gate.png` });
    const hold = await page.getByTestId('hold').boundingBox();
    await page.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(3300);
    await page.mouse.up();
    await page.getByTestId('parent-menu').waitFor({ timeout: 3000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/10-parent.png` });
    await tapId(page, 'parent-close');
  });

  await step('альбом с наклейкой', async () => {
    await tapId(page, 'альбом');
    await page.getByTestId('album').waitFor();
    await page.locator('[data-sticker="squirrel"]').waitFor({ timeout: 3000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/11-album.png` });
  });

  await step('прогресс переживает перезагрузку', async () => {
    await page.reload();
    await tapId(page, 'играть');
    await page.getByTestId('menu').waitFor({ timeout: 6000 });
  });

  await step('телефон 6.1″ (844×390) — холст вписан', async () => {
    const phone = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await phone.newPage();
    await p.goto(`http://localhost:${PORT}/?noads`);
    await p.getByTestId('start').waitFor({ timeout: 15000 });
    await tapId(p, 'играть');
    await p.locator('[data-level="forest_who1"]').waitFor({ timeout: 8000 });
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `${OUT}/12-phone.png` });
    await phone.close();
  });
} finally {
  await browser.close();
  server.kill();
  console.log(results.join('\n'));
  if (errors.length) {
    console.log('\nОшибки в консоли:\n' + errors.join('\n'));
    process.exitCode = 1;
  }
}

