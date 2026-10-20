import type { SceneDef, SceneObject } from '../../game/types';

// Сцена «Ферма». Координаты — центр объекта в % холста 16:9, размечены по картинке
// src/assets/scenes/farm/bg.webp (Gemini 3.1 Flash Image через Figma, файл «Говорящие картинки — арт», узел 7:2).
// Запретные зоны те же, что в лесу: панель заданий (x 27–73, y > 84), «домой» (лево-верх), светлячок (право-низ).
// id не пересекаются с лесом: по id выдаются наклейки в альбом.

const v = (id: string, extra: Partial<SceneObject['voice']> = {}) => ({
  name: `${id}_name`,
  fact: `${id}_fact`,
  echo: `${id}_echo`,
  ...extra,
});

const objects: SceneObject[] = [
  // ---------- декорации ----------
  { id: 'farm_sun', sprite: 'farm/sun', rect: { x: 57.9, y: 11.7, w: 9, h: 17 }, z: 0, voice: { name: 'sun_name' }, sfx: 'sparkle', tags: { kind: 'thing' }, findable: false, reaction: 'spin' },
  { id: 'farm_cloud_a', sprite: 'farm/cloud', rect: { x: 48.5, y: 8.9, w: 7, h: 6 }, z: 0, voice: { name: 'cloud_name' }, sfx: 'drip', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'farm_cloud_b', sprite: 'farm/cloud', rect: { x: 66.6, y: 14.6, w: 10.2, h: 11 }, z: 0, voice: { name: 'cloud_name' }, sfx: 'drip', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'barn', sprite: 'farm/barn', rect: { x: 12, y: 33, w: 18, h: 36 }, z: 1, voice: { name: 'barn_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'haystack', sprite: 'farm/haystack', rect: { x: 27.6, y: 28, w: 13, h: 26 }, z: 1, voice: { name: 'haystack_name' }, sfx: 'rustle', tags: { kind: 'thing' }, findable: false, reaction: 'wiggle' },
  { id: 'fence', sprite: 'farm/fence', rect: { x: 52.9, y: 37.8, w: 35, h: 12 }, z: 1, voice: { name: 'fence_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'garden', sprite: 'farm/garden', rect: { x: 17, y: 73.3, w: 34, h: 15 }, z: 1, voice: { name: 'garden_name' }, sfx: 'rustle', tags: { kind: 'thing' }, findable: false, reaction: 'wiggle' },
  { id: 'doghouse', sprite: 'farm/doghouse', rect: { x: 76, y: 63.3, w: 11, h: 19 }, z: 1, voice: { name: 'doghouse_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'farm_pond', sprite: 'farm/pond', rect: { x: 91.6, y: 66.4, w: 16.8, h: 17 }, z: 1, voice: { name: 'pond_name' }, sfx: 'bubble', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  // вторая, маленькая тыква: не цель, но откликается — иначе касание по ней назвало бы морковку
  { id: 'pumpkin_small', sprite: 'farm/pumpkin', rect: { x: 14.8, y: 73.9, w: 6, h: 9.5 }, z: 4, voice: { name: 'pumpkin_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'hop' },

  // ---------- цели ----------
  { id: 'cow', sprite: 'farm/cow', rect: { x: 56, y: 50.2, w: 16.7, h: 25.5 }, z: 3, voice: v('cow', { ask: 'cow_ask', echo: 'ladybug_echo' }), sfx: 'moo', tags: { kind: 'animal', color: 'black', size: 'big', action: 'look', place: 'in_grass', emotion: 'happy', says: 'му' }, findable: true, reaction: 'wiggle' },
  { id: 'pig', sprite: 'farm/pig', rect: { x: 59.3, y: 71.3, w: 11.6, h: 13 }, z: 3, voice: v('pig', { ask: 'pig_ask' }), sfx: 'grunt', tags: { kind: 'animal', color: 'pink', size: 'medium', action: 'sit', place: 'in_grass', emotion: 'happy', says: 'хрю' }, findable: true, reaction: 'shake' },
  { id: 'dog', sprite: 'farm/dog', rect: { x: 71.6, y: 72.6, w: 7, h: 14.2 }, z: 3, voice: v('dog', { ask: 'dog_ask', helped: 'dog_helped' }), sfx: 'bark', tags: { kind: 'animal', color: 'brown', size: 'small', action: 'sit', emotion: 'sad', says: 'гав' }, findable: true, reaction: 'hop' },
  { id: 'goat', sprite: 'farm/goat', rect: { x: 80.7, y: 39.7, w: 10.3, h: 20 }, z: 3, voice: v('goat', { ask: 'goat_ask' }), sfx: 'bleat', tags: { kind: 'animal', color: 'white', size: 'medium', action: 'eat', place: 'under_tree', emotion: 'happy', says: 'ме' }, findable: true, reaction: 'hop' },
  { id: 'sheep', sprite: 'farm/sheep', rect: { x: 93.2, y: 44.1, w: 9.8, h: 14.7 }, z: 3, voice: v('sheep', { sound: 'sheep_sound' }), sfx: 'baa', tags: { kind: 'animal', color: 'white', size: 'medium', action: 'look', place: 'under_tree', emotion: 'calm', says: 'бе' }, findable: true, reaction: 'wiggle' },
  { id: 'rooster', sprite: 'farm/rooster', rect: { x: 41, y: 26.8, w: 9.8, h: 17.6 }, z: 3, voice: v('rooster', { sound: 'rooster_sound' }), sfx: 'crow', tags: { kind: 'bird', color: 'orange', size: 'medium', action: 'sing', place: 'on_fence', emotion: 'happy', says: 'кукареку' }, findable: true, reaction: 'hop' },
  { id: 'hen', sprite: 'farm/hen', rect: { x: 37.1, y: 62, w: 8.6, h: 14.6 }, z: 3, voice: v('hen', { ask: 'hen_ask' }), sfx: 'cluck', tags: { kind: 'bird', color: 'brown', size: 'small', action: 'eat', place: 'in_grass', emotion: 'happy', says: 'ко' }, findable: true, reaction: 'hop' },
  { id: 'chick', sprite: 'farm/chick', rect: { x: 45.5, y: 66, w: 6.5, h: 10 }, z: 3, voice: v('chick', { ask: 'chick_ask', helped: 'chick_helped' }), sfx: 'peep', tags: { kind: 'bird', color: 'yellow', size: 'small', action: 'sit', place: 'in_grass', emotion: 'sad', says: 'пи' }, findable: true, reaction: 'hop' },
  { id: 'goose', sprite: 'farm/goose', rect: { x: 91.9, y: 60.9, w: 7, h: 13 }, z: 3, voice: v('goose', { sound: 'goose_sound' }), sfx: 'honk', tags: { kind: 'bird', color: 'white', size: 'medium', action: 'swim', place: 'in_water', emotion: 'happy', says: 'га' }, findable: true, reaction: 'hop' },
  { id: 'cat', sprite: 'farm/cat', rect: { x: 64, y: 33, w: 8, h: 11 }, z: 3, voice: v('cat', { sound: 'cat_sound' }), sfx: 'meow', tags: { kind: 'animal', color: 'orange', size: 'small', action: 'sleep', place: 'on_fence', emotion: 'sleepy', says: 'мяу' }, findable: true, reaction: 'wiggle' },
  { id: 'horse', sprite: 'farm/horse', rect: { x: 24.4, y: 44, w: 16.5, h: 27 }, z: 3, voice: v('horse', { ask: 'horse_ask' }), sfx: 'neigh', tags: { kind: 'animal', color: 'brown', size: 'big', action: 'eat', emotion: 'happy', says: 'иго' }, findable: true, reaction: 'hop' },
  { id: 'tractor', sprite: 'farm/tractor', rect: { x: 70.5, y: 48.9, w: 8.3, h: 12 }, z: 3, voice: v('tractor'), sfx: 'grunt', tags: { kind: 'thing', color: 'red', size: 'big' }, findable: true, reaction: 'shake' },
  { id: 'apple', sprite: 'farm/apple', rect: { x: 87.5, y: 17, w: 19, h: 26 }, z: 2, voice: v('apple'), sfx: 'pop', tags: { kind: 'plant', color: 'red', size: 'small', action: 'grow', place: 'on_tree' }, findable: true, reaction: 'wiggle' },
  { id: 'sunflower', sprite: 'farm/sunflower', rect: { x: 5, y: 57, w: 6.5, h: 21.5 }, z: 3, voice: v('sunflower'), sfx: 'sparkle', tags: { kind: 'plant', color: 'yellow', size: 'big', action: 'grow', place: 'in_garden' }, findable: true, reaction: 'wiggle' },
  { id: 'carrot', sprite: 'farm/carrot', rect: { x: 9, y: 69, w: 15.4, h: 18 }, z: 3, voice: v('carrot'), sfx: 'pop', tags: { kind: 'vegetable', color: 'orange', size: 'small', action: 'grow', place: 'in_garden' }, findable: true, reaction: 'hop' },
  { id: 'pumpkin', sprite: 'farm/pumpkin', rect: { x: 20.6, y: 65.8, w: 7.3, h: 11.7 }, z: 3, voice: v('pumpkin'), sfx: 'pop', tags: { kind: 'vegetable', color: 'orange', size: 'big', action: 'grow', place: 'in_garden' }, findable: true, reaction: 'hop' },
  { id: 'cabbage', sprite: 'farm/cabbage', rect: { x: 21.5, y: 74.3, w: 6.5, h: 8.5 }, z: 4, voice: v('cabbage'), sfx: 'pop', tags: { kind: 'vegetable', color: 'green', size: 'medium', action: 'grow', place: 'in_garden' }, findable: true, reaction: 'hop' },
  { id: 'tomato', sprite: 'farm/tomato', rect: { x: 28.7, y: 70.7, w: 8, h: 16.3 }, z: 3, voice: v('tomato'), sfx: 'pop', tags: { kind: 'vegetable', color: 'red', size: 'small', action: 'grow', place: 'in_garden' }, findable: true, reaction: 'hop' },
];

export const farm: SceneDef = {
  id: 'farm',
  title: 'Ферма',
  icon: 'cow',
  background: 'farm/bg',
  baked: true,
  objects,
  // Та же лестница сложности, что в лесу: кто это → на слух → действие → категория → признак → место → эмоции.
  levels: [
    // Домашние животные — первые слова малыша.
    { id: 'farm_who1', type: 'who', task: 'cow_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['cow', 'pig', 'dog'] } },
    // Звукоподражания: мяу, кукареку, бе-е, га-га-га.
    { id: 'farm_sound', type: 'sound', task: 'task_sound_intro', mode: 'sequence', prompt: 'sound', hideSilhouettes: true, query: { ids: ['cat', 'rooster', 'sheep', 'goose'] } },
    { id: 'farm_who2', type: 'who', task: 'horse_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['horse', 'goat', 'hen', 'chick'] } },
    // Глагол: кто кушает?
    { id: 'farm_eat', type: 'action', task: 'task_eat', query: { action: 'eat' } },
    // Обобщающее слово: овощи.
    { id: 'farm_garden', type: 'attribute', task: 'task_garden', query: { kind: 'vegetable' } },
    { id: 'farm_red', type: 'attribute', task: 'task_red', query: { color: 'red' } },
    // Предлог «на»: кто на заборе?
    { id: 'farm_fence', type: 'place', task: 'task_fence', query: { kind: ['animal', 'bird'], place: 'on_fence' } },
    { id: 'farm_sad', type: 'emotion', task: 'task_sad', query: { emotion: 'sad' } },
  ],
  parentQuestions: [
    'Как говорит коровка? А собачка? А кошка?',
    'Кто из животных самый большой? А кто самый маленький?',
    'Что растёт на грядке? Какого цвета морковка?',
    'Почему цыплёнку грустно? Где его мама?',
    'Кто живёт на ферме, а кто в лесу?',
  ],
};
