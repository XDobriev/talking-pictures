# Промпт сцены «Кухня»

Figma MCP `generate_image`, модель `gemini-3.1-flash-image`, 2048×1152 (вышло 1376×768), узел 11:2. С первой попытки: 19 целей, все узнаваемы. Шаблон — как у [фермы](farm.md).

```
Children's picture book illustration for toddlers 3–5 years old, wide 16:9 scene of a cozy home kitchen on a sunny day, seen from the front like a stage. Style: soft gouache combined with cut colored-paper collage, gentle paper texture, warm muted palette (moss green, ochre, terracotta, dusty blue, cream), rounded friendly shapes, thin slightly darker outlines, cozy and calm, no text, no letters, no numbers, no signs.

Every character and object is drawn whole, clearly separated from the others with some space around it, medium size, easy for a small child to recognize and tap. Each appears exactly once. The people are cute and simple with friendly faces.

Composition (strict):
- The bottom fifth of the picture is an empty plain wooden floor with nothing on it at all.
- The top-left corner and the bottom-right corner are empty (only plain wall / plain floor there).
- Warm cream wall in the back.

Characters and objects, left to right:
- Left side, below the top-left corner: a tall white refrigerator. On the floor in front of the refrigerator (above the empty bottom strip) a small grey mouse nibbles a little piece of cheese.
- Left-center: a kitchen stove. On the stove: a red kettle with a little puff of steam, a blue pot with soup bubbling, and a black frying pan with golden pancakes. A kind grandmother in an apron and glasses stands next to the stove, stirring the soup in the pot with a long wooden ladle.
- Center back: a window with sunlight. On the windowsill a green parrot sits in a round little cage, singing. Under the window a sink with a shiny tap; one water drop falls from the tap.
- On the wall between the window and the stove: a round wall clock.
- Center and right: a wooden kitchen table. On the table, well spaced apart: a loaf of bread, a white jug of milk, a wedge of yellow cheese, a round golden pie, a yellow banana, a red apple, a red cup with white dots, and a white plate with a wooden spoon lying next to it.
- At the table on the left: a little girl in a yellow dress sits on a chair, happily eating porridge from a bowl.
- To the right of the table: a little boy in a blue shirt stands looking sad, holding a broken cookie in two pieces, with a tiny tear.
- On the floor near the table (above the empty bottom strip): a small ginger kitten sits looking sad next to an empty food bowl.
```

Что вышло не по промпту: мышка, котёнок и ножки стола заходят в нижнюю полосу — мышка и котёнок стоят вне панели заданий (x < 27 и x > 73), тесты разметки проходят. На плите вторая стопка блинов на тарелке — декорация без зоны касания. У мальчика размечен только верх (ноги — под светлячком).
