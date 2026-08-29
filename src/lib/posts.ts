import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../config/site';

export type Post = CollectionEntry<'posts'>;

export interface YearGroup {
  year: number;
  posts: Post[];
}

export interface Tag {
  slug: string;
  label: string;
  count: number;
}

/** URL shape for a post. Rows, RSS, sitemap and canonical all come through here. */
export function postUrl(post: Pick<Post, 'id'>): string {
  return `/posts/${post.id}`;
}

export function tagUrl(slug: string): string {
  return `/tags/${slug}`;
}

/** Case-folded, URL-safe form. "Astro" and "astro" collapse to one tag. */
export function slugifyTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isPublished(post: Post): boolean {
  return post.data.draft !== true;
}

export function sortByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * Description for feeds, OG tags and list rows. Nothing else may read
 * data.description, so the fallback chain stays in one place.
 */
export function getDescription(post: Post): string {
  const declared = post.data.description?.trim();
  if (declared) return declared;

  const excerpt = firstParagraph(post.body ?? '');
  return excerpt || SITE.description;
}

function firstParagraph(body: string): string {
  const prose = body
    // Fenced code, import statements and headings are not prose.
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^import .*$/gm, '')
    .replace(/^\s*#{1,6}\s.*$/gm, '')
    .trim();

  const paragraph = prose.split(/\n\s*\n/).find((block) => block.trim().length > 0);
  if (!paragraph) return '';

  // Inline code is held aside so that tag stripping cannot eat a sentence
  // about `<head>`, while still removing real markup around it.
  const codeSpans: string[] = [];
  const withoutCode = paragraph.replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSpans.push(code);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });

  const flattened = withoutCode
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Blockquote markers only at line start; a bare > elsewhere is prose.
    .replace(/^\s{0,3}>\s?/gm, '')
    // Markup, whether HTML in Markdown or a JSX component in MDX, is not text.
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    // A table's alignment row carries no meaning once flattened.
    .replace(/^\s*\|?[\s:|-]*\|[\s:|-]*$/gm, '')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/[*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\u0000(\d+)\u0000/g, (_match, index: string) => codeSpans[Number(index)] ?? '');

  return truncate(flattened, 180);
}

/** Cuts on code points, so an emoji or accent never splits mid-character. */
function truncate(text: string, limit: number): string {
  const points = [...text];
  if (points.length <= limit) return text;
  return `${points.slice(0, limit - 3).join('').trimEnd()}…`;
}

export function groupPostsByYear(posts: Post[]): YearGroup[] {
  const groups = new Map<number, Post[]>();
  for (const post of sortByDateDesc(posts)) {
    const year = post.data.date.getUTCFullYear();
    const bucket = groups.get(year);
    if (bucket) bucket.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, entries]) => ({ year, posts: entries }));
}

/** Display label keeps the casing of the first post that used the tag. */
export function getAllTags(posts: Post[]): Tag[] {
  const tags = new Map<string, Tag>();
  for (const post of posts) {
    for (const raw of post.data.tags) {
      const slug = slugifyTag(raw);
      if (!slug) continue;
      const label = raw.trim();
      const existing = tags.get(slug);
      if (existing) {
        // Two different tags reaching one slug would share a URL and a count.
        // An ambiguous URL is worth a build failure, not a silent merge.
        if (existing.label.toLowerCase() !== label.toLowerCase()) {
          throw new Error(
            `Tags "${existing.label}" and "${label}" both slugify to "${slug}". Rename one.`,
          );
        }
        existing.count += 1;
      } else {
        tags.set(slug, { slug, label, count: 1 });
      }
    }
  }
  return [...tags.values()].sort(
    (a, b) => b.count - a.count || a.slug.localeCompare(b.slug),
  );
}

export function getPostsByTag(posts: Post[], slug: string): Post[] {
  return sortByDateDesc(posts.filter((post) => post.data.tags.some((t) => slugifyTag(t) === slug)));
}

/** The only entry point pages use. Drafts never leave this function. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return sortByDateDesc(posts.filter(isPublished));
}

export interface Siblings {
  /** The post published just after this one; undefined for the newest. */
  newer?: Post;
  /** The post published just before this one; undefined for the oldest. */
  older?: Post;
}

/**
 * Neighbours in publication order. Labelled newer/older rather than
 * previous/next: on a date-ordered index either word can point either way, and
 * a reader at the foot of an article is choosing a direction in time.
 */
export function getSiblings(posts: Post[], current: Post): Siblings {
  const ordered = sortByDateDesc(posts);
  const index = ordered.findIndex((post) => post.id === current.id);
  if (index === -1) return {};
  return { newer: ordered[index - 1], older: ordered[index + 1] };
}

/**
 * Posts sharing the most tags with this one, best match first. Ties break on
 * recency, so an untagged archive still degrades to "here is what came before"
 * rather than to an arbitrary order.
 */
export function getRelatedPosts(posts: Post[], current: Post, limit = 3): Post[] {
  const tags = new Set(current.data.tags.map(slugifyTag).filter(Boolean));
  if (tags.size === 0) return [];

  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      shared: post.data.tags.reduce(
        (count, raw) => count + (tags.has(slugifyTag(raw)) ? 1 : 0),
        0,
      ),
    }))
    .filter((entry) => entry.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared || b.post.data.date.getTime() - a.post.data.date.getTime(),
    )
    .slice(0, limit)
    .map((entry) => entry.post);
}
