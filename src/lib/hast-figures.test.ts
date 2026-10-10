import { describe, expect, it } from 'vitest';
import { markdownToHtml } from 'satteri';
import { figureLabel, hastFigures } from './hast-figures';

describe('figureLabel', () => {
  it('letters figures A to Z, then AA onward', () => {
    expect(figureLabel(0)).toBe('A');
    expect(figureLabel(10)).toBe('K');
    expect(figureLabel(25)).toBe('Z');
    expect(figureLabel(26)).toBe('AA');
    expect(figureLabel(27)).toBe('AB');
    expect(figureLabel(51)).toBe('AZ');
    expect(figureLabel(52)).toBe('BA');
  });
});

describe('the rendered output', () => {
  const render = (markdown: string) => markdownToHtml(markdown, { hastPlugins: [hastFigures] }).html;

  it('wraps a block image in a lettered figure', () => {
    const html = render('![A chart](/a.png)\n');
    expect(html).toMatch(/<figure class="figure"[^>]*>/);
    expect(html).toContain('FIG A');
    expect(html).toContain('<img src="/a.png" alt="A chart"');
  });

  it('keeps the image paragraph and puts the caption after it, inside the figure', () => {
    const html = render('![Alt](/a.png "Cap")\n\nAfter.\n');
    expect(html).toMatch(/<figure class="figure"><p><img [^>]*><\/p><figcaption class="figure-caption">.*<\/figcaption><\/figure>\s*<p>After\.<\/p>/s);
  });

  it('letters figures in document order', () => {
    const html = render('![one](/1.png)\n\nText.\n\n![two](/2.png)\n');
    expect(html.indexOf('FIG A')).toBeLessThan(html.indexOf('FIG B'));
    expect(html.indexOf('/1.png')).toBeLessThan(html.indexOf('FIG B'));
  });

  it('uses the image title as the caption and never repeats the alt', () => {
    const html = render('![Alt text](/a.png "Caption text")\n');
    expect(html).toContain('Caption text');
    expect(html.match(/Alt text/g)).toHaveLength(1);
  });

  it('shows only the label when there is no title', () => {
    const html = render('![Alt text](/a.png)\n');
    expect(html.match(/Alt text/g)).toHaveLength(1);
    expect(html).toContain('<figcaption');
  });

  it('leaves an inline image in running text untouched', () => {
    const html = render('Some ![icon](/i.png) inline.\n');
    expect(html).not.toContain('<figure');
  });

  it('restarts lettering for each document', () => {
    render('![one](/1.png)\n');
    expect(render('![again](/1.png)\n')).toContain('FIG A');
  });
});
