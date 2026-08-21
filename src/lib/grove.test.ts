import { describe, expect, it } from 'vitest';
import { generateGrove, planeStroke } from './grove';

const PATH_COMMAND = /^M-?[\d.]+ -?[\d.]+[CQLZ]/;

describe('generateGrove', () => {
  it('is deterministic, so the markup is stable across builds', () => {
    expect(generateGrove({ seed: 7 })).toEqual(generateGrove({ seed: 7 }));
  });

  it('gives a different grove for a different seed', () => {
    const a = generateGrove({ seed: 7 });
    const b = generateGrove({ seed: 8 });
    expect(a.culms[0].d).not.toBe(b.culms[0].d);
  });

  it('honours the requested per-plane density', () => {
    const grove = generateGrove({ seed: 1, density: [4, 3, 2] });
    expect(grove.culms.filter((c) => c.plane === 0)).toHaveLength(4);
    expect(grove.culms.filter((c) => c.plane === 1)).toHaveLength(3);
    expect(grove.culms.filter((c) => c.plane === 2)).toHaveLength(2);
  });

  it('emits parseable path data for every culm', () => {
    for (const culm of generateGrove({ seed: 3 }).culms) {
      expect(culm.d).toMatch(PATH_COMMAND);
    }
  });

  it('authors culms base to tip, so a dash offset draws them upward', () => {
    const grove = generateGrove({ seed: 5 });
    for (const culm of grove.culms) {
      const [startX, startY] = culm.d.slice(1).split(/[ C]/).map(Number);
      // The move-to is the base: off the bottom edge, and level with the pivot.
      expect(startY).toBeGreaterThan(grove.height);
      expect(startY).toBe(culm.originY);
      expect(startX).toBe(culm.originX);
    }
  });

  it('keeps every culm rooted off the bottom edge rather than floating', () => {
    const grove = generateGrove({ seed: 11 });
    for (const culm of grove.culms) {
      expect(culm.originY).toBeGreaterThan(grove.height);
      expect(culm.originX).toBeGreaterThanOrEqual(0);
      expect(culm.originX).toBeLessThanOrEqual(grove.width);
    }
  });

  it('holds the sway sub-degree, as the motion stance requires', () => {
    for (const culm of generateGrove({ seed: 13 }).culms) {
      expect(culm.amp).toBeGreaterThan(0);
      expect(culm.amp).toBeLessThan(1);
      expect(culm.period).toBeGreaterThanOrEqual(13);
    }
  });

  it('leaves the back plane bare and dresses the front planes', () => {
    const grove = generateGrove({ seed: 17 });
    for (const culm of grove.culms) {
      if (culm.plane === 0) {
        expect(culm.nodes).toBe('');
        expect(culm.fans).toHaveLength(0);
      } else {
        expect(culm.nodes).not.toBe('');
        expect(culm.fans.length).toBeGreaterThan(0);
      }
    }
  });

  it('hangs every fan on the upper culm, where a real one carries its leaves', () => {
    for (const culm of generateGrove({ seed: 19 }).culms) {
      for (const fan of culm.fans) {
        // The anchor filter is exclusive at 0.55, but the stored value is
        // rounded to two places and can land exactly on the boundary.
        expect(fan.s).toBeGreaterThanOrEqual(0.55);
        expect(fan.s).toBeLessThan(1);
        expect(fan.d).toMatch(PATH_COMMAND);
      }
    }
  });

  it('rounds every emitted number, so no binary-float tail reaches the markup', () => {
    // 0.45299999999999996 shipped once. Every value below lands in a style
    // attribute or path, inlined on each page, so the tails are pure payload.
    const tooPrecise = (value: number) => String(value).replace(/^-?\d*\.?/, '').length > 2;

    for (const culm of generateGrove({ seed: 31 }).culms) {
      for (const value of [
        culm.amp,
        culm.period,
        culm.drawDelay,
        culm.drawDur,
        culm.swayDelay,
        culm.lagPeriod,
        culm.nodeDelay,
        culm.nodeDur,
      ]) {
        expect(tooPrecise(value), `${value}`).toBe(false);
      }

      expect(Number.isInteger(culm.originX)).toBe(true);
      expect(Number.isInteger(culm.originY)).toBe(true);

      for (const fan of culm.fans) {
        expect(tooPrecise(fan.delay), `${fan.delay}`).toBe(false);
      }
      // Path data carries at most one decimal per coordinate.
      expect(culm.d).not.toMatch(/\d\.\d\d/);
      expect(culm.nodes).not.toMatch(/\d\.\d\d/);
    }
  });

  it('lights each fan as the growth front reaches its node', () => {
    for (const culm of generateGrove({ seed: 37 }).culms) {
      for (const fan of culm.fans) {
        expect(fan.delay).toBeGreaterThanOrEqual(culm.drawDelay);
        expect(fan.delay).toBeLessThanOrEqual(culm.swayDelay);
      }
    }
  });

  it('starts each sway only once that culm has finished drawing', () => {
    for (const culm of generateGrove({ seed: 41 }).culms) {
      expect(culm.swayDelay).toBeCloseTo(culm.drawDelay + culm.drawDur, 1);
      expect(culm.lagPeriod).toBeLessThan(culm.period);
    }
  });

  it('reports a settle time that covers the last culm to finish drawing', () => {
    const grove = generateGrove({ seed: 23 });
    const last = Math.max(...grove.culms.map((c) => c.drawDelay + c.drawDur));
    expect(grove.settleAt).toBeCloseTo(last, 1);
  });

  it('settles inside a few seconds, so the page is never still growing late', () => {
    expect(generateGrove({ seed: 29 }).settleAt).toBeLessThan(9);
  });
});

describe('planeStroke', () => {
  it('thickens toward the front, so the planes read as depth', () => {
    expect(planeStroke(0)).toBeLessThan(planeStroke(1));
    expect(planeStroke(1)).toBeLessThan(planeStroke(2));
  });
});
