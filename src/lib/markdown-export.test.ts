import { describe, expect, it } from 'vitest';
import { toExportMarkdown } from './markdown-export';

const base = { site: 'https://ngocsangyem.dev', postUrl: 'https://ngocsangyem.dev/posts/demo' };

describe('toExportMarkdown', () => {
  it('puts the title on top as an H1', () => {
    expect(toExportMarkdown({ ...base, title: 'Demo', body: 'Text.' })).toBe('# Demo\n\nText.\n');
  });

  it('resolves colocated images through the asset map', () => {
    const md = toExportMarkdown({
      ...base,
      title: 'T',
      body: '![Step](./step-01.webp)',
      resolveAsset: (path) => (path === './step-01.webp' ? '/_astro/step-01.abc.webp' : null),
    });
    expect(md).toContain('![Step](https://ngocsangyem.dev/_astro/step-01.abc.webp)');
  });

  it('makes root-relative targets absolute and keeps titles', () => {
    const md = toExportMarkdown({ ...base, title: 'T', body: '[Posts](/posts "All") ![Card](/og.png)' });
    expect(md).toContain('[Posts](https://ngocsangyem.dev/posts "All")');
    expect(md).toContain('![Card](https://ngocsangyem.dev/og.png)');
  });

  it('resolves other relative links against the post URL', () => {
    const md = toExportMarkdown({ ...base, title: 'T', body: '[next](../other)' });
    expect(md).toContain('[next](https://ngocsangyem.dev/posts/other)');
  });

  it('leaves absolute URLs, anchors and mail links alone', () => {
    const body = '[a](https://x.dev) [b](#part) [c](mailto:a@b.c)';
    expect(toExportMarkdown({ ...base, title: 'T', body })).toContain(body);
  });

  it('does not touch link-like text inside code', () => {
    const body = '```md\n[x](/y)\n```\n\nUse `[x](/y)` inline.';
    expect(toExportMarkdown({ ...base, title: 'T', body })).toContain(body);
  });
});
