import { defineHastPlugin } from 'satteri';

/**
 * GitHub alert syntax, so a post reads correctly in the repository as well as
 * on the site:
 *
 *     > [!NOTE]
 *     > Body text.
 *
 * Astro 7's Markdown pipeline leaves the marker as literal text inside a
 * blockquote, so this promotes it to a labelled block.
 */
/*
 * Each type pairs its hue with a single-width terminal glyph and a word, so
 * colour is never the only signal. The glyph is decorative (hidden from AT);
 * the word carries the meaning. ⚠ takes U+FE0E so it renders as text, not as
 * a colour emoji.
 */
const TYPES = {
  note: { label: 'Note', glyph: '※' },
  tip: { label: 'Tip', glyph: '✓' },
  important: { label: 'Important', glyph: '▲' },
  warning: { label: 'Warning', glyph: '⚠\uFE0E' },
  caution: { label: 'Caution', glyph: '↯' },
} as const;

type AdmonitionType = keyof typeof TYPES;

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/;

/**
 * Reads the alert marker off the start of a blockquote's first text node.
 * Exported for tests.
 */
export function parseMarker(
  text: string,
): { type: AdmonitionType; label: string; remainder: string } | null {
  const match = MARKER.exec(text);
  if (!match) return null;
  const type = match[1].toLowerCase() as AdmonitionType;
  return { type, label: TYPES[type].label, remainder: text.slice(match[0].length) };
}

function isElement(node: unknown, tagName: string): boolean {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    (node as { type: string }).type === 'element' &&
    'tagName' in node &&
    (node as { tagName: string }).tagName === tagName
  );
}

export const hastAdmonitions = defineHastPlugin({
  name: 'hast-admonitions',
  element: {
    filter: ['blockquote'],
    visit(node, ctx) {
      // The marker only counts on the opening block, as on GitHub. Matching
      // the first paragraph anywhere would hoist the label above a heading.
      const firstBlock = node.children.find(
        (child) => child.type === 'element' || (child.type === 'text' && child.value.trim() !== ''),
      );
      if (!firstBlock || !isElement(firstBlock, 'p') || !('children' in firstBlock)) return;

      const firstParagraph = firstBlock;

      const firstText = firstParagraph.children[0];
      if (!firstText || firstText.type !== 'text') return;

      const parsed = parseMarker(firstText.value);
      if (!parsed) return;

      const { type, label, remainder } = parsed;
      const { glyph } = TYPES[type];

      const emptyParagraph = remainder.trim() === '' && firstParagraph.children.length === 1;

      // A label with no body reads as a mistake, so leave the quote alone.
      if (emptyParagraph && node.children.filter((child) => child.type === 'element').length <= 1) {
        return;
      }

      // Drop the marker, and the paragraph too when it held nothing else.
      if (emptyParagraph) {
        ctx.removeNode(firstParagraph);
      } else {
        ctx.replaceNode(firstText, { type: 'text', value: remainder });
      }

      ctx.replaceNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['admonition', `admonition-${type}`] },
        children: [
          {
            type: 'element',
            tagName: 'p',
            // Chrome, not content: the label stays out of the search index.
            properties: { className: ['admonition-label'], dataPagefindIgnore: '' },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: { className: ['admonition-glyph'], ariaHidden: 'true' },
                children: [{ type: 'text', value: glyph }],
              },
              { type: 'element', tagName: 'span', properties: {}, children: [{ type: 'text', value: label }] },
            ],
          },
          ...node.children,
        ],
      });
    },
  },
});
