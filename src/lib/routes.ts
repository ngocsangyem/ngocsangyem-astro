/** Routes that exist as pages and can therefore be a `cd ..` target. */
const ROUTABLE_PARENTS = new Set(['/posts']);

/**
 * The path one level up, or null at the root where there is nowhere to go.
 * A parent that is not itself a page falls back to the home page, so the link
 * can never land on a 404: `/tags/astro` goes home, since `/tags` has no index.
 */
export function parentPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  if (segments.length === 1) return '/';

  const parent = `/${segments.slice(0, -1).join('/')}`;
  return ROUTABLE_PARENTS.has(parent) ? parent : '/';
}
