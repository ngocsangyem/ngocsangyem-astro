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
const TYPES = {
  note: { label: 'Note', icon: 'M12 16v-5M12 8h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z' },
  tip: { label: 'Tip', icon: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z' },
  important: { label: 'Important', icon: 'M12 8v5M12 17h.01M3 5h18v13H8l-5 4V5Z' },
  warning: { label: 'Warning', icon: 'M12 9v4M12 17h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' },
  caution: { label: 'Caution', icon: 'M12 8v4M12 16h.01M12 3 3 7.5v5C3 17.6 6.8 21.5 12 22c5.2-.5 9-4.4 9-9.5v-5L12 3Z' },
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
      const { icon } = TYPES[type];

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
            properties: { className: ['admonition-label'] },
            children: [
              {
                type: 'element',
                tagName: 'svg',
                properties: {
                  viewBox: '0 0 24 24',
                  width: 15,
                  height: 15,
                  ariaHidden: 'true',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '1.8',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                },
                children: [
                  { type: 'element', tagName: 'path', properties: { d: icon }, children: [] },
                ],
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
