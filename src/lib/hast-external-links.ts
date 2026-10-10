import { defineHastPlugin } from 'satteri';
import { SITE } from '../config/site';

const siteHost = new URL(SITE.url).hostname;

/** Hostname when the link leaves this site, else null. Exported for tests. */
export function externalHost(href: string): string | null {
  if (!/^https?:\/\//i.test(href)) return null;
  try {
    const { hostname } = new URL(href);
    return hostname && hostname !== siteHost ? hostname : null;
  } catch {
    return null;
  }
}

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

type ParentOf = (node: never) => unknown;

function insideHeading(node: unknown, ctx: { parent: ParentOf }): boolean {
  let current = ctx.parent(node as never);
  while (current && typeof current === 'object') {
    if ('tagName' in current && HEADINGS.has(String((current as { tagName: string }).tagName))) return true;
    current = ctx.parent(current as never);
  }
  return false;
}

/**
 * Marks a link that leaves the site with a trailing `↗`, hidden from AT (the
 * destination is already in the href), and hardens its rel. Plain text links
 * only: a linked image keeps its own affordance. Links inside a heading get
 * no marker, because Astro reads heading text for the outline after this runs
 * and the arrow would end up in the contents list.
 */
export const hastExternalLinks = defineHastPlugin({
  name: 'hast-external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string' || !externalHost(href)) return;

      // Merge rather than overwrite: an author may have written rel="me".
      const priorRel = node.properties?.rel;
      const relTokens = new Set(
        (Array.isArray(priorRel) ? priorRel.map(String) : String(priorRel ?? '').split(/\s+/)).filter(Boolean),
      );
      relTokens.add('noopener');
      relTokens.add('noreferrer');
      ctx.setProperty(node, 'rel', [...relTokens].join(' '));

      const wrapsImage = node.children.some((child) => child.type === 'element' && child.tagName === 'img');
      if (wrapsImage || insideHeading(node, ctx)) return;

      ctx.appendChild(node, {
        type: 'element',
        tagName: 'span',
        properties: { className: ['ext'], ariaHidden: 'true' },
        children: [{ type: 'text', value: '↗' }],
      });
    },
  },
});
