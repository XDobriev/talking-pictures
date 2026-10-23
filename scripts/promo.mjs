// Промоматериалы для карточки игры в Консоли Яндекс Игр (требования — PLAN.md §10.5):
//   иконка 512×512, обложка 800×470 — из арта в promo/src (не скриншоты, без рамок и скруглений);
//   скриншоты 1920×1080 (16:9, геймплей во весь кадр) — снимаются из собранной игры.
//
//   npm run build && node scripts/promo.mjs
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const OUT = 'promo';
mkdirSync(OUT, { recursive: true });

// ---------- иконка и обложка ----------
await sharp('promo/src/icon.png').resize(512, 512, { kernel: 'lanczos3' }).png().toFile(`${OUT}/icon-512.png`);
// обложка 800×470 (≈1.70): исходник 1376×768 (≈1.79) — срезаем слева край леса, справа рука мальчика остаётся
const cover = await sharp('promo/src/cover.png').metadata();
const coverW = Math.round(cover.height * (800 / 470));
await sharp('promo/src/cover.png')
  .extract({ left: cover.width - coverW, top: 0, width: coverW, height: cover.height })
  .resize(800, 470, { kernel: 'lanczos3' })
  .png()
  .toFile(`${OUT}/cover-800x470.png`);
console.log('✓ icon-512.png, cover-800x470.png');

// ---------- скриншоты ----------
const PORT = 4180;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview не стартовал')), 20000);
  server.stdout.on('data', (d) => String(d).includes(String(PORT)) && (clearTimeout(t), resolve()));
});

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
  const tap = async (testId) => {
    const box = await page.getByTestId(testId).first().boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  const tapObj = async (id) => {
    const box = await page.locator(`[data-obj="${id}"]`).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  /** Выход из уровня — удержание «домой» около секунды. */
  const hold = async (testId, ms = 1300) => {
    const box = await page.getByTestId(testId).first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
  };
  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(`✓ ${name}.png`);
  };

  await page.goto(`http://localhost:${PORT}/?noads`);
  await page.getByTestId('start').waitFor({ timeout: 15000 });
  await tap('играть');
  // лес, уровень 1: одна находка уже в панели — видно, как играется
  await page.locator('[data-level="forest_who1"]').waitFor({ timeout: 8000 });
  await page.waitForTimeout(1500);
  await tapObj('squirrel');
  await page.waitForTimeout(1600);
  await shot('screenshot-1-forest');
  for (const id of ['hedgehog', 'bunny']) {
    await tapObj(id);
    await page.waitForTimeout(400);
  }
  await page.getByTestId('win').waitFor({ timeout: 15000 });
  await page.waitForTimeout(2600);
  await shot('screenshot-4-win');

  // ферма: «на слух» — без силуэтов, поэтому берём «кто кушает»
  const openLevel = async (scene, n, level) => {
    await page.getByTestId('win').getByTestId('домой').click({ force: true }).catch(() => tap('домой'));
    await page.getByTestId('menu').waitFor({ timeout: 6000 });
    await tap(`сцена ${scene}`);
    await page.waitForTimeout(700);
    await tap(`уровень ${n}`);
    await page.locator(`[data-level="${level}"]`).waitFor({ timeout: 8000 });
    await page.waitForTimeout(1500);
  };
  await openLevel('farm', 4, 'farm_eat');
  await tapObj('horse');
  await page.waitForTimeout(1600);
  await shot('screenshot-2-farm');

  await hold('домой');
  await page.getByTestId('menu').waitFor({ timeout: 6000 });
  await tap('сцена yard');
  await page.waitForTimeout(700);
  await tap('уровень 3');
  await page.locator('[data-level="yard_verbs1"]').waitFor({ timeout: 8000 });
  await page.waitForTimeout(1500);
  await tapObj('girl_swing');
  await page.waitForTimeout(1600);
  await shot('screenshot-3-yard');
} finally {
  await browser.close();
  server.kill();
}
