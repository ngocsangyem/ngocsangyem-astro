import getReadingTime from 'reading-time';
import { defineMdastPlugin, type MdastNode } from 'satteri';

/** Walks to the document root. Exported for tests. */
export function findRoot(
  start: Readonly<MdastNode>,
  getParent: (node: Readonly<MdastNode>) => Readonly<MdastNode> | undefined,
): Readonly<MdastNode> {
  let root = start;
  let ancestor = getParent(root);
  while (ancestor !== undefined) {
    root = ancestor;
    ancestor = getParent(root);
  }
  return root;
}

/** Minutes, floored at 1, read back through remarkPluginFrontmatter. */
export const mdastReadingTime = defineMdastPlugin({
  name: 'mdast-reading-time',
  text(node, context) {
    // The hook fires per text node; the whole tree is measured once.
    if (context.data.astro?.frontmatter.minutesRead !== undefined) return;

    const tree = findRoot(node, (n) => context.parent(n));
    const { minutes } = getReadingTime(context.textContent(tree));

    if (context.data.astro !== undefined) {
      context.data.astro.frontmatter.minutesRead = Math.max(1, Math.round(minutes));
    }
  },
});
