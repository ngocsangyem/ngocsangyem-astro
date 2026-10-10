import { describe, expect, it } from 'vitest';
import { buildCodeFigure, isHighlighted, languageLabel } from './hast-code-titles';

type Node = { tagName?: string; properties?: Record<string, unknown>; children?: Node[]; value?: string };

/** Visible text of the header row, in order. */
function headerText(figure: Node): string[] {
  const header = figure.children?.[0];
  return (header?.children ?? []).map((span) => span.children?.[0]?.value ?? '');
}

describe('languageLabel', () => {
  it('uses the fence language, or text when there is none', () => {
    expect(languageLabel('ts')).toBe('ts');
    expect(languageLabel('')).toBe('text');
    expect(languageLabel(undefined)).toBe('text');
    expect(languageLabel('plaintext')).toBe('text');
  });
});

describe('isHighlighted', () => {
  it('is true only for Shiki output', () => {
    expect(isHighlighted({ className: ['astro-code', 'vitesse-light'] })).toBe(true);
    expect(isHighlighted({ class: 'astro-code astro-code-themes vitesse-light' })).toBe(true);
    expect(isHighlighted({})).toBe(false);
    expect(isHighlighted(undefined)).toBe(false);
  });
});

describe('buildCodeFigure', () => {
  const pre = { className: ['astro-code'], 'data-language': 'ts' };

  it('names the language in a header kept out of the search index', () => {
    const figure = buildCodeFigure(pre, []) as Node;
    expect(figure.tagName).toBe('figure');
    expect(figure.children?.[0]?.tagName).toBe('figcaption');
    expect(figure.children?.[0]?.properties?.dataPagefindIgnore).toBe('');
    expect(headerText(figure)).toEqual(['ts']);
  });

  it('adds the fence title after the language', () => {
    const figure = buildCodeFigure({ ...pre, 'data-code-title': 'a.ts' }, []) as Node;
    expect(headerText(figure)).toEqual(['ts', '·', 'a.ts']);
  });

  it('keeps the original pre, properties and children, after the header', () => {
    const children = [{ type: 'element', tagName: 'code' }];
    const figure = buildCodeFigure(pre, children) as Node;
    expect(figure.children?.[1]).toEqual({ type: 'element', tagName: 'pre', properties: pre, children });
  });
});
