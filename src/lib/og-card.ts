/**
 * Per-post social card, built by substituting a title into the hand-authored
 * template at `public/og-default-light.svg`.
 *
 * The template is the single design source: colours, the eyebrow row, the rule
 * and the signature all stay where they were drawn. Only the two headline lines
 * are replaced, so a change to the artwork reaches the generated cards without
 * anything here being touched.
 */

/** Template geometry, read off the artwork rather than guessed. */
const TEXT_X = 88;
/** Right edge of the eyebrow row, which the headline may not cross. */
const TEXT_RIGHT = 1112;
/** Baseline of the template's second headline line. No block may reach past it:
 *  below lies the rule and the signature. */
const BASELINE_FLOOR = 445;
/** Optical centre of the template's two-line block, midway between its
 *  baselines. A block short enough to sit on this centre does, which keeps a
 *  one-line title off the floor; anything taller rests on the floor and grows
 *  upward instead. Two lines satisfy both and land exactly where they were
 *  drawn. */
const BLOCK_CENTRE = (360 + 445) / 2;
/** Ratio between the template's two baselines (445 - 360) and its font size. */
const LEADING_RATIO = 85 / 76;
const TRACKING_RATIO = -1.5 / 76;

/** Steps down from the template's own size, tried largest first. */
const FONT_SIZES = [76, 66, 58, 52] as const;
const MAX_LINES = 4;

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/** Advance width of `text` at `fontSize`, in px. Supplied by the caller so the
 *  wrapping logic stays free of any font library. */
export type Measure = (text: string, fontSize: number) => number;

export interface Headline {
  lines: string[];
  fontSize: number;
}

/**
 * Greedy word wrap at a fixed size. Returns null when the text cannot fit the
 * line budget, which is how `fitHeadline` decides to try a smaller size.
 */
function wrapAt(
  words: string[],
  fontSize: number,
  measure: Measure,
  maxWidth: number,
  maxLines: number,
): string[] | null {
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }
    // A single word wider than the column cannot be helped by breaking earlier;
    // a smaller size is the only remedy, so report failure rather than overflow.
    if (!current) return null;
    lines.push(current);
    if (lines.length >= maxLines) return null;
    current = word;
  }

  if (current) lines.push(current);
  return lines.length > 0 && lines.length <= maxLines ? lines : null;
}

/**
 * Largest size at which the title fits the column. The smallest step is used
 * as a floor: a title long enough to defeat even that is truncated rather than
 * allowed to run past the artwork.
 */
export function fitHeadline(title: string, measure: Measure): Headline {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const maxWidth = TEXT_RIGHT - TEXT_X;

  for (const fontSize of FONT_SIZES) {
    const lines = wrapAt(words, fontSize, measure, maxWidth, MAX_LINES);
    if (lines) return { lines, fontSize };
  }

  const fontSize = FONT_SIZES[FONT_SIZES.length - 1];
  const clipped = wrapAt(words, fontSize, measure, maxWidth, Number.MAX_SAFE_INTEGER) ?? [title];
  const lines = clipped.slice(0, MAX_LINES);
  const last = lines.length - 1;
  lines[last] = `${lines[last].replace(/[\s,.;:]+$/, '')}…`;
  return { lines, fontSize };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Swaps the template's headline for `headline`. The two lines it replaces are
 * found by their font size, which is what distinguishes them from the eyebrow
 * row and carries no dependency on their wording.
 */
export function renderCardSvg(template: string, headline: Headline): string {
  const headlineTag = /<text\b[^>]*\bfont-size="76"[^>]*>[\s\S]*?<\/text>\s*/g;
  const found = template.match(headlineTag);
  // Loud on purpose: a silently un-substituted template ships a card carrying
  // the site's tagline under every post's URL.
  if (found?.length !== 2) {
    throw new Error(
      `og card template: expected 2 headline lines at font-size 76, found ${found?.length ?? 0}`,
    );
  }

  // Ink and typeface are read off the line being replaced rather than restated
  // here, so the light and dark artwork can be swapped by pointing at the other
  // file and nothing in this module has to know which one it got.
  const fill = found[0].match(/\bfill="([^"]+)"/)?.[1];
  const family = found[0].match(/\bfont-family="([^"]+)"/)?.[1];
  if (!fill || !family) {
    throw new Error('og card template: headline line carries no fill or font-family');
  }

  const { lines, fontSize } = headline;
  const leading = Math.round(fontSize * LEADING_RATIO);
  const tracking = (fontSize * TRACKING_RATIO).toFixed(2);

  // Centred while that stays clear of the floor, resting on it afterwards.
  const lastBaseline = Math.round(
    Math.min(BASELINE_FLOOR, BLOCK_CENTRE + ((lines.length - 1) * leading) / 2),
  );

  const markup = lines
    .map((line, index) => {
      const y = lastBaseline - (lines.length - 1 - index) * leading;
      return (
        `<text x="${TEXT_X}" y="${y}" fill="${fill}" font-family="${family}" ` +
        `font-size="${fontSize}" font-weight="600" letter-spacing="${tracking}">` +
        `${escapeXml(line)}</text>`
      );
    })
    .join('');

  let replaced = 0;
  return template.replace(headlineTag, () => (replaced++ === 0 ? markup : ''));
}
