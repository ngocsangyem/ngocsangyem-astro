import { defineHastPlugin } from 'satteri';

/** 0 → A … 25 → Z, 26 → AA, like spreadsheet columns. Exported for tests. */
export function figureLabel(index: number): string {
  let n = index + 1;
  let label = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

/**
 * Every block-level image (the only content of its paragraph) becomes a
 * lettered figure: `FIG A`, `FIG B`… The image title, when present, becomes
 * the caption; the alt text is never repeated as visible text.
 *
 * The image node itself is never rebuilt. Mutations apply by node id after
 * every plugin has visited, and Astro's image marker runs after this plugin
 * and patches the original <img>; a copy would lose that patch and ship the
 * raw relative src. So the paragraph is wrapped in place: `wrapNode` puts the
 * wrapped node first and keeps the wrapper's own children after it, which is
 * where the caption goes. (A separate insertAfter would resolve against the
 * paragraph's old parent and land outside the figure.)
 *
 * A factory, which satteri calls once per compile, so the lettering counter
 * belongs to one document and concurrent renders cannot share it.
 */
export const hastFigures = () => {
  let count = 0;
  return defineHastPlugin({
    name: 'hast-figures',
    element: {
      filter: ['p'],
      visit(node, ctx) {
        const meaningful = node.children.filter(
          (child) => !(child.type === 'text' && child.value.trim() === ''),
        );
        const [only] = meaningful;
        if (meaningful.length !== 1 || only.type !== 'element' || only.tagName !== 'img') return;

        const title = only.properties?.title;
        const label = `FIG ${figureLabel(count)}`;
        count += 1;

        const caption = {
          type: 'element' as const,
          tagName: 'figcaption',
          properties: { className: ['figure-caption'] },
          children: [
            {
              type: 'element' as const,
              tagName: 'span',
              properties: { className: ['figure-label'], dataPagefindIgnore: '' },
              children: [{ type: 'text' as const, value: label }],
            },
            ...(typeof title === 'string' && title.trim()
              ? [
                  {
                    type: 'element' as const,
                    tagName: 'span',
                    properties: { className: ['figure-text'] },
                    children: [{ type: 'text' as const, value: title.trim() }],
                  },
                ]
              : []),
          ],
        };
        ctx.wrapNode(node, {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['figure'] },
          children: [caption],
        });
      },
    },
  });
};
