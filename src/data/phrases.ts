// Единая таблица голосовых фраз.
// text — что произносится; stressed — то же с ударениями для Yandex SpeechKit ("+" перед ударной гласной).
// Из этой таблицы скрипт scripts/export-phrases.mjs делает voice/phrases.csv для генерации озвучки.
// Правило: формулировки нейтральны по роду («Ура! Нашлось!», а не «Ты нашёл!»).

export interface Phrase {
  text: string;
  stressed?: string;
  /** Подсказка интонации для нейросети. */
  mood?: 'warm' | 'excited' | 'whisper' | 'gentle' | 'curious';
}

export const PHRASES = {
  // --- общие ---
  welcome: { text: 'Привет! Я светлячок. Давай искать вместе!', stressed: 'Прив+ет! Я светлячок. Дав+ай иск+ать вм+есте!', mood: 'warm' },
  tutorial_tap: { text: 'Нажми на картинку!', stressed: 'Нажм+и на карт+инку!', mood: 'gentle' },
  hint_look: { text: 'Посмотри внимательно…', stressed: 'Посмотр+и вним+ательно…', mood: 'curious' },
  hint_firefly: { text: 'Светлячок подскажет!', stressed: 'Светляч+ок подск+ажет!', mood: 'warm' },
  praise_1: { text: 'Ура! Нашлось!', stressed: 'Ур+а! Нашл+ось!', mood: 'excited' },
  praise_2: { text: 'Верно!', stressed: 'В+ерно!', mood: 'excited' },
  praise_3: { text: 'Здорово!', stressed: 'Зд+орово!', mood: 'excited' },
  praise_4: { text: 'Точно!', stressed: 'Т+очно!', mood: 'excited' },
  praise_5: { text: 'Умница!', stressed: '+Умница!', mood: 'excited' },
  win: { text: 'Ура! Всё найдено! Ты молодчина!', stressed: 'Ур+а! Всё на+йдено! Ты молодч+ина!', mood: 'excited' },
  sticker: { text: 'Это тебе наклейка!', stressed: '+Это теб+е накл+ейка!', mood: 'warm' },
  next: { text: 'Играем дальше?', stressed: 'Игр+аем д+альше?', mood: 'curious' },
  bye_sleep: { text: 'Все зверята уснули. Спокойной ночи!', stressed: 'Все звер+ята усн+ули. Спок+ойной н+очи!', mood: 'whisper' },

  // --- задания уровней ---
  task_sound_intro: { text: 'Слушай внимательно! Кто так говорит?', stressed: 'Сл+ушай вним+ательно! Кто так говор+ит?', mood: 'curious' },
  task_sleep: { text: 'Тише-тише… Найди всех, кто спит.', stressed: 'Т+ише-т+ише… Найд+и всех, кто спит.', mood: 'whisper' },
  task_red: { text: 'Найди всё красное!', stressed: 'Найд+и всё кр+асное!', mood: 'curious' },
  task_on_tree: { text: 'Кто сидит на дереве? Найди!', stressed: 'Кто сид+ит на д+ереве? Найд+и!', mood: 'curious' },
  task_pond: { text: 'Кто живёт в пруду? Найди всех!', stressed: 'Кто живёт в пруд+у? Найд+и всех!', mood: 'curious' },
  task_yellow: { text: 'Найди всё жёлтое, как солнышко!', stressed: 'Найд+и всё жёлтое, как с+олнышко!', mood: 'curious' },
  task_bugs: { text: 'Найди жучков и букашек!', stressed: 'Найд+и жучк+ов и бук+ашек!', mood: 'curious' },
  task_sad: { text: 'Кому-то грустно. Найди и пожалей!', stressed: 'Ком+у-то гр+устно. Найд+и и пожал+ей!', mood: 'gentle' },

  // --- белочка ---
  squirrel_ask: { text: 'Найди белочку!', stressed: 'Найд+и б+елочку!' },
  squirrel_name: { text: 'Это белочка.', stressed: '+Это б+елочка.' },
  squirrel_fact: { text: 'Белочка грызёт орешек.', stressed: 'Б+елочка грыз+ёт ор+ешек.' },
  squirrel_echo: { text: 'Скажи: бе-лоч-ка!', stressed: 'Скаж+и: б+е-лоч-ка!' },
  squirrel_sound: { text: 'Кто говорит: цок-цок-цок?', stressed: 'Кто говор+ит: ц+ок-ц+ок-ц+ок?' },
  // --- сова ---
  owl_ask: { text: 'Найди сову!', stressed: 'Найд+и сов+у!' },
  owl_name: { text: 'Это сова.', stressed: '+Это сов+а.' },
  owl_fact: { text: 'Сова спит днём, а ночью летает.', stressed: 'Сов+а спит днём, а н+очью лет+ает.' },
  owl_echo: { text: 'Скажи: со-ва!', stressed: 'Скаж+и: со-в+а!' },
  owl_sound: { text: 'Кто говорит: у-ух, у-ух?', stressed: 'Кто говор+ит: +у-ух, +у-ух?' },
  // --- синичка ---
  tit_ask: { text: 'Найди синичку!', stressed: 'Найд+и син+ичку!' },
  tit_name: { text: 'Это синичка.', stressed: '+Это син+ичка.' },
  tit_fact: { text: 'Синичка сидит на ветке и поёт.', stressed: 'Син+ичка сид+ит на в+етке и по+ёт.' },
  tit_echo: { text: 'Скажи: си-нич-ка!', stressed: 'Скаж+и: си-н+ич-ка!' },
  tit_sound: { text: 'Кто поёт: тинь-тинь?', stressed: 'Кто по+ёт: т+инь-т+инь?' },
  // --- ёжик ---
  hedgehog_ask: { text: 'Найди ёжика!', stressed: 'Найд+и ёжика!' },
  hedgehog_name: { text: 'Это ёжик.', stressed: '+Это ёжик.' },
  hedgehog_fact: { text: 'Ёжик свернулся клубочком и спит.', stressed: 'Ёжик сверн+улся клуб+очком и спит.' },
  hedgehog_echo: { text: 'Скажи: ё-жик!', stressed: 'Скаж+и: ё-жик!' },
  hedgehog_sound: { text: 'Кто пыхтит: фыр-фыр?', stressed: 'Кто пыхт+ит: ф+ыр-ф+ыр?' },
  // --- зайка ---
  bunny_ask: { text: 'Найди зайку!', stressed: 'Найд+и з+айку!' },
  bunny_name: { text: 'Это зайка.', stressed: '+Это з+айка.' },
  bunny_fact: { text: 'Зайка прыгает в траве: прыг-скок!', stressed: 'З+айка пр+ыгает в трав+е: пр+ыг-ск+ок!' },
  bunny_echo: { text: 'Скажи: зай-ка!', stressed: 'Скаж+и: з+ай-ка!' },
  // --- лиса ---
  fox_ask: { text: 'Найди лису!', stressed: 'Найд+и лис+у!' },
  fox_name: { text: 'Это лиса.', stressed: '+Это лис+а.' },
  fox_fact: { text: 'Лиса спит под кустом. Тихо-тихо!', stressed: 'Лис+а спит под куст+ом. Т+ихо-т+ихо!' },
  fox_echo: { text: 'Скажи: ли-са!', stressed: 'Скаж+и: ли-с+а!' },
  // --- медвежонок ---
  bear_ask: { text: 'Найди медвежонка!', stressed: 'Найд+и медвеж+онка!' },
  bear_name: { text: 'Это медвежонок.', stressed: '+Это медвеж+онок.' },
  bear_fact: { text: 'Медвежонку грустно: он уронил бочонок мёда.', stressed: 'Медвеж+онку гр+устно: он урон+ил боч+онок мёда.' },
  bear_helped: { text: 'Ты пожалел мишку — и он улыбнулся!', stressed: 'Ты пожал+ел м+ишку — и он улыбн+улся!' },
  bear_echo: { text: 'Скажи: мед-ве-жо-нок!', stressed: 'Скаж+и: мед-ве-ж+о-нок!' },
  // --- уточка ---
  duck_ask: { text: 'Найди уточку!', stressed: 'Найд+и +уточку!' },
  duck_name: { text: 'Это уточка.', stressed: '+Это +уточка.' },
  duck_fact: { text: 'Уточка плавает в пруду.', stressed: '+Уточка пл+авает в пруд+у.' },
  duck_echo: { text: 'Скажи: у-точ-ка!', stressed: 'Скаж+и: +у-точ-ка!' },
  duck_sound: { text: 'Кто говорит: кря-кря?', stressed: 'Кто говор+ит: кр+я-кр+я?' },
  // --- лягушка ---
  frog_ask: { text: 'Найди лягушку!', stressed: 'Найд+и ляг+ушку!' },
  frog_name: { text: 'Это лягушка.', stressed: '+Это ляг+ушка.' },
  frog_fact: { text: 'Лягушка сидит на листике кувшинки.', stressed: 'Ляг+ушка сид+ит на л+истике кувш+инки.' },
  frog_echo: { text: 'Скажи: ля-гуш-ка!', stressed: 'Скаж+и: ля-г+уш-ка!' },
  frog_sound: { text: 'Кто говорит: ква-ква?', stressed: 'Кто говор+ит: кв+а-кв+а?' },
  // --- рыбка ---
  fish_name: { text: 'Это рыбка.', stressed: '+Это р+ыбка.' },
  fish_fact: { text: 'Рыбка выпрыгнула из воды: плюх!', stressed: 'Р+ыбка в+ыпрыгнула из вод+ы: пл+юх!' },
  fish_echo: { text: 'Скажи: рыб-ка!', stressed: 'Скаж+и: р+ыб-ка!' },
  // --- улитка ---
  snail_name: { text: 'Это улитка.', stressed: '+Это ул+итка.' },
  snail_fact: { text: 'Улитка ползёт медленно-медленно.', stressed: 'Ул+итка полз+ёт м+едленно-м+едленно.' },
  snail_echo: { text: 'Скажи: у-лит-ка!', stressed: 'Скаж+и: у-л+ит-ка!' },
  // --- бабочка ---
  butterfly_name: { text: 'Это бабочка.', stressed: '+Это б+абочка.' },
  butterfly_fact: { text: 'Бабочка летает над цветами.', stressed: 'Б+абочка лет+ает над цвет+ами.' },
  butterfly_echo: { text: 'Скажи: ба-боч-ка!', stressed: 'Скаж+и: б+а-боч-ка!' },
  // --- пчёлка ---
  bee_ask: { text: 'Найди пчёлку!', stressed: 'Найд+и пчёлку!' },
  bee_name: { text: 'Это пчёлка.', stressed: '+Это пчёлка.' },
  bee_fact: { text: 'Пчёлка собирает сладкий мёд.', stressed: 'Пчёлка собир+ает сл+адкий мёд.' },
  bee_echo: { text: 'Скажи: пчёл-ка!', stressed: 'Скаж+и: пчёл-ка!' },
  bee_sound: { text: 'Кто жужжит: ж-ж-ж?', stressed: 'Кто жужж+ит: ж-ж-ж?' },
  // --- мухомор ---
  amanita_name: { text: 'Это мухомор.', stressed: '+Это мухом+ор.' },
  amanita_fact: { text: 'Мухомор красный, в белый горошек. Его нельзя есть!', stressed: 'Мухом+ор кр+асный, в б+елый гор+ошек. Ег+о нельз+я есть!' },
  amanita_echo: { text: 'Скажи: му-хо-мор!', stressed: 'Скаж+и: му-хо-м+ор!' },
  // --- боровик ---
  boletus_name: { text: 'Это гриб боровик.', stressed: '+Это гриб боров+ик.' },
  boletus_fact: { text: 'Боровик прячется под ёлкой.', stressed: 'Боров+ик пр+ячется под ёлкой.' },
  boletus_echo: { text: 'Скажи: гриб!', stressed: 'Скаж+и: гриб!' },
  // --- божья коровка ---
  ladybug_name: { text: 'Это божья коровка.', stressed: '+Это б+ожья кор+овка.' },
  ladybug_fact: { text: 'У божьей коровки красная спинка в чёрных точках.', stressed: 'У б+ожьей кор+овки кр+асная сп+инка в чёрных т+очках.' },
  ladybug_echo: { text: 'Скажи: ко-ров-ка!', stressed: 'Скаж+и: ко-р+ов-ка!' },
  // --- земляника ---
  strawberry_name: { text: 'Это земляника.', stressed: '+Это землян+ика.' },
  strawberry_fact: { text: 'Земляника красная и сладкая.', stressed: 'Землян+ика кр+асная и сл+адкая.' },
  strawberry_echo: { text: 'Скажи: я-го-да!', stressed: 'Скаж+и: я-го-д+а!' },
  // --- рябина ---
  rowan_name: { text: 'Это рябина.', stressed: '+Это ряб+ина.' },
  rowan_fact: { text: 'На рябине висят красные ягоды.', stressed: 'На ряб+ине вис+ят кр+асные +ягоды.' },
  rowan_echo: { text: 'Скажи: ря-би-на!', stressed: 'Скаж+и: ря-б+и-на!' },
  // --- мышка ---
  mouse_ask: { text: 'Найди мышку!', stressed: 'Найд+и м+ышку!' },
  mouse_name: { text: 'Это мышка.', stressed: '+Это м+ышка.' },
  mouse_fact: { text: 'Мышке грустно: она потеряла свой сыр.', stressed: 'М+ышке гр+устно: он+а потер+яла свой сыр.' },
  mouse_helped: { text: 'Ты пожалел мышку — и она снова весёлая!', stressed: 'Ты пожал+ел м+ышку — и он+а сн+ова весёлая!' },
  mouse_echo: { text: 'Скажи: мыш-ка!', stressed: 'Скаж+и: м+ыш-ка!' },

  // --- декорации ---
  spruce_name: { text: 'Это ёлка.', stressed: '+Это ёлка.' },
  birch_name: { text: 'Это берёза.', stressed: '+Это берёза.' },
  oak_name: { text: 'Это дерево.', stressed: '+Это д+ерево.' },
  bush_name: { text: 'Это куст. Шур-шур!', stressed: '+Это куст. Ш+ур-ш+ур!' },
  stump_name: { text: 'Это пенёк.', stressed: '+Это пенёк.' },
  cloud_name: { text: 'Это облако. Кап-кап!', stressed: '+Это +облако. К+ап-к+ап!' },
  sun_name: { text: 'Это солнышко.', stressed: '+Это с+олнышко.' },
  pond_name: { text: 'Это пруд. Буль-буль!', stressed: '+Это пруд. Б+уль-б+уль!' },
  flower_name: { text: 'Это цветок.', stressed: '+Это цвет+ок.' },
} satisfies Record<string, Phrase>;

export type PhraseId = keyof typeof PHRASES;

export const PRAISE: PhraseId[] = ['praise_1', 'praise_2', 'praise_3', 'praise_4', 'praise_5'];

export function phraseText(id: string): string {
  return (PHRASES as Record<string, Phrase>)[id]?.text ?? '';
}
