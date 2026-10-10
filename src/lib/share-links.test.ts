import { describe, expect, it } from 'vitest';
import { shareLinks } from './share-links';

describe('shareLinks', () => {
  const links = shareLinks({ url: 'https://ngocsangyem.dev/posts/a b', title: 'Closures & you?' });

  it('builds an X post intent with the title and URL encoded', () => {
    expect(links.x).toBe(
      'https://x.com/intent/post?text=Closures%20%26%20you%3F&url=https%3A%2F%2Fngocsangyem.dev%2Fposts%2Fa%20b',
    );
  });

  it('builds a LinkedIn share with the URL encoded', () => {
    expect(links.linkedin).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fngocsangyem.dev%2Fposts%2Fa%20b',
    );
  });

  it('builds a mailto with subject and body encoded', () => {
    expect(links.email).toBe(
      'mailto:?subject=Closures%20%26%20you%3F&body=https%3A%2F%2Fngocsangyem.dev%2Fposts%2Fa%20b',
    );
  });
});
