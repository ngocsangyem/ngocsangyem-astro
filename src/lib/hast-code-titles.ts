import { defineHastPlugin } from 'satteri';

/** Display name for the header's language slot. Exported for tests. */
export function languageLabel(language: unknown): string {
  const value = typeof language === 'string' ? language.trim() : '';
  // Astro marks a bare fence `plaintext`; the header just says text.
  return value && value !== 'plaintext' && value !== 'txt' ? value : 'text';
}

type Props = Record<string, unknown>;
type Child = { type: string };

const separator = {
  type: 'element' as const,
  tagName: 'span',
  properties: { ariaHidden: 'true' },
  children: [{ type: 'text' as const, value: '·' }],
};

function part(className: string, value: string) {
  return {
    type: 'element' as const,
    tagName: 'span',
    properties: { className: [className] },
    children: [{ type: 'text' as const, value }],
  };
}

/** Shiki marks its own output; a plain `<pre>` is left alone. Exported for tests. */
export function isHighlighted(properties: Props | undefined): boolean {
  // Shiki emits a `class` string; hast built elsewhere uses a className array.
  const raw = properties?.className ?? properties?.class;
  const classes = Array.isArray(raw) ? raw.map(String) : String(raw ?? '').split(/\s+/);
  return classes.includes('astro-code');
}

/**
 * The replacement for a highlighted `<pre>`: a figure whose header row names
 * the language, then the fence title when there is one. Exported for tests,
 * since the real pipeline (Shiki first) cannot be reproduced in a unit test.
 */
export function buildCodeFigure(properties: Props, children: Child[]) {
  const title = properties['data-code-title'];
  const language = languageLabel(properties['data-language'] ?? properties.dataLanguage);
  return {
    type: 'element' as const,
    tagName: 'figure',
    properties: { className: ['code-figure'] },
    children: [
      {
        type: 'element' as const,
        tagName: 'figcaption',
        properties: { className: ['code-header'], dataPagefindIgnore: '' },
        children: [
          part('code-lang', language),
          ...(typeof title === 'string' && title ? [separator, part('code-title', title)] : []),
        ],
      },
      { type: 'element' as const, tagName: 'pre', properties, children },
    ],
  };
}

/**
 * Gives every highlighted block a header row as real selectable text that
 * reaches assistive technology; the copy control is added to the same row by
 * scripts/code-copy.ts. The row is chrome, so it stays out of the search index.
 *
 * The figure is built complete and swapped in one move. Wrapping and then
 * mutating the new wrapper does not work: a patch aimed at a node created
 * earlier in the same pass is dropped.
 */
export const hastCodeTitles = defineHastPlugin({
  name: 'hast-code-titles',
  element: {
    filter: ['pre'],
    visit(node, ctx) {
      if (!isHighlighted(node.properties)) return;
      ctx.replaceNode(node, buildCodeFigure(node.properties ?? {}, node.children) as never);
    },
  },
});
