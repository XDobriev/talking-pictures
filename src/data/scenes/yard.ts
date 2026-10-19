import type { SceneDef, SceneObject } from '../../game/types';

// Сцена «Двор». Координаты — центр объекта в % холста 16:9, размечены по картинке
// src/assets/scenes/yard/bg.webp (Gemini 3.1 Flash Image через Figma, файл «Говорящие картинки — арт», узел 8:2).
// Запретные зоны: панель заданий (x 27–73, y > 84), «домой» (лево-верх), светлячок (право-низ).
// Главная тема двора — глаголы: дети качаются, катаются, прыгают, едут. Эхо-повтор — тоже на глаголы.

const v = (id: string, extra: Partial<SceneObject['voice']> = {}) => ({
  name: `${id}_name`,
  fact: `${id}_fact`,
  echo: `${id}_echo`,
  ...extra,
});

const objects: SceneObject[] = [
  // ---------- декорации ----------
  { id: 'yard_sun', sprite: 'yard/sun', rect: { x: 30.1, y: 11.6, w: 6.5, h: 11 }, z: 0, voice: { name: 'sun_name' }, sfx: 'sparkle', tags: { kind: 'thing' }, findable: false, reaction: 'spin' },
  { id: 'yard_cloud', sprite: 'yard/cloud', rect: { x: 26, y: 15.1, w: 8, h: 7 }, z: 0, voice: { name: 'cloud_name' }, sfx: 'drip', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'house', sprite: 'yard/house', rect: { x: 10.9, y: 31.8, w: 14.5, h: 37.5 }, z: 1, voice: { name: 'house_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'yard_tree', sprite: 'yard/tree', rect: { x: 86.9, y: 35.5, w: 26.2, h: 71 }, z: 1, voice: { name: 'oak_name' }, sfx: 'rustle', tags: { kind: 'plant' }, findable: false, reaction: 'wiggle' },
  { id: 'bench', sprite: 'yard/bench', rect: { x: 82.6, y: 62.8, w: 13.3, h: 18.9 }, z: 1, voice: { name: 'bench_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'sandbox', sprite: 'yard/sandbox', rect: { x: 43.2, y: 77.6, w: 20.8, h: 12 }, z: 1, voice: { name: 'sandbox_name' }, sfx: 'rustle', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'swings', sprite: 'yard/swings', rect: { x: 13.3, y: 67.6, w: 20.1, h: 32.8 }, z: 1, voice: { name: 'swings_name' }, sfx: 'whoosh', tags: { kind: 'thing' }, findable: false, reaction: 'wiggle' },
  { id: 'slide', sprite: 'yard/slide', rect: { x: 30.7, y: 56.4, w: 16, h: 24 }, z: 1, voice: { name: 'slide_name' }, sfx: 'whoosh', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },

  // ---------- цели: дети ----------
  { id: 'girl_swing', sprite: 'yard/girl_swing', rect: { x: 16, y: 68.1, w: 10.5, h: 19.5 }, z: 3, voice: v('girl_swing', { name: 'girl_name', ask: 'girl_swing_ask' }), sfx: 'whoosh', tags: { kind: 'person', color: 'yellow', size: 'medium', action: 'swing', emotion: 'happy' }, findable: true, reaction: 'wiggle' },
  { id: 'boy_slide', sprite: 'yard/boy_slide', rect: { x: 30.3, y: 49.5, w: 9.1, h: 19.5 }, z: 3, voice: v('boy_slide', { name: 'boy_name', ask: 'boy_slide_ask' }), sfx: 'whoosh', tags: { kind: 'person', color: 'green', size: 'medium', action: 'slide', emotion: 'happy' }, findable: true, reaction: 'hop' },
  { id: 'girl_rope', sprite: 'yard/girl_rope', rect: { x: 66.9, y: 52.1, w: 8.6, h: 24.7 }, z: 3, voice: v('girl_rope', { name: 'girl_name', ask: 'girl_rope_ask' }), sfx: 'pop', tags: { kind: 'person', color: 'pink', size: 'medium', action: 'jump', emotion: 'happy' }, findable: true, reaction: 'hop' },
  { id: 'boy_bike', sprite: 'yard/boy_bike', rect: { x: 44, y: 48.8, w: 7.6, h: 18.9 }, z: 3, voice: v('boy_bike', { name: 'boy_name', ask: 'boy_bike_ask', sound: 'boy_bike_sound' }), sfx: 'bell', tags: { kind: 'person', color: 'blue', size: 'medium', action: 'ride', emotion: 'happy', says: 'дзынь' }, findable: true, reaction: 'hop' },
  { id: 'boy_ball', sprite: 'yard/boy_ball', rect: { x: 53.3, y: 55.1, w: 7, h: 21.9 }, z: 3, voice: v('boy_ball', { name: 'boy_name', ask: 'boy_ball_ask' }), sfx: 'pop', tags: { kind: 'person', color: 'orange', size: 'medium', action: 'play', emotion: 'happy' }, findable: true, reaction: 'hop' },
  { id: 'kid_sand', sprite: 'yard/kid_sand', rect: { x: 44.1, y: 70, w: 6.5, h: 16.1 }, z: 3, voice: v('kid_sand', { name: 'kid_name', ask: 'kid_sand_ask' }), sfx: 'rustle', tags: { kind: 'person', color: 'green', size: 'small', action: 'play', emotion: 'happy' }, findable: true, reaction: 'wiggle' },
  { id: 'baby', sprite: 'yard/baby', rect: { x: 74, y: 66.4, w: 8.7, h: 18.2 }, z: 3, voice: v('baby'), sfx: 'chime', tags: { kind: 'person', color: 'pink', size: 'small', action: 'sleep', emotion: 'sleepy' }, findable: true, reaction: 'wiggle' },
  { id: 'girl_sad', sprite: 'yard/girl_sad', rect: { x: 80.8, y: 64.5, w: 6.5, h: 22.1 }, z: 3, voice: v('girl_sad', { name: 'girl_name', helped: 'girl_sad_helped' }), sfx: 'chime', tags: { kind: 'person', color: 'blue', size: 'medium', action: 'look', emotion: 'sad' }, findable: true, reaction: 'wiggle' },
  { id: 'boy_sad', sprite: 'yard/boy_sad', rect: { x: 94.6, y: 68, w: 6.5, h: 19.5 }, z: 3, voice: v('boy_sad', { name: 'boy_name', helped: 'boy_sad_helped' }), sfx: 'chime', tags: { kind: 'person', color: 'blue', size: 'medium', action: 'look', emotion: 'sad' }, findable: true, reaction: 'wiggle' },

  // ---------- цели: птицы, игрушки, вещи ----------
  { id: 'pigeons', sprite: 'yard/pigeons', rect: { x: 61.6, y: 74.4, w: 10.2, h: 8 }, z: 3, voice: v('pigeons', { sound: 'pigeons_sound' }), sfx: 'coo', tags: { kind: 'bird', color: 'grey', size: 'small', action: 'eat', place: 'on_path', emotion: 'calm', says: 'гули' }, findable: true, reaction: 'hop' },
  { id: 'sparrow', sprite: 'yard/sparrow', rect: { x: 87.3, y: 35.6, w: 6.5, h: 8 }, z: 3, voice: v('sparrow', { sound: 'sparrow_sound' }), sfx: 'tweet', tags: { kind: 'bird', color: 'brown', size: 'small', action: 'sit', place: 'on_tree', emotion: 'happy', says: 'чирик' }, findable: true, reaction: 'hop' },
  { id: 'car', sprite: 'yard/car', rect: { x: 5.8, y: 49.5, w: 9, h: 9.5 }, z: 3, voice: v('car', { sound: 'car_sound' }), sfx: 'horn', tags: { kind: 'thing', color: 'red', size: 'big', says: 'би' }, findable: true, reaction: 'shake' },
  { id: 'ball', sprite: 'yard/ball', rect: { x: 59.5, y: 55.1, w: 6.5, h: 8 }, z: 4, voice: v('ball', { ask: 'ball_ask' }), sfx: 'pop', tags: { kind: 'toy', color: 'red', size: 'small', action: 'jump' }, findable: true, reaction: 'hop' },
  { id: 'bucket', sprite: 'yard/bucket', rect: { x: 38.1, y: 74.9, w: 6.5, h: 8 }, z: 4, voice: v('bucket', { ask: 'bucket_ask' }), sfx: 'pop', tags: { kind: 'toy', color: 'yellow', size: 'small' }, findable: true, reaction: 'hop' },
  { id: 'scooter', sprite: 'yard/scooter', rect: { x: 87.1, y: 71.5, w: 7.4, h: 12.8 }, z: 3, voice: v('scooter', { ask: 'scooter_ask' }), sfx: 'whoosh', tags: { kind: 'toy', color: 'blue', size: 'medium' }, findable: true, reaction: 'shake' },
  { id: 'kite', sprite: 'yard/kite', rect: { x: 40.6, y: 24.2, w: 8.9, h: 16.7 }, z: 3, voice: v('kite'), sfx: 'whoosh', tags: { kind: 'toy', color: 'blue', size: 'medium', action: 'fly', place: 'in_sky' }, findable: true, reaction: 'wiggle' },
  { id: 'balloon', sprite: 'yard/balloon', rect: { x: 71, y: 26.3, w: 6.5, h: 14 }, z: 3, voice: v('balloon'), sfx: 'pop', tags: { kind: 'thing', color: 'red', size: 'small', action: 'fly', place: 'in_sky' }, findable: true, reaction: 'wiggle' },
  { id: 'plane', sprite: 'yard/plane', rect: { x: 62.1, y: 11.3, w: 6.5, h: 8 }, z: 3, voice: v('plane'), sfx: 'whoosh', tags: { kind: 'thing', color: 'blue', size: 'small', action: 'fly', place: 'in_sky' }, findable: true, reaction: 'spin' },
];

export const yard: SceneDef = {
  id: 'yard',
  title: 'Двор',
  icon: 'ball',
  background: 'yard/bg',
  baked: true,
  objects,
  levels: [
    // Предметы — первые слова.
    { id: 'yard_who1', type: 'who', task: 'ball_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['ball', 'bucket', 'scooter'] } },
    // Звуки двора: би-би, чик-чирик, дзынь-дзынь, гули-гули.
    { id: 'yard_sound', type: 'sound', task: 'task_sound_intro', mode: 'sequence', prompt: 'sound', hideSilhouettes: true, query: { ids: ['car', 'sparrow', 'boy_bike', 'pigeons'] } },
    // Глаголы: задание звучит действием («Кто качается на качелях?»), эхо — тоже глагол.
    { id: 'yard_verbs1', type: 'action', task: 'girl_swing_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['girl_swing', 'boy_slide', 'girl_rope'] } },
    { id: 'yard_verbs2', type: 'action', task: 'boy_bike_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['boy_bike', 'boy_ball', 'kid_sand'] } },
    // Обобщающее слово: игрушки.
    { id: 'yard_toys', type: 'attribute', task: 'task_toys', icon: 'scooter', query: { kind: 'toy' } },
    // Место: что в небе?
    { id: 'yard_sky', type: 'place', task: 'task_sky', icon: 'plane', query: { place: 'in_sky' } },
    { id: 'yard_red', type: 'attribute', task: 'task_red', icon: 'balloon', query: { color: 'red' } },
    { id: 'yard_sad', type: 'emotion', task: 'task_sad', query: { emotion: 'sad' } },
  ],
  parentQuestions: [
    'Что делает девочка на качелях? А мальчик на горке?',
    'Почему девочка плачет? Куда улетел шарик?',
    'Что летает в небе? Что ещё умеет летать?',
    'Какие игрушки ты нашёл? Во что ты любишь играть во дворе?',
    'Кто говорит «би-би», а кто «чик-чирик»?',
  ],
};
