import type { SceneDef, SceneObject } from '../../game/types';

// Сцена «Лес». Координаты — центр объекта в % холста 16:9, размечены по картинке
// src/assets/scenes/forest/bg.webp (Gemini 3.1 Flash Image через Figma, файл «Говорящие картинки — арт»).
// Запретные зоны: под панелью заданий (x 27–73, y > 84), под «домой» (лево-верх) и под светлячком (право-низ).

const v = (id: string, extra: Partial<SceneObject['voice']> = {}) => ({
  name: `${id}_name`,
  fact: `${id}_fact`,
  echo: `${id}_echo`,
  ...extra,
});

const objects: SceneObject[] = [
  // ---------- декорации (не цели, но живые) ----------
  { id: 'sun', sprite: 'forest/sun', rect: { x: 60, y: 11.7, w: 9, h: 16 }, z: 0, voice: { name: 'sun_name' }, sfx: 'sparkle', tags: { kind: 'thing' }, findable: false, reaction: 'spin' },
  { id: 'cloud_a', sprite: 'forest/cloud', rect: { x: 54.9, y: 15.4, w: 9, h: 7 }, z: 0, voice: { name: 'cloud_name' }, sfx: 'drip', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'cloud_b', sprite: 'forest/cloud', rect: { x: 65.4, y: 18.2, w: 10, h: 7 }, z: 0, flip: true, voice: { name: 'cloud_name' }, sfx: 'drip', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'spruce', sprite: 'forest/spruce', rect: { x: 12.7, y: 28.6, w: 22, h: 50 }, z: 1, voice: { name: 'spruce_name' }, sfx: 'rustle', tags: { kind: 'plant' }, findable: false, reaction: 'wiggle' },
  { id: 'birch', sprite: 'forest/birch', rect: { x: 30, y: 26, w: 12, h: 52 }, z: 1, voice: { name: 'birch_name' }, sfx: 'rustle', tags: { kind: 'plant' }, findable: false, reaction: 'wiggle' },
  { id: 'oak', sprite: 'forest/oak', rect: { x: 87, y: 26, w: 26, h: 52 }, z: 1, voice: { name: 'oak_name' }, sfx: 'rustle', tags: { kind: 'plant' }, findable: false, reaction: 'wiggle' },
  { id: 'pond', sprite: 'forest/pond', rect: { x: 84.7, y: 71.6, w: 30, h: 22 }, z: 1, voice: { name: 'pond_name' }, sfx: 'bubble', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'bush', sprite: 'forest/bush', rect: { x: 13.8, y: 69, w: 24, h: 22 }, z: 2, voice: { name: 'bush_name' }, sfx: 'rustle', tags: { kind: 'plant' }, findable: false, reaction: 'wiggle' },
  { id: 'stump', sprite: 'forest/stump', rect: { x: 48.9, y: 53.4, w: 10, h: 12 }, z: 2, voice: { name: 'stump_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'hop' },
  { id: 'flowers', sprite: 'forest/flowers', rect: { x: 74, y: 52, w: 12, h: 14 }, z: 2, voice: { name: 'flower_name' }, sfx: 'sparkle', tags: { kind: 'plant' }, findable: false, reaction: 'wiggle' },

  // ---------- цели ----------
  { id: 'squirrel', sprite: 'forest/squirrel', rect: { x: 26.5, y: 21.5, w: 8, h: 15 }, z: 3, voice: v('squirrel', { ask: 'squirrel_ask', sound: 'squirrel_sound' }), sfx: 'squeak', tags: { kind: 'animal', color: 'orange', size: 'small', action: 'eat', place: 'on_tree', emotion: 'happy', says: 'цок' }, findable: true, reaction: 'hop' },
  { id: 'owl', sprite: 'forest/owl', rect: { x: 90.3, y: 27.3, w: 6.5, h: 13 }, z: 3, voice: v('owl', { ask: 'owl_ask', sound: 'owl_sound' }), sfx: 'hoot', tags: { kind: 'bird', color: 'brown', size: 'medium', action: 'sleep', place: 'on_tree', emotion: 'sleepy', says: 'ух' }, findable: true, reaction: 'wiggle' },
  { id: 'tit', sprite: 'forest/tit', rect: { x: 81.8, y: 23.8, w: 7, h: 9 }, z: 3, voice: v('tit', { ask: 'tit_ask', sound: 'tit_sound' }), sfx: 'tweet', tags: { kind: 'bird', color: 'yellow', size: 'small', action: 'sing', place: 'on_tree', emotion: 'happy', says: 'тинь' }, findable: true, reaction: 'hop' },
  { id: 'rowan', sprite: 'forest/rowan', rect: { x: 41.8, y: 27.3, w: 14, h: 30 }, z: 2, voice: { name: 'rowan_name', fact: 'rowan_fact', echo: 'rowan_echo' }, sfx: 'rustle', tags: { kind: 'plant', color: 'red', size: 'medium', action: 'grow' }, findable: true, reaction: 'wiggle' },
  { id: 'hedgehog', sprite: 'forest/hedgehog', rect: { x: 16.4, y: 50.1, w: 8, h: 10 }, z: 3, voice: v('hedgehog', { ask: 'hedgehog_ask', sound: 'hedgehog_sound' }), sfx: 'grunt', tags: { kind: 'animal', color: 'grey', size: 'small', action: 'sleep', place: 'under_tree', emotion: 'sleepy', says: 'фыр' }, findable: true, reaction: 'shake' },
  { id: 'amanita', sprite: 'forest/amanita', rect: { x: 25.4, y: 52, w: 6.5, h: 11 }, z: 3, voice: { name: 'amanita_name', fact: 'amanita_fact', echo: 'amanita_echo' }, sfx: 'pop', tags: { kind: 'mushroom', color: 'red', size: 'big', action: 'grow', place: 'under_tree' }, findable: true, reaction: 'hop' },
  { id: 'boletus', sprite: 'forest/boletus', rect: { x: 30.5, y: 63.2, w: 6.5, h: 11 }, z: 3, voice: { name: 'boletus_name', fact: 'boletus_fact', echo: 'boletus_echo' }, sfx: 'pop', tags: { kind: 'mushroom', color: 'brown', size: 'small', action: 'grow', place: 'under_tree' }, findable: true, reaction: 'hop' },
  { id: 'ladybug', sprite: 'forest/ladybug', rect: { x: 49, y: 48.8, w: 6.5, h: 8 }, z: 4, voice: { name: 'ladybug_name', fact: 'ladybug_fact', echo: 'ladybug_echo' }, sfx: 'buzz', tags: { kind: 'insect', color: 'red', size: 'small', action: 'crawl', place: 'on_stump' }, findable: true, reaction: 'spin' },
  { id: 'strawberry', sprite: 'forest/strawberry', rect: { x: 37.8, y: 52, w: 8, h: 14 }, z: 3, voice: { name: 'strawberry_name', fact: 'strawberry_fact', echo: 'strawberry_echo' }, sfx: 'pop', tags: { kind: 'plant', color: 'red', size: 'small', action: 'grow', place: 'in_grass' }, findable: true, reaction: 'hop' },
  { id: 'bear', sprite: 'forest/bear', rect: { x: 56, y: 48.2, w: 7.5, h: 17 }, z: 3, voice: v('bear', { ask: 'bear_ask', helped: 'bear_helped' }), sfx: 'grunt', tags: { kind: 'animal', color: 'brown', size: 'big', action: 'sit', place: 'on_path', emotion: 'sad' }, findable: true, reaction: 'wiggle' },
  { id: 'bunny', sprite: 'forest/bunny', rect: { x: 64, y: 67.7, w: 8.5, h: 17 }, z: 3, voice: v('bunny', { ask: 'bunny_ask' }), sfx: 'pop', tags: { kind: 'animal', color: 'white', size: 'small', action: 'jump', place: 'in_grass', emotion: 'happy' }, findable: true, reaction: 'hop' },
  { id: 'snail', sprite: 'forest/snail', rect: { x: 50.9, y: 67.7, w: 6.5, h: 9 }, z: 4, voice: v('snail'), sfx: 'bubble', tags: { kind: 'animal', color: 'yellow', size: 'small', action: 'crawl', place: 'on_path', emotion: 'calm' }, findable: true, reaction: 'wiggle' },
  { id: 'fox', sprite: 'forest/fox', rect: { x: 15.3, y: 74.2, w: 12, h: 16 }, z: 4, voice: v('fox', { ask: 'fox_ask' }), sfx: 'grunt', tags: { kind: 'animal', color: 'orange', size: 'medium', action: 'sleep', place: 'behind_bush', emotion: 'sleepy' }, findable: true, reaction: 'shake' },
  { id: 'butterfly', sprite: 'forest/butterfly', rect: { x: 71.2, y: 41.4, w: 6.5, h: 8 }, z: 4, voice: v('butterfly'), sfx: 'sparkle', tags: { kind: 'insect', color: 'blue', size: 'small', action: 'fly', place: 'in_sky', emotion: 'happy' }, findable: true, reaction: 'spin' },
  { id: 'bee', sprite: 'forest/bee', rect: { x: 79.2, y: 42.7, w: 6.5, h: 8 }, z: 4, voice: v('bee', { ask: 'bee_ask', sound: 'bee_sound' }), sfx: 'buzz', tags: { kind: 'insect', color: 'yellow', size: 'small', action: 'fly', place: 'in_sky', emotion: 'happy', says: 'ж' }, findable: true, reaction: 'spin' },
  { id: 'duck', sprite: 'forest/duck', rect: { x: 78.1, y: 71, w: 7, h: 12 }, z: 4, voice: v('duck', { ask: 'duck_ask', sound: 'duck_sound' }), sfx: 'quack', tags: { kind: 'bird', color: 'yellow', size: 'small', action: 'swim', place: 'in_water', emotion: 'happy', says: 'кря' }, findable: true, reaction: 'hop' },
  { id: 'frog', sprite: 'forest/frog', rect: { x: 87.2, y: 69, w: 7, h: 11 }, z: 4, voice: v('frog', { ask: 'frog_ask', sound: 'frog_sound' }), sfx: 'croak', tags: { kind: 'animal', color: 'green', size: 'small', action: 'sit', place: 'in_water', emotion: 'happy', says: 'ква' }, findable: true, reaction: 'hop' },
  { id: 'fish', sprite: 'forest/fish', rect: { x: 94.1, y: 73.2, w: 6.5, h: 9 }, z: 4, voice: v('fish'), sfx: 'bubble', tags: { kind: 'animal', color: 'orange', size: 'small', action: 'jump', place: 'in_water', emotion: 'happy' }, findable: true, reaction: 'hop' },
  { id: 'mouse', sprite: 'forest/mouse', rect: { x: 92.7, y: 54, w: 6.5, h: 12 }, z: 4, voice: v('mouse', { ask: 'mouse_ask', helped: 'mouse_helped' }), sfx: 'squeak', tags: { kind: 'animal', color: 'grey', size: 'small', action: 'sit', place: 'under_tree', emotion: 'sad' }, findable: true, reaction: 'shake' },
];

export const forest: SceneDef = {
  id: 'forest',
  title: 'Лес',
  background: 'forest/bg',
  baked: true,
  objects,
  // Порядок = рост сложности (п. 2.8 требований): кто это → на слух → действие → место → признак → эмоции.
  // 10 уровней ≈ 10–15 минут для малыша (п. 2.9: контента больше чем на 10 минут).
  levels: [
    // Кто это? По одному, с силуэтами — для самых маленьких.
    { id: 'forest_who1', type: 'who', task: 'squirrel_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['squirrel', 'hedgehog', 'bunny'] } },
    // Кто так говорит? На слух, без силуэтов.
    { id: 'forest_sound', type: 'sound', task: 'task_sound_intro', mode: 'sequence', prompt: 'sound', hideSilhouettes: true, query: { ids: ['owl', 'duck', 'frog', 'bee'] } },
    // Кто это? Второй круг — новые слова.
    { id: 'forest_who2', type: 'who', task: 'fox_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['fox', 'owl', 'bear', 'frog'] } },
    // Глаголы: кто спит?
    { id: 'forest_sleep', type: 'action', task: 'task_sleep', query: { action: 'sleep' } },
    // Место: кто живёт в пруду?
    { id: 'forest_pond', type: 'place', task: 'task_pond', query: { place: 'in_water' } },
    // Признак: всё красное.
    { id: 'forest_red', type: 'attribute', task: 'task_red', query: { color: 'red' } },
    // Признак: всё жёлтое.
    { id: 'forest_yellow', type: 'attribute', task: 'task_yellow', query: { color: 'yellow' } },
    // Категория: насекомые.
    { id: 'forest_bugs', type: 'attribute', task: 'task_bugs', query: { kind: 'insect' } },
    // Предлоги: кто на дереве?
    { id: 'forest_tree', type: 'place', task: 'task_on_tree', query: { kind: ['animal', 'bird'], place: 'on_tree' } },
    // Эмоции: кому грустно — пожалей.
    { id: 'forest_sad', type: 'emotion', task: 'task_sad', query: { emotion: 'sad' } },
  ],
  parentQuestions: [
    'Что делает белочка? А что она ест?',
    'Кто в лесу спит днём? Почему сова спит днём?',
    'Почему медвежонку грустно? Как его можно утешить?',
    'Кто живёт в пруду? Как говорит уточка, а как лягушка?',
    'Найди что-нибудь маленькое и что-нибудь большое.',
  ],
};
