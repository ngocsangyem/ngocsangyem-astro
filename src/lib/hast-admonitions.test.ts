import { describe, expect, it } from 'vitest';
import { markdownToHtml } from 'satteri';
import { hastAdmonitions, parseMarker } from './hast-admonitions';

describe('parseMarker', () => {
  it('reads every GitHub alert type', () => {
    for (const [marker, label] of [
      ['NOTE', 'Note'],
      ['TIP', 'Tip'],
      ['IMPORTANT', 'Important'],
      ['WARNING', 'Warning'],
      ['CAUTION', 'Caution'],
    ]) {
      expect(parseMarker(`[!${marker}]\nBody.`)).toEqual({
        type: marker.toLowerCase(),
        label,
        remainder: 'Body.',
      });
    }
  });

  it('leaves an ordinary blockquote alone', () => {
    expect(parseMarker('Just a quote.')).toBeNull();
  });

  it('ignores an unknown type', () => {
    expect(parseMarker('[!HINT]\nBody.')).toBeNull();
  });

  it('requires the marker at the start', () => {
    expect(parseMarker('See [!NOTE] below.')).toBeNull();
  });

  it('is case sensitive, matching GitHub', () => {
    expect(parseMarker('[!note]\nBody.')).toBeNull();
  });

  it('reports an empty remainder when the marker is alone on its line', () => {
    expect(parseMarker('[!NOTE]')?.remainder).toBe('');
  });

  it('keeps body text that follows on the same line', () => {
    expect(parseMarker('[!TIP] inline body')?.remainder).toBe('inline body');
  });

  it('accepts tab character as whitespace after the marker', () => {
    expect(parseMarker('[!NOTE]\tbody')?.remainder).toBe('body');
  });

  it('handles space and newline after marker', () => {
    expect(parseMarker('[!WARNING] \ntext')?.remainder).toBe('text');
  });
});

// The tree rewriting is the risky half, and a pure-regex test cannot reach it.
// These compile real Markdown through the real plugin, so a change in the
// pipeline's patch-apply order fails here instead of silently shipping a raw
// marker into every post.
describe('the rendered output', () => {
  // markdownToHtml is synchronous with these options; the tests stay async so
  // the shape does not have to change if that ever gains a promise.
  const render = (markdown: string) =>
    markdownToHtml(markdown, { hastPlugins: [hastAdmonitions] }).html;

  it('promotes an alert and consumes the marker', () => {
    const html = render('> [!NOTE]\n> Body text.\n');
    expect(html).toContain('admonition-note');
    expect(html).toContain('Body text.');
    expect(html).not.toContain('[!NOTE]');
  });

  it('renders each type with its own label', () => {
    for (const [marker, label] of [
      ['NOTE', 'Note'],
      ['TIP', 'Tip'],
      ['IMPORTANT', 'Important'],
      ['WARNING', 'Warning'],
      ['CAUTION', 'Caution'],
    ]) {
      const html = render(`> [!${marker}]\n> Body.\n`);
      expect(html).toContain(`admonition-${marker.toLowerCase()}`);
      expect(html).toContain(`<span>${label}</span>`);
    }
  });

  it('keeps body text that shares the marker line', () => {
    const html = render('> [!TIP] inline body\n');
    expect(html).toContain('inline body');
    expect(html).not.toContain('[!TIP]');
  });

  it('leaves an ordinary blockquote as a blockquote', () => {
    const html = render('> Just a quote.\n');
    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('admonition');
  });

  it('ignores an unknown type', () => {
    const html = render('> [!HINT]\n> Body.\n');
    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('admonition');
  });

  it('leaves a marker inside a fenced code block alone', () => {
    const html = render('```md\n> [!WARNING]\n> Fenced.\n```\n');
    expect(html).not.toContain('admonition');
  });

  it('leaves a marker inside inline code alone', () => {
    const html = render('Write `> [!NOTE]` to start one.\n');
    expect(html).not.toContain('admonition');
  });

  it('only treats the marker as an alert on the opening block', () => {
    const html = render('> ## Heading\n>\n> [!NOTE]\n> Body.\n');
    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('admonition');
  });

  it('leaves a label with no body as a quote', () => {
    const html = render('> [!NOTE]\n');
    expect(html).not.toContain('admonition');
  });

  it('nests an alert inside an alert', () => {
    const html = render('> [!TIP]\n> Outer.\n>\n> > [!WARNING]\n> > Inner.\n');
    expect(html).toContain('admonition-tip');
    expect(html).toContain('admonition-warning');
    expect(html).not.toContain('[!WARNING]');
  });
});
