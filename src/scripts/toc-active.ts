/**
 * Marks the table-of-contents entry for the section the reader is in.
 *
 * Pure enhancement: without it the list is exactly the list it was, every entry
 * at rest colour and every link still working. It is also the only reason an
 * article needs this file at all — the reveal, the layout and the scrolling are
 * all CSS.
 *
 * An IntersectionObserver rather than a scroll listener: the browser does the
 * measuring off the main thread, and a heading entering or leaving the viewport
 * is the only moment the answer can change.
 */

/**
 * Only the top strip of the viewport counts as "reading here". Without the
 * bottom inset every heading on a short section would qualify at once and the
 * mark would sit on the last one rather than the current one.
 */
const ROOT_MARGIN = '0px 0px -70% 0px';

function activate(links: Map<string, HTMLAnchorElement[]>, id: string) {
  for (const [slug, anchors] of links) {
    for (const anchor of anchors) {
      // aria-current, not a class alone: the mark is a real statement about
      // where the reader is, and a screen reader should hear it too.
      if (slug === id) anchor.setAttribute('aria-current', 'true');
      else anchor.removeAttribute('aria-current');
    }
  }
}

function start() {
  const lists = document.querySelectorAll<HTMLElement>('[data-toc]');
  if (lists.length === 0) return;

  /** One slug can appear in both the margin list and the inline one. */
  const links = new Map<string, HTMLAnchorElement[]>();
  for (const list of lists) {
    for (const anchor of list.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      const slug = decodeURIComponent(anchor.hash.slice(1));
      if (!slug) continue;
      const existing = links.get(slug);
      if (existing) existing.push(anchor);
      else links.set(slug, [anchor]);
    }
  }

  const headings = [...links.keys()]
    .map((slug) => document.getElementById(slug))
    .filter((heading): heading is HTMLElement => heading !== null);
  if (headings.length === 0) return;

  /** Document order, so "the last one above the fold" is well defined. */
  const seen = new Set<string>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) seen.add(entry.target.id);
        else seen.delete(entry.target.id);
      }

      // The deepest heading the reader has reached, so scrolling back up
      // releases the mark in the same order it was taken.
      const current = headings.filter((heading) => seen.has(heading.id)).at(-1);
      if (current) activate(links, current.id);
    },
    { rootMargin: ROOT_MARGIN, threshold: 0 },
  );

  for (const heading of headings) observer.observe(heading);
}

start();
