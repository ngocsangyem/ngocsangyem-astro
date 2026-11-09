/**
 * A tiny drawing surface over rough.js's generator: every call appends SVG
 * markup, and `toSvg()` wraps it in a paper-toned sheet. The covers are
 * meant to sit beside the posts' own Excalidraw figures, which are rough.js
 * underneath, so the line quality matches without hand-tuning each stroke.
 * A sheet is 16:10 unless a scene asks for another shape, which is what gives
 * the gallery its mixed portrait, square and landscape tiles.
 *
 * Palette is the site's light theme: cream paper, ink strokes, the one orange
 * accent for hachure, and the label grey for secondary marks.
 */
import rough from 'roughjs';

export const WIDTH = 1600;
export const HEIGHT = 1000;

export const PALETTE = {
  paper: '#faf9f5',
  ink: '#141413',
  muted: '#65645e',
  accent: '#c15f3c',
};

const BASE = {
  roughness: 1.4,
  bowing: 1.2,
  stroke: PALETTE.ink,
  strokeWidth: 5,
  fillStyle: 'hachure',
  hachureGap: 16,
  hachureAngle: -41,
  fillWeight: 2.5,
};

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** `seed` keeps every rerun of the script byte-identical for the same scene. */
export function createCanvas(seed) {
  const generator = rough.generator();
  const parts = [];
  let next = seed;

  function draw(drawable) {
    for (const { d, stroke, strokeWidth, fill } of generator.toPaths(drawable)) {
      parts.push(
        `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill ?? 'none'}" ` +
          'stroke-linecap="round" stroke-linejoin="round"/>',
      );
    }
  }

  // Each shape takes the next seed, so adding a shape never reshuffles the
  // wobble of the ones drawn before it.
  const opts = (extra = {}) => ({ ...BASE, seed: next++, ...extra });

  return {
    rect(x, y, w, h, extra) {
      draw(generator.rectangle(x, y, w, h, opts(extra)));
    },
    ellipse(cx, cy, w, h, extra) {
      draw(generator.ellipse(cx, cy, w, h, opts(extra)));
    },
    line(x1, y1, x2, y2, extra) {
      draw(generator.line(x1, y1, x2, y2, opts(extra)));
    },
    path(d, extra) {
      draw(generator.path(d, opts(extra)));
    },
    /** A straight shaft with an open two-stroke head, Excalidraw style. */
    arrow(x1, y1, x2, y2, extra = {}) {
      draw(generator.line(x1, y1, x2, y2, opts(extra)));
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const size = extra.head ?? 30;
      for (const turn of [-0.45, 0.45]) {
        const a = angle + Math.PI + turn;
        draw(generator.line(x2, y2, x2 + size * Math.cos(a), y2 + size * Math.sin(a), opts(extra)));
      }
    },
    /** Mono label, the site's voice for code and names. */
    text(x, y, value, { size = 44, color = PALETTE.ink, anchor = 'start', weight = 500 } = {}) {
      parts.push(
        // A paper halo under each glyph keeps a label readable where it
        // crosses hachure or a line.
        `<text x="${x}" y="${y}" font-family="JetBrains Mono" font-weight="${weight}" ` +
          `font-size="${size}" fill="${color}" text-anchor="${anchor}" stroke="${PALETTE.paper}" ` +
          `stroke-width="${Math.round(size / 4)}" stroke-linejoin="round" paint-order="stroke">` +
          `${escapeXml(value)}</text>`,
      );
    },
    toSvg(width = WIDTH, height = HEIGHT) {
      return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
        `viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${PALETTE.paper}"/>` +
        `${parts.join('')}</svg>`
      );
    },
  };
}
