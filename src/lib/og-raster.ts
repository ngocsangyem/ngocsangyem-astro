import { readFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import { getCardFonts } from './og-fonts';
import { CARD_HEIGHT, CARD_WIDTH } from './og-card';

/** The artwork every card is cut from, and the site-wide fallback card. */
export const CARD_TEMPLATE = 'public/og-default.svg';

let template: Promise<string> | null = null;

export function loadCardTemplate(): Promise<string> {
  template ??= readFile(CARD_TEMPLATE, 'utf8');
  return template;
}

/** Rasterises a card SVG with the cached faces only, as a PNG response. */
export async function cardResponse(svg: string): Promise<Response> {
  const { fontFiles } = await getCardFonts();
  const png = new Resvg(svg, {
    // System fonts are whatever the build host happens to carry, which is not
    // the same on a laptop and on a deploy runner. Only the cached faces count.
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' },
    fitTo: { mode: 'width', value: CARD_WIDTH },
  })
    .render()
    .asPng();

  // Uint8Array rather than Buffer: only the former is a BodyInit.
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(png.length),
      'X-Card-Size': `${CARD_WIDTH}x${CARD_HEIGHT}`,
    },
  });
}
