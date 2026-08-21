import { describe, expect, it } from 'vitest';

// The real implementations, so a change in behaviour fails these tests. The
// plugin's tree rewriting is covered by the build-time checks instead.
import { externalHost as externalHostImpl, iconFor as iconForImpl } from './hast-link-chips';
import { SITE } from '../config/site';

const SITE_HOST = new URL(SITE.url).hostname;

const externalHost = externalHostImpl;
const iconFor = iconForImpl;

describe('hast-link-chips', () => {
  describe('externalHost', () => {
    it('extracts hostname from http URL', () => {
      expect(externalHost('http://example.com/page')).toBe('example.com');
    });

    it('extracts hostname from https URL', () => {
      expect(externalHost('https://example.com/page')).toBe('example.com');
    });

    it('preserves www prefix in hostname', () => {
      expect(externalHost('https://www.example.com/page')).toBe(
        'www.example.com',
      );
    });

    it('returns null for same-site URL', () => {
      expect(externalHost(`https://${SITE_HOST}/page`)).toBeNull();
    });

    it('returns null for non-HTTP URL', () => {
      expect(externalHost('/local/page')).toBeNull();
    });

    it('returns null for relative URL', () => {
      expect(externalHost('relative/page')).toBeNull();
    });

    it('returns null for invalid URL', () => {
      expect(externalHost('http://')).toBeNull();
    });

    it('returns null for mailto: URL', () => {
      expect(externalHost('mailto:user@example.com')).toBeNull();
    });
  });

  describe('iconFor', () => {
    it('returns the host if an icon exists', () => {
      const hosts = new Set(['github.com']);
      expect(iconFor('github.com', hosts)).toBe('github.com');
    });

    it('strips www prefix to find icon', () => {
      const hosts = new Set(['github.com']);
      expect(iconFor('www.github.com', hosts)).toBe('github.com');
    });

    it('uses exact host if icon exists before stripping www', () => {
      const hosts = new Set(['www.github.com', 'github.com']);
      expect(iconFor('www.github.com', hosts)).toBe('www.github.com');
    });

    it('returns null if no icon exists', () => {
      const hosts = new Set(['github.com']);
      expect(iconFor('example.com', hosts)).toBeNull();
    });

    it('returns null if only bare form exists and host has www', () => {
      const hosts = new Set(['example.com']);
      expect(iconFor('foo.example.com', hosts)).toBeNull();
    });

    it('returns null for empty host set', () => {
      const hosts = new Set<string>();
      expect(iconFor('github.com', hosts)).toBeNull();
    });
  });
});
