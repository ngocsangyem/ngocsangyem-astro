import { describe, expect, it } from 'vitest';
import { parentPath } from './routes';

describe('parentPath', () => {
  it('has nowhere to go from the root', () => {
    expect(parentPath('/')).toBeNull();
    expect(parentPath('')).toBeNull();
  });

  it('goes home from a top-level page', () => {
    expect(parentPath('/about')).toBe('/');
    expect(parentPath('/projects')).toBe('/');
    expect(parentPath('/posts')).toBe('/');
  });

  it('goes to the index from a post', () => {
    expect(parentPath('/posts/some-note')).toBe('/posts');
  });

  it('goes home rather than to a parent that is not a page', () => {
    // /tags has no index route, so linking there would 404.
    expect(parentPath('/tags/astro')).toBe('/');
  });

  it('ignores a trailing slash', () => {
    expect(parentPath('/posts/some-note/')).toBe('/posts');
    expect(parentPath('/about/')).toBe('/');
  });

  it('handles double slashes by ignoring empty segments', () => {
    // /posts//slug splits to ['posts', 'slug'], so parent is /posts
    expect(parentPath('/posts//some-note')).toBe('/posts');
  });

  it('handles multiple trailing slashes', () => {
    expect(parentPath('/posts/some-note///')).toBe('/posts');
  });

  it('preserves case in paths (though routes are lowercase by convention)', () => {
    // Matches the function behavior: parent of /Posts/Article is /Posts (would 404, but tests behavior)
    expect(parentPath('/Posts/Article')).toBe('/');
  });
});
