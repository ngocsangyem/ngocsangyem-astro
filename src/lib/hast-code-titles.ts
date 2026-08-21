import { defineHastPlugin } from 'satteri';

/**
 * Turns the title parked on a `<pre>` into a real caption, so the filename is
 * selectable text and reaches assistive technology. A CSS `::before` would be
 * neither.
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
      const title = node.properties?.['data-code-title'];
      if (typeof title !== 'string' || !title) return;

      ctx.replaceNode(node, {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code-figure'] },
        children: [
          {
            type: 'element',
            tagName: 'figcaption',
            properties: { className: ['code-title'] },
            children: [{ type: 'text', value: title }],
          },
          { type: 'element', tagName: 'pre', properties: node.properties, children: node.children },
        ],
      });
    },
  },
});
