/**
 * Draws the hand-drawn gallery covers and writes them where posts pick them up:
 * `src/assets/covers/<post-id>.webp`.
 *
 * Authoring tool, not a build step: the covers are committed, and the build
 * only ever optimises them through astro:assets. Rerun after changing a scene:
 *
 *   node scripts/gallery-covers/draw-gallery-covers.mjs [post-id ...]
 *
 * Labels are set in JetBrains Mono through resvg, which reads sfnt only. The
 * decompressed faces under `.astro/og-fonts` come from `npm run build`, so run
 * a build first on a fresh checkout.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { createCanvas, WIDTH } from './rough-canvas.mjs';
import { SCENES } from './cover-scenes.mjs';

const OUT_DIR = 'src/assets/covers';
const FONT = '.astro/og-fonts/jetbrains-mono-500-normal-latin.ttf';

try {
  await access(FONT);
} catch {
  console.error(`missing ${FONT}: run \`npm run build\` once so the font is decompressed`);
  process.exit(1);
}

const wanted = process.argv.slice(2);
const unknown = wanted.filter((id) => !SCENES[id]);
if (unknown.length) {
  console.error(`no scene for: ${unknown.join(', ')}`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const entries = Object.entries(SCENES).filter(([id]) => !wanted.length || wanted.includes(id));
for (const [index, [id, scene]] of entries.entries()) {
  // The seed is fixed per scene, so a rerun only changes covers whose scene did.
  const canvas = createCanvas(1000 + index * 100 + id.length);
  scene(canvas);

  const png = new Resvg(canvas.toSvg(), {
    fitTo: { mode: 'width', value: WIDTH },
    font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'JetBrains Mono' },
  })
    .render()
    .asPng();

  // Near-lossless source: astro:assets re-encodes every served width from this,
  // so artefacts here would be baked into all of them.
  const webp = await sharp(png).webp({ quality: 90, effort: 6 }).toBuffer();
  await writeFile(join(OUT_DIR, `${id}.webp`), webp);
  console.log(`${id}.webp  ${(webp.length / 1024).toFixed(1)} KB`);
}
