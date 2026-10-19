// Видео геймплея для карточки Яндекс Игр: 1920×1080, 30 к/с, H.264 + AAC, до 28 с.
// Запуск: npm run video   (собирает игру, записывает прохождение, кладёт promo/gameplay.mp4)
//
// Как устроено:
// - картинка — кадры CDP-скринкаста (у каждого есть время), склеиваются ffmpeg с настоящими длительностями;
// - звук — внутри страницы всё, что идёт в динамики Web Audio (голос через Howler, звуки, музыка),
//   дублируется в MediaRecorder; у каждой дорожки известно время старта, ffmpeg сдвигает её по кадрам;
// - касания показываются мягким кругом, иначе зрителю непонятно, куда нажали.
// Записывать стоит после полной озвучки: в релизной сборке неозвученные фразы молчат.
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ffmpeg from 'ffmpeg-static';
import { chromium } from 'playwright';

const PORT = 4183;
const OUT = process.env.VIDEO_OUT ?? 'promo/gameplay.mp4';
const WORK = 'promo/.video-work';
const MAX_SECONDS = 28;
const W = 1920;
const H = 1080;

rmSync(WORK, { recursive: true, force: true });
mkdirSync(join(WORK, 'frames'), { recursive: true });

// ---------- что делается в кадре ----------
/** Сценарий: первый запуск → уровень 1 леса → три находки → окно победы. Паузы подобраны под голос. */
async function scenario(page, { tap, tapObj, mark }) {
  await page.getByTestId('start').waitFor({ timeout: 15000 });
  await page.waitForTimeout(800); // шрифты и фон
  mark('start');
  await page.waitForTimeout(900);
  await tap('играть'); // первый запуск: «Привет! Я светлячок…» и сразу уровень 1
  await page.locator('[data-level="forest_who1"]').waitFor({ timeout: 8000 });
  await page.waitForTimeout(2400); // «Найди белочку»
  await tapObj('squirrel');
  await page.waitForTimeout(3200); // «Ура! Это белочка…» — дальше голос перебивается следующей находкой
  await tapObj('hedgehog');
  await page.waitForTimeout(3200);
  await tapObj('bunny'); // последняя находка: игра дослушивает рассказ о ней и показывает победу
  await page.getByTestId('win').waitFor({ timeout: 15000 });
  mark('победа');
  await page.waitForTimeout(3000); // наклейка и «Ура! Всё найдено!»
  mark('end');
}

/** Сохранение до запуска игры: первый запуск, но без паузы после «Скажи: …» — в ролике каждая секунда на счету. */
const SAVE = { version: 1, settings: { echoPause: false }, tutorialDone: false };

// ---------- запись (в страницу до её скриптов) ----------
const INIT = () => {
  // Звук: каждое подключение к динамикам дублируем в MediaStreamDestination своего контекста.
  const tracks = [];
  const taps = new Map();
  const connect = AudioNode.prototype.connect;
  const tapFor = (ctx) => {
    if (taps.has(ctx)) return taps.get(ctx);
    const dest = ctx.createMediaStreamDestination();
    const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 160000 });
    const t = { dest, rec, chunks: [], start: 0 };
    rec.ondataavailable = (e) => e.data.size && t.chunks.push(e.data);
    rec.start(250);
    t.start = Date.now();
    taps.set(ctx, t);
    tracks.push(t);
    return t;
  };
  AudioNode.prototype.connect = function (target, ...rest) {
    const r = connect.call(this, target, ...rest);
    if (target instanceof AudioDestinationNode) connect.call(this, tapFor(target.context).dest);
    return r;
  };
  window.__stopAudio = async () => {
    const out = [];
    for (const t of tracks) {
      await new Promise((res) => {
        t.rec.onstop = res;
        t.rec.stop();
      });
      const buf = new Uint8Array(await new Blob(t.chunks).arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      out.push({ start: t.start, b64: btoa(s) });
    }
    return out;
  };

  // Касание — мягкий круг. Время касаний — для отчёта о синхронности.
  window.__taps = [];
  addEventListener(
    'pointerdown',
    (e) => {
      window.__taps.push(Date.now());
      const d = document.createElement('div');
      d.style.cssText = `position:fixed;left:${e.clientX - 45}px;top:${e.clientY - 45}px;width:90px;height:90px;border-radius:50%;
        border:6px solid rgba(255,250,240,.95);background:rgba(255,250,240,.25);box-shadow:0 0 0 3px rgba(61,58,47,.35);
        pointer-events:none;z-index:2147483647;transition:transform .55s ease-out,opacity .55s ease-out;transform:scale(.6)`;
      document.body.appendChild(d);
      requestAnimationFrame(() => {
        d.style.transform = 'scale(1.15)';
        d.style.opacity = '0';
      });
      setTimeout(() => d.remove(), 700);
    },
    true,
  );
};

// ---------- запуск ----------
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview не стартовал')), 20000);
  server.stdout.on('data', (d) => String(d).includes(String(PORT)) && (clearTimeout(t), resolve()));
});

const args = ['--autoplay-policy=no-user-gesture-required'];
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true, args });
} catch {
  browser = await chromium.launch({ headless: true, args });
}

const frames = [];
const marks = {};
let audio = [];
try {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await ctx.addInitScript(INIT);
  await ctx.addInitScript((save) => localStorage.setItem('talking-pictures-save', JSON.stringify(save)), SAVE);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const cdp = await ctx.newCDPSession(page);
  // Кадры — в память, на диск после записи: синхронная запись блокирует Node, и касания уходят в игру с опозданием.
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    frames.push({ file: `f${String(frames.length).padStart(5, '0')}.jpg`, t: metadata.timestamp * 1000, data });
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });

  await page.goto(`http://localhost:${PORT}/?noads`);
  const center = async (loc) => {
    const b = await loc.boundingBox();
    if (!b) throw new Error('нет элемента для касания');
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  };
  await scenario(page, {
    tap: (id) => center(page.getByTestId(id).first()),
    tapObj: (id) => center(page.locator(`[data-obj="${id}"]`)),
    mark: (name) => (marks[name] = Date.now()),
  });

  await cdp.send('Page.stopScreencast');
  audio = await page.evaluate(() => window.__stopAudio());
  (await page.evaluate(() => window.__taps)).forEach((t, i) => (marks[`касание ${i + 1}`] = t));
  if (errors.length) throw new Error('ошибки на странице: ' + errors.join('; '));
} finally {
  await browser.close();
  server.kill();
}

// ---------- сборка ----------
for (const f of frames) writeFileSync(join(WORK, 'frames', f.file), Buffer.from(f.data, 'base64'));
const t0 = marks.start;
const t1 = Math.min(marks.end, t0 + MAX_SECONDS * 1000);
const total = (t1 - t0) / 1000;
// Кадр, который стоял на экране в момент t0, — первый; дальше каждый держится до следующего.
let first = frames.findLastIndex((f) => f.t <= t0);
if (first < 0) first = 0;
const used = frames.slice(first).filter((f) => f.t < t1);
const lines = ['ffconcat version 1.0'];
used.forEach((f, i) => {
  const from = Math.max(f.t, t0);
  const to = i + 1 < used.length ? used[i + 1].t : t1;
  lines.push(`file 'frames/${f.file}'`, `duration ${((to - from) / 1000).toFixed(4)}`);
});
lines.push(`file 'frames/${used.at(-1).file}'`);
writeFileSync(join(WORK, 'frames.txt'), lines.join('\n'));

const inputs = ['-f', 'concat', '-safe', '0', '-i', join(WORK, 'frames.txt')];
const filters = [`[0:v]fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p[v]`];
const mixed = [];
// Контекст, который ничего не сыграл, даёт пустой файл — такой ffmpeg не откроет.
audio = audio.filter((a) => a.b64.length > 1000);
audio.forEach((a, i) => {
  const file = join(WORK, `audio${i}.webm`);
  writeFileSync(file, Buffer.from(a.b64, 'base64'));
  inputs.push('-i', file);
  const shift = a.start - t0; // мс: >0 — дорожка началась позже начала ролика
  const align = shift >= 0 ? `adelay=${shift}:all=1` : `atrim=start=${(-shift / 1000).toFixed(3)},asetpts=PTS-STARTPTS`;
  filters.push(`[${i + 1}:a]aresample=48000,${align}[a${i}]`);
  mixed.push(`[a${i}]`);
});
if (mixed.length) filters.push(`${mixed.join('')}amix=inputs=${mixed.length}:normalize=0:duration=longest,alimiter=limit=0.95[a]`);

execFileSync(
  ffmpeg,
  [
    '-y', '-loglevel', 'error',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '[v]',
    ...(mixed.length ? ['-map', '[a]', '-c:a', 'aac', '-b:a', '160k'] : []),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high', '-movflags', '+faststart',
    '-t', total.toFixed(3),
    OUT,
  ],
  { stdio: 'inherit' },
);
if (!process.env.VIDEO_KEEP) rmSync(WORK, { recursive: true, force: true });
console.log(Object.entries(marks).sort((a, b) => a[1] - b[1]).map(([k, v]) => `${((v - t0) / 1000).toFixed(1)} с — ${k}`).join('\n'));
console.log(`✓ ${OUT}: ${total.toFixed(1)} с, кадров ${used.length}, звуковых дорожек ${audio.length}`);
if (total > MAX_SECONDS - 0.01 && marks.end - t0 > MAX_SECONDS * 1000) console.log(`! сценарий длиннее ${MAX_SECONDS} с — конец обрезан`);
