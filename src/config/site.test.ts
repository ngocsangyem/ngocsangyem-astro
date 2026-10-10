import { describe, expect, it } from 'vitest';
import { SITE } from './site';

describe('site hotkeys', () => {
  // The keyboard layer resolves a key to the first element carrying it, so a
  // repeated letter would silently shadow one of the destinations.
  it('assigns every nav item and chrome control a distinct single letter', () => {
    const keys = [...SITE.nav.map((link) => link.key), ...Object.values(SITE.hotkeys)];

    for (const key of keys) expect(key).toMatch(/^[A-Z]$/);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
