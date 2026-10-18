// Проверка интеграции с настоящим SDK Яндекс Игр в dev-окружении (моки SDK от Яндекса).
// Предварительно: npx sdk-dev-proxy -p dist --dev-mode=true --port 8091
import { chromium } from 'playwright';

const URL = process.env.SDK_URL ?? 'https://localhost:8091/?noads';
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch {
  browser = await chromium.launch({ headless: true });
}
// прокси поднимает https с самоподписанным сертификатом
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('response', (r) => r.status() >= 400 && logs.push(`[http ${r.status()}] ${r.url()}`));

await page.goto(URL);
await page.getByTestId('start').waitFor({ timeout: 20000 });
const info = await page.evaluate(() => ({ yaGames: typeof window.YaGames, lang: document.documentElement.lang }));
console.log('YaGames:', info.yaGames, '| lang:', info.lang);

const box = await page.getByTestId('играть').boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await page.locator('[data-level]').waitFor({ timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'screenshots/20-sdk-dev.png' });

// уход со вкладки и возврат — должны прийти pause/resume
await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
});
await page.waitForTimeout(300);
await page.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
});
await page.waitForTimeout(500);

await browser.close();
const interesting = logs.filter((l) => /ysdk|sdk|LoadingAPI|Gameplay|error|ready|i18n|player/i.test(l));
console.log(interesting.slice(0, 60).join('\n'));
