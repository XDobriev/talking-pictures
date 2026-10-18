// Конвертация картинки из пайплайна (Gemini/Figma) в webp для игры.
//   node scripts/image.mjs <вход.png> <выход.webp> [ширина] [качество]
import sharp from 'sharp';

const [input, output, width = '1920', quality = '82'] = process.argv.slice(2);
if (!input || !output) {
  console.error('node scripts/image.mjs <вход.png> <выход.webp> [ширина] [качество]');
  process.exit(1);
}
const info = await sharp(input)
  .resize({ width: Number(width), kernel: 'lanczos3', withoutEnlargement: false })
  .webp({ quality: Number(quality), effort: 6 })
  .toFile(output);
console.log(`✓ ${output}: ${info.width}×${info.height}, ${(info.size / 1024).toFixed(0)} КБ`);
