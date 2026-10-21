// Модель данных сцены. Координаты — в процентах от холста 16:9, x/y — ЦЕНТР объекта.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Kind = 'animal' | 'bird' | 'insect' | 'plant' | 'mushroom' | 'vegetable' | 'person' | 'toy' | 'thing';
export type Color = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'brown' | 'white' | 'grey' | 'black' | 'pink';
export type Size = 'small' | 'medium' | 'big';
export type Action = 'sleep' | 'eat' | 'jump' | 'sit' | 'fly' | 'swim' | 'hide' | 'look' | 'grow' | 'crawl' | 'sing' | 'swing' | 'slide' | 'ride' | 'play';
export type Place = 'on_tree' | 'under_tree' | 'in_grass' | 'in_water' | 'in_sky' | 'on_stump' | 'behind_bush' | 'on_path' | 'on_fence' | 'in_garden';
export type Emotion = 'happy' | 'sad' | 'scared' | 'sleepy' | 'calm';

export interface ObjectTags {
  kind: Kind;
  color?: Color;
  size?: Size;
  action?: Action;
  place?: Place;
  emotion?: Emotion;
  /** Звукоподражание для заданий «кто так говорит?» */
  says?: string;
}

/** Голосовые фразы объекта — ключи таблицы фраз (src/data/phrases.ts). */
export interface ObjectVoice {
  /** «Это белочка.» */
  name: string;
  /** «Она грызёт орешек.» */
  fact?: string;
  /** «Скажи: бе-лоч-ка!» */
  echo?: string;
  /** «Найди белочку!» — для пошаговых заданий. */
  ask?: string;
  /** «Кто говорит: цок-цок?» — для заданий на слух. */
  sound?: string;
  /** «Ты пожалел мишку…» — после находки в заданиях на эмоции. */
  helped?: string;
}

export interface SceneObject {
  id: string;
  /** Ключ спрайта: компонент-заглушка или путь к webp. */
  sprite: string;
  rect: Rect;
  /** Слой отрисовки: больше — ближе к зрителю. */
  z?: number;
  /** Зеркально отразить спрайт. */
  flip?: boolean;
  voice: ObjectVoice;
  sfx?: SfxName;
  tags: ObjectTags;
  /** Может ли объект быть целью задания (декорации — нет). */
  findable: boolean;
  /** Реакция на касание. */
  reaction?: 'wiggle' | 'hop' | 'spin' | 'shake';
}

export type SfxName =
  | 'pop'
  | 'chime'
  | 'rustle'
  | 'squeak'
  | 'hoot'
  | 'quack'
  | 'croak'
  | 'buzz'
  | 'tweet'
  | 'drip'
  | 'bubble'
  | 'whoosh'
  | 'sparkle'
  | 'grunt'
  | 'moo'
  | 'bark'
  | 'meow'
  | 'baa'
  | 'bleat'
  | 'peep'
  | 'horn'
  | 'bell'
  | 'coo'
  | 'honk'
  | 'cluck'
  | 'neigh'
  | 'crow';

/** Задание уровня — запрос по признакам объектов. */
export interface TaskQuery {
  ids?: string[];
  kind?: Kind | Kind[];
  color?: Color;
  size?: Size;
  action?: Action;
  place?: Place;
  emotion?: Emotion;
  says?: string;
}

export type TaskType = 'who' | 'sound' | 'action' | 'attribute' | 'place' | 'emotion';

export interface LevelDef {
  id: string;
  type: TaskType;
  /** Фраза-задание, ключ таблицы фраз. */
  task: string;
  query: TaskQuery;
  /** Сколько целей искать (по умолчанию все подходящие, максимум 7). */
  count?: number;
  /**
   * all — все цели видны силуэтами сразу, искать в любом порядке;
   * sequence — по одной: голос называет следующую цель (для младших и для заданий на слух).
   */
  mode?: 'all' | 'sequence';
  /** В пошаговом режиме: какой голос объекта звучит как задание. */
  prompt?: 'ask' | 'sound';
  /** Скрыть силуэты в панели (задания на слух — иначе ответ виден). */
  hideSilhouettes?: boolean;
  /** Герой на кружке уровня в меню (по умолчанию — первая цель). */
  icon?: string;
  /** Фраза после победы для разговора с родителем (необязательно). */
  outro?: string;
  /** Связка с историей сцены перед заданием («Гости уже идут. Слышишь?»), пока уровень не пройден. */
  lead?: string;
}

/** История сцены: ради чего ребёнок ищет. Фразы — ключи таблицы фраз. */
export interface SceneStory {
  /** Завязка: звучит при первом входе в сцену и по касанию её вкладки. */
  intro: string;
  /** Финал на празднике, когда все уровни сцены пройдены. */
  finale: string;
}

export interface SceneDef {
  id: string;
  title: string;
  /** Герой на вкладке сцены в меню — по нему сцену узнаёт ребёнок, который не читает. */
  icon?: string;
  /** Ключ фона: компонент-заглушка или путь к webp. */
  background: string;
  /**
   * Герои нарисованы прямо на фоне (одна картинка из генератора).
   * Тогда спрайты не рисуются поверх, а для полёта/слотов/наклеек вырезается фрагмент фона по rect.
   * Работает, только если для background есть настоящая картинка; иначе — векторные заглушки.
   */
  baked?: boolean;
  objects: SceneObject[];
  levels: LevelDef[];
  story?: SceneStory;
  /** Вопросы для совместной игры в родительском меню. */
  parentQuestions: string[];
}
