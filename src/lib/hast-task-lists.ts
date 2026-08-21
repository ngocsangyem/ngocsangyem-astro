import { defineHastPlugin } from 'satteri';

/**
 * GFM task lists emit a bare disabled checkbox with the item text as a sibling,
 * so the input has no accessible name and its state is invisible to assistive
 * technology. Naming it by state fixes both without touching the markup around
 * it.
 */
export const hastTaskLists = defineHastPlugin({
  name: 'hast-task-lists',
  element: {
    filter: ['input'],
    visit(node, ctx) {
      if (node.properties?.type !== 'checkbox') return;
      if (node.properties?.ariaLabel !== undefined) return;

      const checked = node.properties?.checked === true || node.properties?.checked === 'checked';
      ctx.setProperty(node, 'ariaLabel', checked ? 'Done' : 'Not done');
    },
  },
});
