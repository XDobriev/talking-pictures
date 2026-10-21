// Раскладка альбома наклеек по умолчанию: 9 в ряд, 5 рядов внахлёст, как коллаж; дальше — новый слой со сдвигом.
// Раньше было 6 в ряд с шагом 24%: с 19-й наклейки ряды уходили за нижний край, а сцен теперь пять.
// Координаты — центр наклейки в % холста; ребёнок может перетащить её куда угодно.
const COLS = 9;
const ROWS = 5;

export function defaultSpot(i: number) {
  const col = i % COLS;
  const row = Math.floor(i / COLS) % ROWS;
  const layer = Math.floor(i / (COLS * ROWS));
  return { x: 9 + col * 10 + (row % 2) * 4 + layer * 2, y: 30 + row * 13 + layer * 2 };
}
