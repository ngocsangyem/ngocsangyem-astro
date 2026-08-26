import { describe, expect, it } from 'vitest';
import { fitHeadline, renderCardSvg, type Measure } from './og-card';

/**
 * A fixed advance per character, so a width is a character count and every
 * expectation below can be read without a font. The column is 1024px wide, so
 * at 76px a line holds 25 characters.
 */
const measure: Measure = (text, fontSize) => text.length * fontSize * 0.539;

/** Stands in for `public/og-default-light.svg`: the two lines the substitution
 *  looks for, plus a sibling it must leave alone. */
const HEADLINE_FILL = '#edf0f0';
const HEADLINE_FAMILY = 'Inter, sans-serif';

const headlineLine = (y: number, text: string) =>
  `<text x="88" y="${y}" fill="${HEADLINE_FILL}" font-family="${HEADLINE_FAMILY}" ` +
  `font-size="76" font-weight="600" letter-spacing="-1.5">${text}</text>\n  `;

const template =
  '<svg>' +
  '<text x="88" y="112" font-size="20">SANG.DEV</text>' +
  headlineLine(360, 'Notes on the craft of') +
  headlineLine(445, 'building for the web') +
  '<rect x="88" y="525" width="96" height="1"/>' +
  '</svg>';

/** Baselines of the headline lines, in document order. */
function headlineBaselines(svg: string): number[] {
  return [...svg.matchAll(/<text x="88" y="(\d+)"[^>]*font-size="(\d+)"/g)]
    .filter(([, , size]) => size === '76' || size === '52')
    .map(([, y]) => Number(y));
}

describe('fitHeadline', () => {
  it('keeps a title that fits on one line on one line, at the template size', () => {
    expect(fitHeadline('Object dot notation', measure)).toEqual({
      lines: ['Object dot notation'],
      fontSize: 76,
    });
  });

  it('wraps on word boundaries rather than shrinking while the budget allows', () => {
    const { lines, fontSize } = fitHeadline('How async and await really work here', measure);
    expect(fontSize).toBe(76);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('How async and await really work here');
  });

  it('steps the size down when the line budget is exhausted', () => {
    // Over the ~100 characters four lines hold at the template size.
    const long =
      'one two three four five six seven eight nine ten eleven twelve thirteen ' +
      'fourteen fifteen sixteen seventeen eighteen nineteen twenty';
    expect(fitHeadline(long, measure).fontSize).toBeLessThan(76);
  });

  it('never returns more lines than the artwork has room for', () => {
    const absurd = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ');
    expect(fitHeadline(absurd, measure).lines.length).toBeLessThanOrEqual(4);
  });

  it('truncates rather than overflowing once the smallest size still will not fit', () => {
    const absurd = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ');
    const { lines } = fitHeadline(absurd, measure);
    expect(lines[lines.length - 1].endsWith('…')).toBe(true);
  });

  it('shrinks for a single word too wide to break', () => {
    expect(fitHeadline('Pneumonoultramicroscopicsilicovolcanoconiosis', measure).fontSize).toBeLessThan(
      76,
    );
  });

  it('collapses runs of whitespace in a title', () => {
    expect(fitHeadline('  Object   dot  notation ', measure).lines).toEqual([
      'Object dot notation',
    ]);
  });
});

describe('renderCardSvg', () => {
  it('reproduces the template geometry for a two-line headline', () => {
    const svg = renderCardSvg(template, { lines: ['Notes on the', 'craft of the web'], fontSize: 76 });
    expect(headlineBaselines(svg)).toEqual([360, 445]);
  });

  it('centres a one-line headline instead of leaving it on the floor', () => {
    const svg = renderCardSvg(template, { lines: ['Object dot notation'], fontSize: 76 });
    expect(headlineBaselines(svg)).toEqual([403]);
  });

  it('grows a three-line headline upward from the floor', () => {
    const svg = renderCardSvg(template, { lines: ['a', 'b', 'c'], fontSize: 76 });
    expect(headlineBaselines(svg)).toEqual([275, 360, 445]);
  });

  it('never sets a baseline past the rule below the headline', () => {
    for (const count of [1, 2, 3, 4]) {
      const lines = Array.from({ length: count }, (_, index) => `line ${index}`);
      const last = headlineBaselines(renderCardSvg(template, { lines, fontSize: 52 })).at(-1);
      expect(last).toBeLessThanOrEqual(445);
    }
  });

  it('leaves the eyebrow row untouched', () => {
    const svg = renderCardSvg(template, { lines: ['x'], fontSize: 76 });
    expect(svg).toContain('<text x="88" y="112" font-size="20">SANG.DEV</text>');
    expect(svg).toContain('<rect x="88" y="525"');
  });

  it('replaces both template lines rather than leaving one behind', () => {
    const svg = renderCardSvg(template, { lines: ['x'], fontSize: 76 });
    expect(svg).not.toContain('Notes on the craft of');
    expect(svg).not.toContain('building for the web');
  });

  it('scales the tracking with the size, as the artwork does', () => {
    expect(renderCardSvg(template, { lines: ['x'], fontSize: 76 })).toContain(
      'letter-spacing="-1.50"',
    );
    expect(renderCardSvg(template, { lines: ['x'], fontSize: 52 })).toContain(
      'letter-spacing="-1.03"',
    );
  });

  it('escapes a title that would otherwise break the markup', () => {
    const svg = renderCardSvg(template, { lines: ['a < b & "c"'], fontSize: 76 });
    expect(svg).toContain('a &lt; b &amp; &quot;c&quot;');
  });

  it('takes its ink and typeface from the template rather than restating them', () => {
    const svg = renderCardSvg(template, { lines: ['x'], fontSize: 76 });
    expect(svg).toContain(`fill="${HEADLINE_FILL}"`);
    expect(svg).toContain(`font-family="${HEADLINE_FAMILY}"`);
  });

  it('throws when a headline line carries no colour to inherit', () => {
    const bare =
      '<svg><text font-size="76">a</text><text font-size="76">b</text></svg>';
    expect(() => renderCardSvg(bare, { lines: ['x'], fontSize: 76 })).toThrow(
      /no fill or font-family/,
    );
  });

  it('throws when the template no longer carries two headline lines', () => {
    expect(() => renderCardSvg('<svg></svg>', { lines: ['x'], fontSize: 76 })).toThrow(
      /expected 2 headline lines/,
    );
  });
});
