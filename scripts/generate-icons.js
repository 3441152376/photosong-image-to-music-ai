import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ICONS_DIR = path.join(__dirname, '../public/icons');

const sizes = [
  16, 32, 70, 144, 150, 180, 192, 310, 512
];

async function generateIcons() {
  const svgBuffer = await fs.readFile(path.join(ICONS_DIR, 'icon.svg'));
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().catch(console.error); 