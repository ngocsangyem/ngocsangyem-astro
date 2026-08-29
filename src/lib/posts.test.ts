import { describe, expect, it } from 'vitest';
import {
  getAllTags,
  getDescription,
  getPostsByTag,
  getRelatedPosts,
  getSiblings,
  groupPostsByYear,
  isPublished,
  postUrl,
  slugifyTag,
  sortByDateDesc,
  type Post,
} from './posts';
import { SITE } from '../config/site';

interface Fixture {
  id: string;
  date: string;
  title?: string;
  tags?: string[];
  description?: string;
  draft?: boolean;
  body?: string;
}

function post({ id, date, title = id, tags = [], description, draft = false, body = '' }: Fixture) {
  return {
    id,
    body,
    collection: 'posts',
    data: { title, date: new Date(date), tags, description, draft },
  } as unknown as Post;
}

describe('postUrl', () => {
  it('is the single URL shape for a post', () => {
    expect(postUrl({ id: 'hello-world' } as Post)).toBe('/posts/hello-world');
  });
});

describe('slugifyTag', () => {
  it('folds case so one tag does not become two', () => {
    expect(slugifyTag('Astro')).toBe(slugifyTag('astro'));
  });

  it('collapses punctuation and spaces into single hyphens', () => {
    expect(slugifyTag('  Web  Performance!! ')).toBe('web-performance');
  });

  it('returns empty for a tag with nothing usable in it', () => {
    expect(slugifyTag('!!!')).toBe('');
  });
});

describe('draft handling', () => {
  const posts = [
    post({ id: 'published', date: '2026-01-01' }),
    post({ id: 'unfinished', date: '2026-02-01', draft: true }),
  ];

  it('treats a missing draft flag as published', () => {
    expect(isPublished(post({ id: 'x', date: '2026-01-01' }))).toBe(true);
  });

  it('excludes drafts', () => {
    expect(posts.filter(isPublished).map((p) => p.id)).toEqual(['published']);
  });

  it('keeps drafts out of tag pages too', () => {
    const tagged = [
      post({ id: 'a', date: '2026-01-01', tags: ['astro'] }),
      post({ id: 'b', date: '2026-02-01', tags: ['astro'], draft: true }),
    ].filter(isPublished);
    expect(getPostsByTag(tagged, 'astro').map((p) => p.id)).toEqual(['a']);
  });
});

describe('sortByDateDesc', () => {
  it('puts the newest first', () => {
    const sorted = sortByDateDesc([
      post({ id: 'old', date: '2024-05-01' }),
      post({ id: 'new', date: '2026-05-01' }),
      post({ id: 'middle', date: '2025-05-01' }),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(['new', 'middle', 'old']);
  });

  it('does not mutate its input', () => {
    const input = [post({ id: 'old', date: '2024-05-01' }), post({ id: 'new', date: '2026-05-01' })];
    sortByDateDesc(input);
    expect(input.map((p) => p.id)).toEqual(['old', 'new']);
  });
});

describe('groupPostsByYear', () => {
  it('groups by year, newest year first, newest post first within a year', () => {
    const groups = groupPostsByYear([
      post({ id: 'a', date: '2025-03-01' }),
      post({ id: 'b', date: '2026-01-15' }),
      post({ id: 'c', date: '2026-07-02' }),
    ]);
    expect(groups.map((g) => g.year)).toEqual([2026, 2025]);
    expect(groups[0]?.posts.map((p) => p.id)).toEqual(['c', 'b']);
    expect(groups[1]?.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('splits across a new-year boundary by UTC date', () => {
    const groups = groupPostsByYear([
      post({ id: 'eve', date: '2025-12-31T23:00:00Z' }),
      post({ id: 'day', date: '2026-01-01T01:00:00Z' }),
    ]);
    expect(groups.map((g) => [g.year, g.posts.map((p) => p.id)])).toEqual([
      [2026, ['day']],
      [2025, ['eve']],
    ]);
  });

  it('returns nothing for no posts', () => {
    expect(groupPostsByYear([])).toEqual([]);
  });
});

describe('getAllTags', () => {
  it('dedupes across casing and counts every use', () => {
    const tags = getAllTags([
      post({ id: 'a', date: '2026-01-01', tags: ['Astro', 'css'] }),
      post({ id: 'b', date: '2026-02-01', tags: ['astro'] }),
    ]);
    expect(tags).toEqual([
      { slug: 'astro', label: 'Astro', count: 2 },
      { slug: 'css', label: 'css', count: 1 },
    ]);
  });

  it('drops a tag that slugifies to nothing', () => {
    expect(getAllTags([post({ id: 'a', date: '2026-01-01', tags: ['???'] })])).toEqual([]);
  });

  it('fails the build when two different tags claim one slug', () => {
    const posts = [post({ id: 'a', date: '2026-01-01', tags: ['C++', 'C#'] })];
    expect(() => getAllTags(posts)).toThrow(/both slugify to "c"/);
  });

  it('does not treat a casing difference as a collision', () => {
    const posts = [
      post({ id: 'a', date: '2026-01-01', tags: ['Astro'] }),
      post({ id: 'b', date: '2026-02-01', tags: ['astro'] }),
    ];
    expect(() => getAllTags(posts)).not.toThrow();
  });

  it('orders by count, then slug', () => {
    const tags = getAllTags([
      post({ id: 'a', date: '2026-01-01', tags: ['zebra', 'alpha'] }),
      post({ id: 'b', date: '2026-02-01', tags: ['alpha'] }),
    ]);
    expect(tags.map((t) => t.slug)).toEqual(['alpha', 'zebra']);
  });
});

describe('getDescription', () => {
  it('prefers the frontmatter description', () => {
    expect(
      getDescription(post({ id: 'a', date: '2026-01-01', description: ' Stated. ', body: 'Body.' })),
    ).toBe('Stated.');
  });

  it('falls back to the first prose paragraph', () => {
    const body = '# Heading\n\nFirst real paragraph.\n\nSecond one.';
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe(
      'First real paragraph.',
    );
  });

  it('skips code fences and MDX imports when looking for prose', () => {
    const body = "import Thing from './thing';\n\n```js\nconst x = 1;\n```\n\nActual prose here.";
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe('Actual prose here.');
  });

  it('flattens links and inline markup', () => {
    const body = 'Read the [docs](https://example.com) and `code` too.';
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe(
      'Read the docs and code too.',
    );
  });

  it('keeps angle brackets that belong to the prose', () => {
    const body = 'A script at the top of `<head>` runs first.';
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe(
      'A script at the top of <head> runs first.',
    );
  });

  it('strips blockquote markers at line start', () => {
    const body = '> Quoted line one\n> and line two.';
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe(
      'Quoted line one and line two.',
    );
  });

  it('truncates a long paragraph', () => {
    const body = 'x'.repeat(400);
    const result = getDescription(post({ id: 'a', date: '2026-01-01', body }));
    expect(result.length).toBe(178);
    expect(result.endsWith('…')).toBe(true);
  });

  it('never splits a multi-byte character when truncating', () => {
    const body = '🙂'.repeat(400);
    const result = getDescription(post({ id: 'a', date: '2026-01-01', body }));
    expect([...result].every((c) => c === '🙂' || c === '…')).toBe(true);
    expect(result.includes('\uFFFD')).toBe(false);
  });

  it('strips an HTML block used as the opening paragraph', () => {
    const body = '<div class="note">Read this first.</div>\n\nThen the rest.';
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe('Read this first.');
  });

  it('strips a JSX component from an MDX opening', () => {
    const body = "import Note from './Note';\n\n<Note>Careful here.</Note>";
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe('Careful here.');
  });

  it('flattens a table into readable text', () => {
    const body = '| Name | Value |\n| --- | --- |';
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body }))).toBe('Name Value');
  });

  it('falls back to the site description when there is no prose at all', () => {
    expect(getDescription(post({ id: 'a', date: '2026-01-01', body: '# Only a heading' }))).toBe(
      SITE.description,
    );
  });

  it('treats an empty frontmatter description as absent', () => {
    expect(
      getDescription(post({ id: 'a', date: '2026-01-01', description: '   ', body: 'Prose.' })),
    ).toBe('Prose.');
  });
});

describe('getSiblings', () => {
  const posts = [
    post({ id: 'newest', date: '2026-03-01' }),
    post({ id: 'middle', date: '2026-02-01' }),
    post({ id: 'oldest', date: '2026-01-01' }),
  ];

  it('reads newer and older off publication order', () => {
    const { newer, older } = getSiblings(posts, posts[1]);
    expect(newer?.id).toBe('newest');
    expect(older?.id).toBe('oldest');
  });

  it('leaves the end of the run open', () => {
    expect(getSiblings(posts, posts[0]).newer).toBeUndefined();
    expect(getSiblings(posts, posts[2]).older).toBeUndefined();
  });

  it('sorts for itself, so an unsorted list gives the same answer', () => {
    const shuffled = [posts[2], posts[0], posts[1]];
    expect(getSiblings(shuffled, posts[1]).newer?.id).toBe('newest');
  });

  it('returns nothing for a post outside the list', () => {
    expect(getSiblings(posts, post({ id: 'stranger', date: '2026-04-01' }))).toEqual({});
  });
});

describe('getRelatedPosts', () => {
  const current = post({ id: 'current', date: '2026-03-01', tags: ['astro', 'css'] });

  it('ranks by shared tags, then by recency', () => {
    const posts = [
      current,
      post({ id: 'one-tag-new', date: '2026-02-01', tags: ['css'] }),
      post({ id: 'both-tags', date: '2025-01-01', tags: ['css', 'astro'] }),
      post({ id: 'one-tag-old', date: '2025-06-01', tags: ['astro'] }),
    ];
    expect(getRelatedPosts(posts, current).map((p) => p.id)).toEqual([
      'both-tags',
      'one-tag-new',
      'one-tag-old',
    ]);
  });

  it('never returns the post itself', () => {
    expect(getRelatedPosts([current], current)).toEqual([]);
  });

  it('matches on the slug, so casing does not split a tag', () => {
    const other = post({ id: 'other', date: '2026-01-01', tags: ['Astro'] });
    expect(getRelatedPosts([current, other], current).map((p) => p.id)).toEqual(['other']);
  });

  it('returns nothing when the post carries no tags', () => {
    const untagged = post({ id: 'untagged', date: '2026-03-01' });
    const posts = [untagged, post({ id: 'other', date: '2026-01-01', tags: ['css'] })];
    expect(getRelatedPosts(posts, untagged)).toEqual([]);
  });

  it('honours the limit', () => {
    const posts = [
      current,
      post({ id: 'a', date: '2026-02-01', tags: ['css'] }),
      post({ id: 'b', date: '2026-01-01', tags: ['css'] }),
    ];
    expect(getRelatedPosts(posts, current, 1).map((p) => p.id)).toEqual(['a']);
  });
});
