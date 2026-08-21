import { readdirSync } from 'node:fs';
import { defineHastPlugin } from 'satteri';
import { SITE } from '../config/site';

const FAVICON_DIR = new URL('../../public/favicons/', import.meta.url);

/** Hostnames with a committed icon. Anything else stays a plain prose link. */
function loadFaviconHosts(): Set<string> {
  try {
    return new Set(
      readdirSync(FAVICON_DIR)
        .filter((name) => name.endsWith('.svg'))
        .map((name) => name.slice(0, -'.svg'.length)),
    );
  } catch {
    return new Set();
  }
}

const siteHost = new URL(SITE.url).hostname;

let faviconHosts: Set<string> | null = null;

/** Only running prose gets chips; nav-like and heading links are left alone. */
const PROSE_PARENTS = new Set(['p', 'li', 'td', 'blockquote']);

/** Matches example.com.svg for links to www.example.com as well. Exported for tests. */
export function iconFor(host: string, hosts?: Set<string>): string | null {
  const available = hosts ?? (faviconHosts ??= loadFaviconHosts());
  if (available.has(host)) return host;
  const bare = host.replace(/^www\./, '');
  return available.has(bare) ? bare : null;
}

/** Hostname when the link leaves this site, else null. Exported for tests. */
export function externalHost(href: string): string | null {
  if (!/^https?:\/\//i.test(href)) return null;
  try {
    const { hostname } = new URL(href);
    return hostname === siteHost ? null : hostname;
  } catch {
    return null;
  }
}

export const hastLinkChips = defineHastPlugin({
  name: 'hast-link-chips',
  // Re-read per document so adding an icon during `astro dev` takes effect on
  // the next request rather than needing a restart.
  before() {
    faviconHosts = null;
  },
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string') return;

      const host = externalHost(href);
      if (!host) return;

      // Merge rather than overwrite: an author may have written rel="me".
      const priorRel = node.properties?.rel;
      const relTokens = new Set(
        (Array.isArray(priorRel) ? priorRel.map(String) : String(priorRel ?? '').split(/\s+/))
          .filter(Boolean),
      );
      relTokens.add('noopener');
      relTokens.add('noreferrer');
      ctx.setProperty(node, 'rel', [...relTokens].join(' '));

      const parent = ctx.parent(node);
      const parentTag = parent && 'tagName' in parent ? parent.tagName : undefined;
      if (!parentTag || !PROSE_PARENTS.has(parentTag)) return;

      // An icon-less chip would read as a broken image, so those stay links.
      const iconHost = iconFor(host);
      if (!iconHost) return;

      // A link wrapping an image or code is not a text label.
      if (node.children.some((child) => child.type === 'element')) return;

      const label = ctx.textContent(node).trim();
      if (!label) return;

      // Keep any class the author wrote by hand in MDX.
      const existing = node.properties?.className;
      const classes = Array.isArray(existing) ? [...existing.map(String)] : existing ? [String(existing)] : [];
      ctx.setProperty(node, 'className', [...classes, 'link-chip']);

      ctx.prependChild(node, {
        type: 'element',
        tagName: 'img',
        properties: {
          src: `/favicons/${iconHost}.svg`,
          alt: '',
          ariaHidden: 'true',
          width: 16,
          height: 16,
        },
        children: [],
      });
    },
  },
});
