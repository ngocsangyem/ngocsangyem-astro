import { defineHastPlugin } from 'satteri';

/**
 * Puts each table in a scroll container, so a wide one scrolls inside the prose
 * column instead of pushing the whole page sideways. Wrapping keeps the table's
 * own display type, which `display: block` on the table would destroy.
 */
export const hastTables = defineHastPlugin({
  name: 'hast-tables',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      const parent = ctx.parent(node);
      if (parent && 'properties' in parent) {
        const className = parent.properties?.className;
        const classes = Array.isArray(className) ? className.map(String) : [String(className ?? '')];
        if (classes.includes('table-scroll')) return;
      }

      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-scroll'],
          // Focusable so the scroll is reachable without a pointer; a named
          // region so that focus stop is announced rather than anonymous.
          tabindex: 0,
          role: 'region',
          ariaLabel: 'Table',
        },
        children: [],
      });
    },
  },
});
