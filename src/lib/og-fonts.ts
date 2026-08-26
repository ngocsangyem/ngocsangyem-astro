/**
 * Fonts for the social-card rasteriser.
 *
 * The faces come from `astro:assets`, the same place the `fonts` config in
 * astro.config.mjs serves the site's own CSS from, so the cards are set in the
 * same Inter and DM Mono the pages are and no second copy of either family
 * enters the tree. `fontData` names every face the config resolved and
 * `experimental_getFontFileURL` turns one into something fetchable: during a
 * static build Astro answers from a loopback server it runs for exactly this,
 * so the download never leaves the machine.
 *
 * An earlier version read `.astro/fonts` off disk instead. That directory is
 * written by `astro dev`, not by `astro build`, so the cards only ever rendered
 * on a machine that had run the dev server first; a clean checkout -- CI, or any
 * deploy -- failed the build outright.
 *
 * resvg reads sfnt only, so each woff2 is decompressed on the way through and
 * written under `.astro/og-fonts`: resvg's declared interface takes file paths,
 * and an undeclared buffer option is not worth depending on for artwork that
 * only a crawler ever sees.
 *
 * Every failure here throws. A missing face does not degrade a card, it empties
 * it: resvg drops text it cannot set and emits the artwork with no headline at
 * all, which looks deliberate and would ship unnoticed.
 */
import { fontData, experimental_getFontFileURL, type CssVariable } from 'astro:assets';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decompress } from 'wawoff2';

/** Decompressed faces land here, gitignored with the rest of `.astro`. */
const SFNT_DIR = '.astro/og-fonts';

/**
 * Only the families the artwork can actually address. The chrome's third family
 * never appears on a card, and handing resvg a face no `font-family` names just
 * costs a decompress per build.
 */
const FAMILIES = ['--font-inter', '--font-dm-mono'] as const satisfies readonly CssVariable[];

/** What the template sets the headline in, and so what it is measured against. */
const HEADLINE_FAMILY: CssVariable = '--font-inter';
const HEADLINE_WEIGHT = '600';

type Face = (typeof fontData)[CssVariable][number];

export interface CardFonts {
  /** Paths to every face as sfnt, handed to resvg. */
  fontFiles: string[];
  /** The face the headline is set in, for measuring before it is drawn. */
  headline: Buffer;
}

let cached: Promise<CardFonts> | null = null;

/** Stable, collision-free, and readable in a stack trace. */
function fileNameFor(cssVariable: CssVariable, face: Face): string {
  const parts = [cssVariable.replace(/^--font-/, ''), face.weight, face.style, face.subset];
  return `${parts.filter(Boolean).join('-')}.ttf`;
}

/** Downloads one face and writes it out as sfnt, returning where it landed. */
async function writeFace(cssVariable: CssVariable, face: Face): Promise<{ path: string; sfnt: Buffer }> {
  // woff2 is what the providers serve and what wawoff2 decompresses; anything
  // else is already sfnt and passes straight through.
  const source = face.src.find((candidate) => candidate.format === 'woff2') ?? face.src[0];
  if (!source) {
    throw new Error(`og cards: face ${cssVariable} ${face.weight ?? ''} lists no source file`);
  }

  const response = await fetch(experimental_getFontFileURL(source.url));
  if (!response.ok) {
    throw new Error(
      `og cards: ${cssVariable} ${face.weight ?? ''} failed to download ` +
        `(${response.status} ${response.statusText}) from ${source.url}`,
    );
  }

  const raw = Buffer.from(await response.arrayBuffer());
  const sfnt = source.format === 'woff2' ? Buffer.from(await decompress(raw)) : raw;
  const path = join(SFNT_DIR, fileNameFor(cssVariable, face));
  await writeFile(path, sfnt);
  return { path, sfnt };
}

async function load(): Promise<CardFonts> {
  await mkdir(SFNT_DIR, { recursive: true });

  const written = await Promise.all(
    FAMILIES.flatMap((cssVariable) => {
      const faces = fontData[cssVariable];
      if (!faces?.length) {
        throw new Error(
          `og cards: no faces for ${cssVariable}. It is declared by the \`fonts\` ` +
            `config in astro.config.mjs, so a card cannot be set without it.`,
        );
      }
      return faces.map(async (face) => ({
        cssVariable,
        weight: face.weight,
        style: face.style,
        ...(await writeFace(cssVariable, face)),
      }));
    }),
  );

  const headline = written.find(
    (face) =>
      face.cssVariable === HEADLINE_FAMILY &&
      face.weight === HEADLINE_WEIGHT &&
      (face.style ?? 'normal') === 'normal',
  );
  if (!headline) {
    throw new Error(
      `og cards: ${HEADLINE_FAMILY} ${HEADLINE_WEIGHT} missing. The headline is ` +
        `measured against it, so a card cannot be laid out. Found: ` +
        written.map((face) => `${face.cssVariable} ${face.weight}`).join(', '),
    );
  }

  return { fontFiles: written.map((face) => face.path), headline: headline.sfnt };
}

/** Downloading and decompressing every face per post would dominate the build. */
export function getCardFonts(): Promise<CardFonts> {
  cached ??= load();
  return cached;
}
