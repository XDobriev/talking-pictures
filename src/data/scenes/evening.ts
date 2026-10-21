import type { SceneDef, SceneObject } from '../../game/types';

// Сцена «Вечер»: мишка купается и ложится спать. Координаты — центр объекта в % холста 16:9, размечены по картинке
// src/assets/scenes/evening/bg.webp (Gemini 3.1 Flash Image через Figma, файл «Говорящие картинки — арт», узел 12:2).
// Запретные зоны: панель заданий (x 27–73, y > 84), «домой» (лево-верх), светлячок (право-низ).
// Тема — части тела и умывание. Простые части (носик, ушки) знают и трёхлетки, но показать их у другого
// и назвать — отдельный шаг; парные части — две цели, чтобы ребёнок нашёл обе. Спокойный финал игры: «Спокойной ночи!».

const v = (id: string, extra: Partial<SceneObject['voice']> = {}) => ({
  name: `${id}_name`,
  fact: `${id}_fact`,
  echo: `${id}_echo`,
  ...extra,
});

const objects: SceneObject[] = [
  // ---------- декорации ----------
  { id: 'bathtub', sprite: 'evening/bathtub', rect: { x: 31.4, y: 68.4, w: 35, h: 32.6 }, z: 0, voice: { name: 'bath_name' }, sfx: 'bubble', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  // Мишка целиком — не цель (цели — его ушки, лапки…), но выходит на праздник.
  { id: 'evening_bear', sprite: 'evening/bear', rect: { x: 24.7, y: 47.8, w: 18.9, h: 27 }, z: 1, voice: { name: 'bear_name', fact: 'evening_bear_fact', echo: 'bear_echo' }, sfx: 'grunt', tags: { kind: 'animal' }, findable: false, reaction: 'wiggle' },
  { id: 'evening_window', sprite: 'evening/window', rect: { x: 9.1, y: 36.9, w: 11.6, h: 23.8 }, z: 0, voice: { name: 'window_name' }, sfx: 'sparkle', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'mirror', sprite: 'evening/mirror', rect: { x: 59, y: 24.7, w: 13, h: 27 }, z: 0, voice: { name: 'mirror_name' }, sfx: 'sparkle', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'washbasin', sprite: 'evening/washbasin', rect: { x: 59.1, y: 60.8, w: 14.3, h: 28 }, z: 0, voice: { name: 'sink_name' }, sfx: 'bubble', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'bed', sprite: 'evening/bed', rect: { x: 86, y: 66.9, w: 26.6, h: 57.7 }, z: 0, voice: { name: 'bed_name' }, sfx: 'pop', tags: { kind: 'thing' }, findable: false, reaction: 'shake' },
  { id: 'night_lamp', sprite: 'evening/lamp', rect: { x: 95.3, y: 48.2, w: 5.8, h: 14.3 }, z: 1, voice: { name: 'lamp_name' }, sfx: 'chime', tags: { kind: 'thing' }, findable: false, reaction: 'wiggle' },

  // ---------- цели: мишка (части тела) ----------
  { id: 'ear_l', sprite: 'evening/ear_l', rect: { x: 19.3, y: 39, w: 6.5, h: 8.3 }, z: 3, voice: v('ear'), sfx: 'pop', tags: { kind: 'body', color: 'brown', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'ear_r', sprite: 'evening/ear_r', rect: { x: 28.1, y: 37.3, w: 6.5, h: 8 }, z: 3, voice: v('ear'), sfx: 'pop', tags: { kind: 'body', color: 'brown', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'nose', sprite: 'evening/nose', rect: { x: 25.4, y: 48.2, w: 6.5, h: 8 }, z: 3, voice: v('nose'), sfx: 'pop', tags: { kind: 'body', color: 'brown', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'paw_l', sprite: 'evening/paw_l', rect: { x: 17.6, y: 51, w: 6.5, h: 8 }, z: 3, voice: v('paw'), sfx: 'pop', tags: { kind: 'body', color: 'brown', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'paw_r', sprite: 'evening/paw_r', rect: { x: 32.1, y: 45.4, w: 6.5, h: 8.5 }, z: 3, voice: v('paw'), sfx: 'pop', tags: { kind: 'body', color: 'brown', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'foot_l', sprite: 'evening/foot_l', rect: { x: 41.1, y: 59.6, w: 6.5, h: 9.5 }, z: 3, voice: v('foot'), sfx: 'pop', tags: { kind: 'body', color: 'pink', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'foot_r', sprite: 'evening/foot_r', rect: { x: 45.4, y: 59.1, w: 6.5, h: 9.5 }, z: 3, voice: v('foot'), sfx: 'pop', tags: { kind: 'body', color: 'pink', size: 'small' }, findable: true, reaction: 'wiggle' },

  // ---------- цели: ванна и окно ----------
  { id: 'toy_duck', sprite: 'evening/toy_duck', rect: { x: 39.2, y: 50.3, w: 6.5, h: 8 }, z: 4, voice: { name: 'toy_duck_name', fact: 'toy_duck_fact', echo: 'duck_echo', ask: 'duck_ask', sound: 'duck_sound' }, sfx: 'quack', tags: { kind: 'toy', color: 'yellow', size: 'small', says: 'кря' }, findable: true, reaction: 'hop' },
  { id: 'boat', sprite: 'evening/boat', rect: { x: 45.2, y: 50.5, w: 6.5, h: 8 }, z: 4, voice: v('boat', { ask: 'boat_ask' }), sfx: 'whoosh', tags: { kind: 'toy', color: 'red', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'bath_tap', sprite: 'evening/tap', rect: { x: 39.8, y: 38.5, w: 6.5, h: 11 }, z: 3, voice: { name: 'tap_name', fact: 'tap_fact', echo: 'tap_echo', sound: 'tap_sound' }, sfx: 'drops', tags: { kind: 'thing', color: 'grey', size: 'small', says: 'кап' }, findable: true, reaction: 'shake' },
  { id: 'moon', sprite: 'evening/moon', rect: { x: 6.2, y: 30.5, w: 6.5, h: 8 }, z: 3, voice: v('moon'), sfx: 'sparkle', tags: { kind: 'thing', color: 'yellow', size: 'small', place: 'in_sky' }, findable: true, reaction: 'spin' },
  { id: 'evening_owl', sprite: 'evening/owl', rect: { x: 6.3, y: 42.5, w: 6.5, h: 9 }, z: 3, voice: { name: 'owl_name', fact: 'owl_fact', echo: 'owl_echo', sound: 'owl_sound' }, sfx: 'hoot', tags: { kind: 'bird', color: 'brown', size: 'small', says: 'ух' }, findable: true, reaction: 'hop' },

  // ---------- цели: умывальник ----------
  { id: 'toothbrush', sprite: 'evening/toothbrush', rect: { x: 53.8, y: 42, w: 6.5, h: 10 }, z: 3, voice: v('toothbrush', { ask: 'toothbrush_ask' }), sfx: 'rustle', tags: { kind: 'thing', color: 'red', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'soap', sprite: 'evening/soap', rect: { x: 56.6, y: 45.9, w: 6.5, h: 8 }, z: 4, voice: v('soap', { ask: 'soap_ask' }), sfx: 'bubble', tags: { kind: 'thing', color: 'yellow', size: 'small' }, findable: true, reaction: 'hop' },
  { id: 'comb', sprite: 'evening/comb', rect: { x: 63.6, y: 45.7, w: 6.5, h: 8 }, z: 3, voice: v('comb', { ask: 'comb_ask' }), sfx: 'rustle', tags: { kind: 'thing', color: 'brown', size: 'small' }, findable: true, reaction: 'wiggle' },
  { id: 'towel', sprite: 'evening/towel', rect: { x: 69.5, y: 49.9, w: 6.5, h: 27 }, z: 3, voice: v('towel', { ask: 'towel_ask' }), sfx: 'whoosh', tags: { kind: 'thing', color: 'green', size: 'medium' }, findable: true, reaction: 'wiggle' },

  // ---------- цели: кроватка ----------
  { id: 'pillow', sprite: 'evening/pillow', rect: { x: 82.5, y: 50.1, w: 14.5, h: 14.3 }, z: 2, voice: v('pillow'), sfx: 'pop', tags: { kind: 'thing', color: 'white', size: 'big' }, findable: true, reaction: 'wiggle' },
  { id: 'pyjamas', sprite: 'evening/pyjamas', rect: { x: 81.2, y: 66.9, w: 10.5, h: 19.5 }, z: 3, voice: v('pyjamas'), sfx: 'whoosh', tags: { kind: 'thing', color: 'blue', size: 'medium' }, findable: true, reaction: 'wiggle' },
  { id: 'slippers', sprite: 'evening/slippers', rect: { x: 75.2, y: 84.1, w: 6.8, h: 8.6 }, z: 3, voice: v('slippers'), sfx: 'pop', tags: { kind: 'thing', color: 'red', size: 'small' }, findable: true, reaction: 'hop' },
  { id: 'evening_cat', sprite: 'evening/cat', rect: { x: 91.7, y: 68.9, w: 10.2, h: 10.2 }, z: 3, voice: { name: 'cat_name', fact: 'evening_cat_fact', echo: 'cat_echo', sound: 'cat_sound' }, sfx: 'meow', tags: { kind: 'animal', color: 'grey', size: 'small', action: 'sleep', emotion: 'sleepy' }, findable: true, reaction: 'wiggle' },
];

export const evening: SceneDef = {
  id: 'evening',
  title: 'Вечер',
  icon: 'evening_bear',
  background: 'evening/bg',
  baked: true,
  story: {
    intro: 'evening_intro',
    finale: 'evening_finale',
    guests: ['evening_bear', 'toy_duck', 'boat', 'soap', 'toothbrush', 'comb', 'towel', 'pyjamas', 'slippers', 'pillow', 'moon', 'evening_owl', 'evening_cat'],
  },
  objects,
  // Лестница: что это → на слух → части тела (лицо) → вещи для умывания → части тела (лапки, пяточки) → игрушки → вещи для сна → цвет.
  levels: [
    { id: 'evening_who1', type: 'who', task: 'duck_ask', mode: 'sequence', prompt: 'ask', query: { ids: ['toy_duck', 'boat', 'soap'] } },
    // Вечерние звуки: кря, кап-кап, у-ух.
    { id: 'evening_sound', type: 'sound', task: 'task_sound_intro', lead: 'evening_lead_sound', mode: 'sequence', prompt: 'sound', hideSilhouettes: true, query: { ids: ['toy_duck', 'bath_tap', 'evening_owl'] } },
    { id: 'evening_face', type: 'who', task: 'task_face', lead: 'evening_lead_face', icon: 'nose', query: { ids: ['nose', 'ear_l', 'ear_r'] } }, // наклейка — первая цель: мордочка, а не ушко
    { id: 'evening_wash', type: 'who', task: 'toothbrush_ask', lead: 'evening_lead_wash', mode: 'sequence', prompt: 'ask', query: { ids: ['toothbrush', 'towel', 'comb'] } },
    { id: 'evening_paws', type: 'who', task: 'task_paws', lead: 'evening_lead_paws', icon: 'foot_r', query: { ids: ['paw_l', 'paw_r', 'foot_l', 'foot_r'] } },
    { id: 'evening_toys', type: 'attribute', task: 'task_toys', lead: 'evening_lead_toys', icon: 'boat', query: { kind: 'toy' } },
    { id: 'evening_bed', type: 'attribute', task: 'task_bed', lead: 'evening_lead_bed', icon: 'pillow', query: { ids: ['pyjamas', 'slippers', 'pillow'] } },
    { id: 'evening_yellow', type: 'attribute', task: 'task_yellow', lead: 'evening_lead_yellow', icon: 'moon', query: { color: 'yellow' } },
  ],
  parentQuestions: [
    'Где у тебя ушки? А носик? Покажи!',
    'Чем мы умываемся вечером? А чем вытираемся?',
    'Что ты надеваешь перед сном?',
    'Кто не спит ночью, а ухает за окном?',
  ],
};
