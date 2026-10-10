/**
 * One social card per post, rasterised at build time.
 *
 * This is a route rather than a script so it reads the posts through the same
 * collection and the same helpers as the pages do: a card cannot describe a
 * post the site does not publish, and its title cannot drift from the heading.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { createRequire } from 'node:module';
import { getPublishedPosts, type Post } from '../../lib/posts';
import { getCardFonts } from '../../lib/og-fonts';
import { fitHeadline, renderCardSvg, type Measure } from '../../lib/og-card';
import { cardResponse, loadCardTemplate } from '../../lib/og-raster';

// opentype.js resolves to CommonJS here, which exposes nothing as a named
// export. Requiring it keeps the boundary explicit and the types intact.
const { parse } = createRequire(import.meta.url)(
  'opentype.js',
) as typeof import('opentype.js');

/** Letter-spacing the artwork sets on the headline, per px of font size. */
const TRACKING_PER_PX = -1.5 / 76;

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

let measure: Promise<Measure> | null = null;

function loadMeasure(): Promise<Measure> {
  measure ??= getCardFonts().then(({ headline }) => {
    const font = parse(
      headline.buffer.slice(headline.byteOffset, headline.byteOffset + headline.byteLength),
    );
    const scale = 1 / font.unitsPerEm;

    /**
     * Advances summed per glyph rather than through `getAdvanceWidth`, which
     * shapes the run first and throws on the substitution tables Inter ships
     * (`substFormat: 2` under lookupType 6 is unimplemented in opentype 2.0).
     * Shaping would only contribute kerning, worth about a percent on a line
     * this size, and the fitter keeps a whole column of slack for it.
     */
    return (text, fontSize) => {
      let units = 0;
      for (const character of text) {
        units += font.charToGlyph(character).advanceWidth ?? 0;
      }
      // The artwork tracks the headline; a negative track narrows every gap
      // between glyphs, of which there is one fewer than there are glyphs.
      const tracking = TRACKING_PER_PX * fontSize * Math.max([...text].length - 1, 0);
      return units * scale * fontSize + tracking;
    };
  });
  return measure;
}

export const GET: APIRoute<{ post: Post }> = async ({ props }) => {
  const [svgTemplate, measureText] = await Promise.all([loadCardTemplate(), loadMeasure()]);
  return cardResponse(renderCardSvg(svgTemplate, fitHeadline(props.post.data.title, measureText)));
};
