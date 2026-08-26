/**
 * Fonts for the social-card rasteriser.
 *
 * The faces come from the cache Astro's `fonts` config already fills, so the
 * cards are set in the same Inter and DM Mono the site serves and no second copy
 * of either family enters the tree. resvg reads sfnt only, so each woff2 is
 * decompressed on the way through and written beside the cache: resvg's declared
 * interface takes file paths, and an undeclared buffer option is not worth
 * depending on for artwork that only a crawler ever sees.
 *
 * Every failure here throws. A missing face does not degrade a card, it empties
 * it: resvg drops text it cannot set and emits the artwork with no headline at
 * all, which looks deliberate and would ship unnoticed.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decompress } from 'wawoff2';

/** Written by the fonts integration at dev and build start. */
const CACHE_DIR = '.astro/fonts';
/** Beside it, and gitignored with it. */
const SFNT_DIR = '.astro/og-fonts';

export interface CardFonts {
  /** Paths to every cached face as sfnt, handed to resvg. */
  fontFiles: string[];
  /** The face the headline is set in, for measuring before it is drawn. */
  headline: Buffer;
}

let cached: Promise<CardFonts> | null = null;

async function load(): Promise<CardFonts> {
  let names: string[];
  try {
    names = (await readdir(CACHE_DIR)).filter((name) => name.endsWith('.woff2'));
  } catch (error) {
    throw new Error(
      `og cards: no font cache at ${CACHE_DIR}. It is written by the \`fonts\` ` +
        `config in astro.config.mjs; a build that skipped it cannot set a card. ` +
        `(${(error as Error).message})`,
    );
  }

  if (names.length === 0) throw new Error(`og cards: font cache ${CACHE_DIR} is empty`);

  await mkdir(SFNT_DIR, { recursive: true });

  const faces = await Promise.all(
    names.map(async (name) => {
      const sfnt = Buffer.from(await decompress(await readFile(join(CACHE_DIR, name))));
      const path = join(SFNT_DIR, `${name.replace(/\.woff2$/, '')}.ttf`);
      await writeFile(path, sfnt);
      return { name, path, sfnt };
    }),
  );

  // The cache names each file after its family, weight and style, which is the
  // only handle on which face is which. Semibold is what the artwork sets the
  // headline in.
  const headline = faces.find((face) => face.name.includes('inter-600'));
  if (!headline) {
    throw new Error(
      `og cards: Inter 600 missing from ${CACHE_DIR}. The headline is measured ` +
        `against it, so a card cannot be laid out. Found: ${names.join(', ')}`,
    );
  }

  return { fontFiles: faces.map((face) => face.path), headline: headline.sfnt };
}

/** Decompressing every face per post would dominate the build; do it once. */
export function getCardFonts(): Promise<CardFonts> {
  cached ??= load();
  return cached;
}
