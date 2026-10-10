import { describe, expect, it } from 'vitest';
import { markdownToHtml } from 'satteri';
import { externalHost, hastExternalLinks } from './hast-external-links';
import { SITE } from '../config/site';

const SITE_HOST = new URL(SITE.url).hostname;

describe('externalHost', () => {
  it('reads the host of an http(s) link to another site', () => {
    expect(externalHost('https://example.com/a')).toBe('example.com');
    expect(externalHost('http://www.example.com')).toBe('www.example.com');
  });

  it('is null for this site, relative links, anchors and other schemes', () => {
    expect(externalHost(`https://${SITE_HOST}/posts`)).toBeNull();
    expect(externalHost('/posts')).toBeNull();
    expect(externalHost('#top')).toBeNull();
    expect(externalHost('mailto:a@b.c')).toBeNull();
    expect(externalHost('https://')).toBeNull();
  });
});

describe('the rendered output', () => {
  const render = (markdown: string) => markdownToHtml(markdown, { hastPlugins: [hastExternalLinks] }).html;

  it('marks an external link with a hidden ↗ and safe rel', () => {
    const html = render('See [the spec](https://example.com/spec).\n');
    expect(html).toContain('<span class="ext" aria-hidden="true">↗</span>');
    expect(html).toMatch(/rel="[^"]*noopener[^"]*"/);
    expect(html).toMatch(/rel="[^"]*noreferrer[^"]*"/);
  });

  it('leaves internal and same-site links alone', () => {
    expect(render('[posts](/posts)\n')).not.toContain('↗');
    expect(render(`[home](https://${SITE_HOST}/)\n`)).not.toContain('↗');
  });

  it('does not mark a link that wraps an image', () => {
    expect(render('[![alt](/a.png)](https://example.com)\n')).not.toContain('↗');
  });

  it('adds no marker inside a heading, where it would leak into the outline', () => {
    expect(render('## See [MDN](https://developer.mozilla.org)\n')).not.toContain('↗');
  });

  it('keeps a rel the author already wrote', () => {
    const html = render('<a href="https://example.com" rel="me">me</a>\n');
    expect(html).toMatch(/rel="[^"]*\bme\b[^"]*"/);
  });
});
