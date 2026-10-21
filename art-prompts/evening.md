# Промпт сцены «Вечер»

Figma MCP `generate_image`, модель `gemini-3.1-flash-image`, 2048×1152 (вышло 1376×768), узел 12:2. С первой попытки: мишка крупный, ушки, носик, лапки и пяточки читаются отдельно. Шаблон — как у [фермы](farm.md).

Главное в промпте — **мишка БОЛЬШОЙ**: цели — его части тела, и каждая должна быть не меньше минимальной зоны касания (6,5% × 8%). Парные части (ушки, лапки, пяточки) — две отдельные цели.

```
Children's picture book illustration for toddlers 3–5 years old, wide 16:9 scene of a cozy evening at home: on the left a bathroom, on the right a bedroom corner, seen from the front like a stage, warm soft lamp light. Style: soft gouache combined with cut colored-paper collage, gentle paper texture, warm muted palette (moss green, ochre, terracotta, dusty blue, cream), rounded friendly shapes, thin slightly darker outlines, cozy and calm, no text, no letters, no numbers, no signs.

Every character and object is drawn whole, clearly separated from the others with some space around it, medium size, easy for a small child to recognize and tap. Each appears exactly once.

Composition (strict):
- The bottom fifth of the picture is an empty plain wooden floor with nothing on it at all.
- The top-left corner and the bottom-right corner are empty (only plain wall / plain floor there).
- Light blue tiled wall on the left half, warm cream wallpaper on the right half.

Characters and objects, left to right:
- Left-center, the main hero, BIG: a white bathtub full of foam bubbles. A large friendly brown bear cub sits in the bath facing the viewer: his big round head with two round ears, two eyes, a dark nose and a happy smiling open mouth is clearly visible above the foam; both front paws are raised up high, waving. At the right end of the bathtub his two hind feet with round pink soles stick out of the foam over the rim.
- On the rim of the bathtub: a yellow rubber duck and a small red-and-white toy boat, well apart.
- Left side, above the bathtub: a shiny tap over the bath with one water drop falling.
- Left, a little below the top-left corner: a small window with a dark blue night sky, a yellow crescent moon and a small brown owl sitting on the outside windowsill.
- Center: a washbasin with a round mirror above it. On the washbasin: a glass with a toothbrush, a bar of yellow soap and a comb, well spaced apart. A fluffy green towel hangs on a hook next to the washbasin.
- Right side: a small cozy bed with a big white pillow and a patchwork blanket. Striped blue pyjamas lie neatly folded on the blanket. A grey cat sleeps curled up at the foot of the bed. A pair of red slippers stands on a small rug in front of the bed (above the empty floor strip). A small warm night lamp on a bedside table.
```

Что вышло не по промпту: кроватка доходит до правого нижнего угла (под светлячком) — она декорация, цели на ней (кошка, пижама) выше зоны кнопки. Тапочки стоят чуть ниже, но правее панели заданий.
