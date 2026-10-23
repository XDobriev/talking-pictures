// Запросы к текстовым моделям Gemini (расшифровка в voice-qa.mjs, оценка в voice-judge.mjs).
// У каждой модели свой суточный лимит: кончился у одной — берём следующую. 2.5-flash закрыта для новых ключей.
// Перегрузка (5xx) и тайм-аут — не лимит: подождать и повторить, после двух неудач — другая модель
// (перегруженную — в конец очереди, она ещё пригодится). Не больше 8 попыток на запрос.
import { existsSync, readFileSync } from 'node:fs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export const TEXT_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** ask(parts, generationConfig) → текст ответа. Ошибка с .daily — суточный лимит кончился у всех моделей. */
export function gemini(models = TEXT_MODELS) {
  const queue = [...models];
  let model = queue.shift();

  async function busy(parts, config, attempt, tries, why) {
    if (tries >= 7) throw new Error(`${why}: модели перегружены, попробую при следующем запуске`);
    if (tries % 3 === 2 && queue.length) {
      queue.push(model);
      model = queue.shift();
      console.log(`  … ${why}, переключаюсь на ${model}`);
    } else {
      const wait = 10 * (tries + 1);
      console.log(`  … ${why}, повтор через ${wait} с`);
      await sleep(wait * 1000);
    }
    return ask(parts, config, attempt, tries + 1);
  }

  async function ask(parts, config = { temperature: 0 }, attempt = 0, tries = 0) {
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        signal: AbortSignal.timeout(90000),
        body: JSON.stringify({ contents: [{ parts }], generationConfig: config }),
      });
    } catch (e) {
      return busy(parts, config, attempt, tries, e.name === 'TimeoutError' ? 'тайм-аут' : `сеть (${e.message})`);
    }
    if (res.status >= 500) return busy(parts, config, attempt, tries, `HTTP ${res.status}`);
    if (res.status === 404 && queue.length) {
      model = queue.shift();
      console.log(`  … модель недоступна, переключаюсь на ${model}`);
      return ask(parts, config, attempt, tries);
    }
    if (res.status === 429 && attempt < 4) {
      // поминутный лимит — ждём, сколько просит сервер; суточный — ждать бессмысленно
      const body = await res.text();
      if (/PerDay/i.test(body)) {
        if (!queue.length) throw Object.assign(new Error('суточный лимит исчерпан у всех моделей'), { daily: true });
        model = queue.shift();
        console.log(`  … суточный лимит, переключаюсь на ${model}`);
        return ask(parts, config, attempt, tries);
      }
      const wait = Number(body.match(/"retryDelay":\s*"(\d+)/)?.[1] ?? 30) + 2;
      console.log(`  … лимит в минуту, жду ${wait} с`);
      await sleep(wait * 1000);
      return ask(parts, config, attempt + 1, tries);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  }

  return ask;
}

export const mp3Part = (file) => ({ inlineData: { mimeType: 'audio/mp3', data: readFileSync(file).toString('base64') } });
