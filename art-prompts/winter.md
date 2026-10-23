# Промпт сцены «Зима / Новый год» (черновик, 23.10)

Не подключена: нет картинки. Делается так же, как [вечер](evening.md) и [кухня](kitchen.md): Figma MCP `generate_image`, модель `gemini-3.1-flash-image`, 2048×1152, затем разметка целей по картинке и вырезка спрайтов. План сцены, уровней и фраз — [docs/winter-scene.md](../docs/winter-scene.md).

Правила, которые выучены на прошлых сценах: герои крупные и раздельные (цель не меньше 6,5% × 8% холста), каждый предмет один раз, парные предметы (варежки, валенки) — две цели, нижняя пятая часть пустая, левый верхний и правый нижний углы пустые (кнопка «домой» и светлячок).

```
Children's picture book illustration for toddlers 3–5 years old, wide 16:9 scene of a snowy winter yard on New Year's Eve, seen from the front like a stage, soft evening blue light with warm glowing windows. Style: soft gouache combined with cut colored-paper collage, gentle paper texture, warm muted palette (moss green, ochre, terracotta, dusty blue, cream, snow white), rounded friendly shapes, thin slightly darker outlines, cozy and calm, no text, no letters, no numbers, no signs.

Every character and object is drawn whole, clearly separated from the others with some space around it, medium size, easy for a small child to recognize and tap. Each appears exactly once.

Composition (strict):
- The bottom fifth of the picture is empty plain white snow with nothing on it at all.
- The top-left corner and the bottom-right corner are empty (only plain dark blue sky / plain snow there).

Characters and objects, left to right:
- Left-center: a big friendly snowman with a carrot nose, a red scarf, a bucket hat and two stick arms.
- Next to the snowman: a pair of red mittens lying on the snow, and a red wooden sled with a rope.
- Center: a big decorated fir tree with a yellow star on top, a red ball and a blue ball hanging on it, and a string of lights. A small present box with a bow stands under the tree.
- Center-right: a small cozy house with a warm yellow lit window and a smoking chimney; a long icicle hangs from its roof edge.
- Right: a kind Father Frost (Ded Moroz) in a long blue coat with a white beard, holding a bag of presents.
- Up in the sky: one big snowflake and a yellow crescent moon.
- On a branch of the fir tree: a red-breasted bullfinch. At the foot of the tree: a small grey bunny sitting in the snow, and a pair of small blue felt boots (valenki).
```

Что проверить после генерации: мишень «варежки» и «валенки» — две отдельные цели каждая; ёлочные шарики не меньше минимальной зоны; Дед Мороз не заходит в правый нижний угол.
