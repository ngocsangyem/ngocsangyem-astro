import { describe, expect, it } from 'vitest';
import {
  drawingUnit,
  generateGrove,
  HAZE_PAD,
  SETTLE_MS,
  type Grove,
  type Stalk,
} from './bamboo-lines';

const W = 1280;
const H = 800;

const grove = generateGrove({ seed: 0x6c7579, width: W, height: H });

function stalks(g: Grove): Stalk[] {
  return [...g.ink, ...g.haze];
}

function points(stalk: Stalk): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const group of stalk.groups) {
    for (const stroke of group.strokes) {
      for (let i = 0; i < stroke.pts.length; i += 2) {
        out.push({ x: stroke.pts[i], y: stroke.pts[i + 1] });
      }
    }
  }
  return out;
}

describe('generateGrove', () => {
  it('is deterministic for a seed and viewport', () => {
    const again = generateGrove({ seed: 0x6c7579, width: W, height: H });
    expect(JSON.stringify(again)).toBe(JSON.stringify(grove));
  });

  it('draws a different grove for a different seed', () => {
    const other = generateGrove({ seed: 1, width: W, height: H });
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(grove));
  });

  it('plants both planes at every viewport it will meet', () => {
    for (const width of [320, 768, 1280, 2560]) {
      const g = generateGrove({ seed: 7, width, height: 640 });
      expect(g.ink.length).toBeGreaterThan(3);
      expect(g.haze.length).toBeGreaterThan(2);
      /* Density, not count, is the constant: a wide screen gets more culms. */
      expect(g.ink.length).toBeLessThan(width / 40 + 12);
    }
  });

  it('scales the count with the width', () => {
    const narrow = generateGrove({ seed: 7, width: 480, height: 640 });
    const wide = generateGrove({ seed: 7, width: 1920, height: 640 });
    expect(wide.ink.length).toBeGreaterThan(narrow.ink.length);
  });

  it('draws to the narrow side of a tall viewport', () => {
    /* Size everything off the height alone and a phone gets culms 7% of the
       screen across — a log, not a hedge. */
    expect(drawingUnit(375, 812)).toBeLessThan(375 * 0.85);
    expect(drawingUnit(1280, 720)).toBe(720);
    for (const [w, h] of [
      [375, 812],
      [414, 896],
      [768, 1024],
      [1280, 720],
      [2560, 1440],
    ]) {
      const unit = drawingUnit(w, h);
      /* The fattest culm the specs allow, as a share of the screen's width. */
      expect((unit * 0.085) / w).toBeLessThan(0.075);
    }
  });

  it('reports the viewport it was grown for', () => {
    expect(grove.width).toBe(W);
    expect(grove.height).toBe(H);
  });
});

describe('geometry', () => {
  it('keeps every mark inside the frame plus the haze overhang', () => {
    for (const stalk of stalks(grove)) {
      for (const p of points(stalk)) {
        expect(p.x).toBeGreaterThan(-W * 0.5);
        expect(p.x).toBeLessThan(W * 1.5);
        /* Culms may leave through the top; nothing sinks past the feet. */
        expect(p.y).toBeLessThan(H + HAZE_PAD);
      }
    }
  });

  it('roots every stalk at the foot of the frame', () => {
    for (const stalk of stalks(grove)) {
      const lowest = points(stalk).reduce((m, p) => Math.max(m, p.y), -Infinity);
      expect(lowest).toBeGreaterThan(H * 0.95);
    }
  });

  it('sends a good share of the culms out through the top', () => {
    /* A hedge whose every tip is visible is a row of plants in pots. */
    const escaping = grove.ink.filter((s) => points(s).some((p) => p.y < 0));
    expect(escaping.length).toBeGreaterThan(grove.ink.length * 0.33);
  });

  it('stands the culms plumb — no stalk leans past its own height', () => {
    for (const stalk of stalks(grove)) {
      const pts = points(stalk);
      const dx = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
      const dy = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
      expect(dx).toBeLessThan(dy);
    }
  });

  it('groups marks by pen weight so a frame paints few paths', () => {
    for (const stalk of stalks(grove)) {
      expect(stalk.groups.length).toBeLessThanOrEqual(8);
      for (const group of stalk.groups) {
        expect(group.width).toBeGreaterThan(0);
        expect(group.strokes.length).toBeGreaterThan(0);
      }
    }
  });

  it('samples every stroke as at least a two-point polyline', () => {
    for (const stalk of stalks(grove)) {
      for (const group of stalk.groups) {
        for (const stroke of group.strokes) {
          expect(stroke.pts.length).toBeGreaterThanOrEqual(4);
          expect(stroke.pts.length % 2).toBe(0);
          expect([...stroke.pts].every(Number.isFinite)).toBe(true);
        }
      }
    }
  });
});

describe('growth timing', () => {
  it('settles the whole grove inside the budget', () => {
    expect(SETTLE_MS).toBeLessThanOrEqual(2000);
    for (const stalk of stalks(grove)) {
      expect(stalk.delay).toBeGreaterThanOrEqual(0);
      expect(stalk.dur).toBeGreaterThan(0);
      expect(stalk.delay + stalk.dur).toBeLessThanOrEqual(1);
    }
  });

  it('finishes every mark before its stalk stops growing', () => {
    for (const stalk of stalks(grove)) {
      for (const group of stalk.groups) {
        for (const stroke of group.strokes) {
          expect(stroke.to).toBeLessThanOrEqual(1);
          expect(stroke.from).toBeLessThan(stroke.to);
        }
      }
    }
  });

  it('starts some stalks at once, so nothing waits on an empty frame', () => {
    expect(Math.min(...stalks(grove).map((s) => s.delay))).toBeLessThan(0.1);
  });

  it('carries depth as opacity, so no plane needs a second colour', () => {
    for (const stalk of stalks(grove)) {
      expect(stalk.alpha).toBeGreaterThan(0);
      expect(stalk.alpha).toBeLessThanOrEqual(1);
    }
    /* The ink plane has to span the range, not sit in the middle of it: culms
       all at one opacity are a pattern, not a hedge. */
    const alphas = grove.ink.map((s) => s.alpha);
    expect(Math.max(...alphas)).toBeGreaterThan(0.8);
    expect(Math.min(...alphas)).toBeLessThan(0.75);
  });
});
