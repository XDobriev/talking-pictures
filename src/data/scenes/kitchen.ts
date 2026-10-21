import type { SceneDef, SceneObject } from '../../game/types';

// Сцена «Кухня». Координаты — центр объекта в % холста 16:9, размечены по картинке
// src/assets/scenes/kitchen/bg.webp (Gemini 3.1 Flash Image через Figma, файл «Говорящие картинки — арт», узел 11:2).
// Запретные зоны: панель заданий (x 27–73, y > 84), «домой» (лево-верх), светлячок (право-низ).
// Тема кухни — бытовой словарь, который ребёнок слышит каждый день: посуда, еда, «горячо», обобщающее слово «посуда».
// Родитель продолжает игру на настоящей кухне («где у нас чайник?»).

const v = (id: string, extra: Partial<SceneObject['voice']> = {}) => ({
  name: `${id}_name`,
  fact: `${id}_fact`,
  echo: `${id}_echo`,
  ...extra,
});

const objects: SceneObject[] = [
  // ---------- декорации ----------
  { id: 'fridge', sprite: 'kitchen/fridge', rect: { x: 11, y: 54.4, w: 15.5, h: 53.8 }, z: 1, voice: { name: 'fridge_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'stove', sprite: 'kitchen/stove', rect: { x: 28.8, y: 64.9, w: 16.6, h: 32.2 }, z: 1, voice: { name: 'stove_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'clock', sprite: 'kitchen/clock', rect: { x: 48.8, y: 18.5, w: 6.4, h: 11.5 }, z: 1, voice: { name: 'clock_name' }, sfx: 'chime', tags: { kind: 'thing' }, findable: false, reaction: 'wiggle' },
  { id: 'window', sprite: 'kitchen/window', rect: { x: 66.9, y: 26.8, w: 21.5, h: 33.5 }, z: 1, voice: { name: 'window_name' }, sfx: 'sparkle', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'kitchen_table', sprite: 'kitchen/table', rect: { x: 70.6, y: 75.5, w: 32.3, h: 36.5 }, z: 1, voice: { name: 'table_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'cupboard', sprite: 'kitchen/cupboard', rect: { x: 91.1, y: 16.1, w: 17.7, h: 32.2 }, z: 1, voice: { name: 'cupboard_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },

  // ---------- цели: люди и звери ----------
  { id: 'grandma', sprite: 'kitchen/grandma', rect: { x: 43.1, y: 56.3, w: 12, h: 55.4 }, z: 2, voice: v('grandma', { ask: 'grandma_ask' }), sfx: 'chime', tags: { kind: 'person', size: 'big', action: 'cook', emotion: 'happy' }, findable: true, reaction: 'wiggle' },
  { id: 'kitchen_girl', sprite: 'kitchen/girl', rect: { x: 56.3, y: 66.7, w: 12, h: 32 }, z: 2, voice: { name: 'girl_name', fact: 'kitchen_girl_fact', echo: 'kitchen_girl_echo', ask: 'kitchen_girl_ask' }, sfx: 'pop', tags: { kind: 'person', color: 'yellow', size: 'medium', action: 'eat', emotion: 'happy' }, findable: true, reaction: 'hop' },
  { id: 'kitchen_boy', sprite: 'kitchen/boy', rect: { x: 91.4, y: 63.3, w: 8.4, h: 28.6 }, z: 3, voice: { name: 'boy_name', fact: 'kitchen_boy_fact', echo: 'kitchen_boy_echo', ask: 'kitchen_boy_ask', helped: 'boy_sad_helped' }, sfx: 'chime', tags: { kind: 'person', color: 'blue', size: 'medium', action: 'look', emotion: 'sad' }, findable: true, reaction: 'wiggle' },
  { id: 'kitten', sprite: 'kitchen/kitten', rect: { x: 75, y: 85, w: 8.3, h: 15 }, z: 3, voice: v('kitten', { sound: 'cat_sound', helped: 'kitten_helped' }), sfx: 'meow', tags: { kind: 'animal', color: 'orange', size: 'small', action: 'sit', emotion: 'sad', says: 'мяу' }, findable: true, reaction: 'hop' },
  { id: 'kitchen_mouse', sprite: 'kitchen/mouse', rect: { x: 14.3, y: 84.3, w: 7, h: 8.6 }, z: 3, voice: { name: 'mouse_name', fact: 'kitchen_mouse_fact', echo: 'mouse_echo', ask: 'mouse_ask' }, sfx: 'squeak', tags: { kind: 'animal', color: 'grey', size: 'small', action: 'eat', emotion: 'happy' }, findable: true, reaction: 'hop' },
  { id: 'parrot', sprite: 'kitchen/parrot', rect: { x: 60.8, y: 32.6, w: 7, h: 19.5 }, z: 3, voice: v('parrot', { sound: 'sparrow_sound' }), sfx: 'tweet', tags: { kind: 'bird', color: 'green', size: 'small', action: 'sing', emotion: 'happy', says: 'чирик' }, findable: true, reaction: 'hop' },

  // ---------- цели: на плите ----------
  { id: 'kettle', sprite: 'kitchen/kettle', rect: { x: 25.1, y: 45.2, w: 6.6, h: 11.7 }, z: 4, voice: v('kettle'), sfx: 'whoosh', tags: { kind: 'dishes', color: 'red', size: 'medium', place: 'on_stove' }, findable: true, reaction: 'shake' },
  { id: 'pot', sprite: 'kitchen/pot', rect: { x: 32.5, y: 48.5, w: 8, h: 9.8 }, z: 4, voice: v('pot', { sound: 'pot_sound' }), sfx: 'boil', tags: { kind: 'dishes', color: 'blue', size: 'medium', place: 'on_stove', says: 'буль' }, findable: true, reaction: 'shake' },
  { id: 'pan', sprite: 'kitchen/pan', rect: { x: 34, y: 57.5, w: 10, h: 8 }, z: 4, voice: v('pan'), sfx: 'rustle', tags: { kind: 'dishes', color: 'black', size: 'medium', place: 'on_stove' }, findable: true, reaction: 'shake' },

  // ---------- цели: у окна ----------
  { id: 'tap', sprite: 'kitchen/tap', rect: { x: 72.7, y: 42.5, w: 6.5, h: 9 }, z: 3, voice: v('tap', { sound: 'tap_sound' }), sfx: 'drops', tags: { kind: 'thing', color: 'grey', size: 'small', says: 'кап' }, findable: true, reaction: 'shake' },

  // ---------- цели: на столе ----------
  { id: 'bread', sprite: 'kitchen/bread', rect: { x: 63.6, y: 58.1, w: 6.6, h: 8.2 }, z: 4, voice: v('bread', { ask: 'bread_ask' }), sfx: 'pop', tags: { kind: 'food', color: 'brown', size: 'small', place: 'on_table' }, findable: true, reaction: 'hop' },
  { id: 'milk', sprite: 'kitchen/milk', rect: { x: 69.8, y: 55.3, w: 6.5, h: 10.4 }, z: 4, voice: v('milk', { ask: 'milk_ask' }), sfx: 'bubble', tags: { kind: 'food', color: 'white', size: 'small', place: 'on_table' }, findable: true, reaction: 'hop' },
  { id: 'cheese', sprite: 'kitchen/cheese', rect: { x: 65.6, y: 66.1, w: 6.5, h: 8 }, z: 4, voice: v('cheese', { ask: 'cheese_ask' }), sfx: 'pop', tags: { kind: 'food', color: 'yellow', size: 'small', place: 'on_table' }, findable: true, reaction: 'hop' },
  { id: 'pie', sprite: 'kitchen/pie', rect: { x: 73.7, y: 61.2, w: 9.3, h: 8 }, z: 4, voice: v('pie', { ask: 'pie_ask' }), sfx: 'sparkle', tags: { kind: 'food', color: 'brown', size: 'medium', place: 'on_table' }, findable: true, reaction: 'hop' },
  { id: 'banana', sprite: 'kitchen/banana', rect: { x: 72.3, y: 67.1, w: 6.5, h: 8 }, z: 4, voice: v('banana'), sfx: 'pop', tags: { kind: 'food', color: 'yellow', size: 'small', place: 'on_table' }, findable: true, reaction: 'hop' },
  { id: 'kitchen_apple', sprite: 'kitchen/apple', rect: { x: 77.4, y: 67.2, w: 6.5, h: 8 }, z: 4, voice: { name: 'apple_name', fact: 'kitchen_apple_fact', echo: 'apple_echo' }, sfx: 'pop', tags: { kind: 'food', color: 'red', size: 'small', place: 'on_table' }, findable: true, reaction: 'hop' },
  { id: 'cup', sprite: 'kitchen/cup', rect: { x: 81.2, y: 58.5, w: 6.5, h: 8 }, z: 4, voice: v('cup'), sfx: 'chime', tags: { kind: 'dishes', color: 'red', size: 'small', place: 'on_table' }, findable: true, reaction: 'hop' },
  { id: 'plate', sprite: 'kitchen/plate', rect: { x: 82.1, y: 64, w: 6.5, h: 8 }, z: 4, voice: v('plate'), sfx: 'chime', tags: { kind: 'dishes', color: 'white', size: 'small', place: 'on_table' }, findable: true, reaction: 'spin' },
  { id: 'spoon', sprite: 'kitchen/spoon', rect: { x: 82.5, y: 68.8, w: 6.5, h: 8 }, z: 4, voice: v('spoon'), sfx: 'chime', tags: { kind: 'dishes', color: 'brown', size: 'small', place: 'on_table' }, findable: true, reaction: 'spin' },
];

export const kitchen: SceneDef = {
  id: 'kitchen',
  title: 'Кухня',
  icon: 'kettle',
  background: 'kitchen/bg',
  baked: true,
  story: { intro: 'kitchen_intro', finale: 'kitchen_finale', guests: 'all' },
  objects,
  // Та же лестница сложности: кто это → на слух → что это → место («на плите») → глагол → обобщающее слово → цвет → эмоции.
  levels: [
    { id: 'kitchen_who1', type: 'who', task: 'grandma_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['grandma', 'kitchen_girl', 'kitchen_boy'] } },
    // Звуки кухни: кап-кап, мяу, буль-буль, чик-чирик.
    { id: 'kitchen_sound', type: 'sound', task: 'task_sound_intro', lead: 'kitchen_lead_sound', mode: 'sequence', prompt: 'sound', hideSilhouettes: true, query: { ids: ['tap', 'kitten', 'pot', 'parrot'] } },
    { id: 'kitchen_who2', type: 'who', task: 'bread_ask', lead: 'kitchen_lead_who2', mode: 'sequence', prompt: 'ask', query: { ids: ['bread', 'milk', 'cheese', 'pie'] } },
    // Предлог «на»: что стоит на плите?
    { id: 'kitchen_stove', type: 'place', task: 'task_stove', lead: 'kitchen_lead_stove', icon: 'pot', query: { place: 'on_stove' } },
    // «Где спрятался?» — «под, в, на». Силуэты скрыты: искать по слову, а не по форме.
    { id: 'kitchen_where1', type: 'place', task: 'task_where', lead: 'lead_hide', mode: 'sequence', hideSilhouettes: true, query: { ids: ['kitten', 'parrot', 'kitchen_girl'] }, asks: { kitten: 'where_kitten', parrot: 'where_parrot', kitchen_girl: 'where_kitchen_girl' } },
    { id: 'kitchen_eat', type: 'action', task: 'task_eat', lead: 'kitchen_lead_eat', icon: 'kitchen_mouse', query: { action: 'eat' } },
    // Обобщающее слово: посуда.
    { id: 'kitchen_dishes', type: 'attribute', task: 'task_dishes', lead: 'kitchen_lead_dishes', icon: 'cup', query: { kind: 'dishes' } },
    { id: 'kitchen_yellow', type: 'attribute', task: 'task_yellow', lead: 'kitchen_lead_yellow', icon: 'banana', query: { color: 'yellow' } },
    { id: 'kitchen_red', type: 'attribute', task: 'task_red', lead: 'kitchen_lead_red', icon: 'kitchen_apple', query: { color: 'red' } },
    // «Где спрятался?» — «рядом, между».
    { id: 'kitchen_where2', type: 'place', task: 'task_where2', lead: 'lead_hide2', mode: 'sequence', hideSilhouettes: true, query: { ids: ['kitchen_mouse', 'banana', 'grandma'] }, asks: { kitchen_mouse: 'where_kitchen_mouse', banana: 'where_banana', grandma: 'where_grandma' } },
    { id: 'kitchen_sad', type: 'emotion', task: 'task_sad', lead: 'kitchen_lead_sad', icon: 'kitten', query: { emotion: 'sad' } },
  ],
  parentQuestions: [
    'Что варит бабушка? А что варим мы дома?',
    'Где у нас дома чайник? Почему его нельзя трогать?',
    'Что из посуды ты знаешь? Найди дома ложку и чашку.',
    'Почему котёнку грустно? Чем его можно накормить?',
  ],
};
