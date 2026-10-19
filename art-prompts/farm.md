# Промпт сцены «Ферма»

Figma MCP `generate_image`, модель `gemini-3.1-flash-image`, 2048×1152 (вышло 1376×768), файл «Говорящие картинки — арт», узел 7:2. Получилось с первой попытки: 18 героев, все узнаваемы, углы и низ свободны.

Шаблон для следующих сцен: стиль-блок → «каждый герой целиком, отдельно, по одному» → строгая композиция → герои слева направо, у каждого действие и место (чтобы совпадали с `action` / `place` / `emotion` в данных).

```
Children's picture book illustration for toddlers 3–5 years old, wide 16:9 landscape scene of a cozy village farm on a sunny summer day. Style: soft gouache combined with cut colored-paper collage, gentle paper texture, warm muted palette (moss green, ochre, terracotta, dusty blue sky, cream), rounded friendly shapes, thin slightly darker outlines, cozy and calm, no text, no letters, no signs.

Every character is drawn whole, clearly separated from the others with some space around it, medium size, easy for a small child to recognize and tap. Each appears exactly once.

Composition (strict):
- The bottom fifth of the picture is an empty soft green meadow with nothing on it at all.
- The top-left corner and the bottom-right corner are empty (only sky / plain grass there).
- Sky in the upper part with a round friendly sun in the upper middle and two small fluffy clouds near it.

Characters and objects, left to right:
- Left side, a little below the top-left corner: a red wooden barn with a white-framed door. Next to the barn a big golden haystack. A brown horse stands beside the haystack, eating hay.
- In front of the barn, lower left: a small vegetable garden bed with orange carrots with green tops, one big orange pumpkin, one round green cabbage, and a little bush with red tomatoes. A tall yellow sunflower grows at the edge of the garden.
- Center back: a low wooden fence across the middle of the meadow. On the left part of the fence a proud orange rooster stands with his beak open, crowing. On the right part of the fence a ginger cat lies curled up, sleeping with closed eyes.
- Center: a black-and-white cow stands on the meadow, looking at the viewer kindly. In front of her a pink pig lies happily in a small brown mud puddle.
- Center left, near the fence: a brown hen pecks at grain on the ground. A little way apart, a small fluffy yellow chick stands alone looking sad, with a tiny tear.
- Right of center: a small wooden doghouse with a brown puppy sitting in front of it, looking sad with droopy ears.
- Right side, upper: an apple tree with several big red apples. Under the tree a white goat with small horns eats grass, and a fluffy white sheep stands next to it.
- Right side, middle: a small blue pond with a white goose swimming in it.
- A small red toy-like tractor parked between the cow and the doghouse.
```

Что вышло не по промпту: тыкв две (большая и маленькая) — маленькая размечена декорацией `pumpkin_small`, чтобы касание по ней не называло морковку.
