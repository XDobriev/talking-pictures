// Внутренняя телеметрия без персональных данных: где дети застревают, какие подсказки берут.
// Сейчас пишет в консоль (dev) и в кольцевой буфер localStorage — его видно в dev-инспекторе.
// Позже — Яндекс Метрика (Яндекс Игры рекомендуют её сами, курс «Аналитика с Яндекс Метрикой»).

export type EventName = 'level_start' | 'target_found' | 'wrong_tap' | 'hint_used' | 'hint_passive' | 'level_complete' | 'ad_shown' | 'session_start';

const KEY = 'talking-pictures-telemetry';
const LIMIT = 300;

export function track(event: EventName, data: Record<string, string | number> = {}) {
  const row = { t: Date.now(), event, ...data };
  if (import.meta.env.DEV) console.debug('[track]', event, data);
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[];
    list.push(row);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-LIMIT)));
  } catch {
    /* хранилище недоступно — не страшно */
  }
}

export function readTelemetry(): Array<Record<string, unknown>> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
