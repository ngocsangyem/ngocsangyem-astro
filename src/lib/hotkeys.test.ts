import { describe, expect, it } from 'vitest';
import {
  isTypingTarget,
  normalizeKey,
  readEnabled,
  resolveAction,
  shouldHandle,
  type HotkeyContext,
  type KeyEventLike,
} from './hotkeys';

const ready: HotkeyContext = { enabled: true, typing: false, dialogOpen: false };

function key(value: string, mods: Partial<KeyEventLike> = {}): KeyEventLike {
  return { key: value, ctrlKey: false, altKey: false, metaKey: false, ...mods };
}

describe('normalizeKey', () => {
  it('lowercases letters so Shift and Caps Lock do not defeat a shortcut', () => {
    expect(normalizeKey('P')).toBe('p');
    expect(normalizeKey('p')).toBe('p');
  });

  it('keeps ? as itself', () => {
    expect(normalizeKey('?')).toBe('?');
  });

  it('rejects anything that is not a single letter or ?', () => {
    for (const value of ['Enter', 'Escape', '/', '1', ' ', 'ArrowDown', 'é']) {
      expect(normalizeKey(value)).toBeNull();
    }
  });
});

describe('shouldHandle', () => {
  it('handles a bare letter and ? when enabled', () => {
    expect(shouldHandle(key('p'), ready)).toBe(true);
    expect(shouldHandle(key('?'), ready)).toBe(true);
  });

  it('ignores any key held with Ctrl, Alt or Meta', () => {
    expect(shouldHandle(key('p', { ctrlKey: true }), ready)).toBe(false);
    expect(shouldHandle(key('p', { altKey: true }), ready)).toBe(false);
    expect(shouldHandle(key('p', { metaKey: true }), ready)).toBe(false);
  });

  it('handles an uppercase letter the same as its lowercase', () => {
    expect(shouldHandle(key('P'), ready)).toBe(true);
  });

  it('ignores ? held with a modifier, and ? while a dialog is open', () => {
    expect(shouldHandle(key('?', { metaKey: true }), ready)).toBe(false);
    expect(shouldHandle(key('?'), { ...ready, dialogOpen: true })).toBe(false);
  });

  it('fires once per press, ignoring auto-repeat from a held key', () => {
    expect(shouldHandle(key('r', { repeat: true }), ready)).toBe(false);
  });

  it('ignores keys typed into a field', () => {
    expect(shouldHandle(key('p'), { ...ready, typing: true })).toBe(false);
  });

  it('ignores keys while a dialog is open', () => {
    expect(shouldHandle(key('p'), { ...ready, dialogOpen: true })).toBe(false);
  });

  it('blocks letters and ? alike once shortcuts are switched off', () => {
    const off = { ...ready, enabled: false };
    expect(shouldHandle(key('p'), off)).toBe(false);
    expect(shouldHandle(key('?'), off)).toBe(false);
  });

  it('ignores keys that are not shortcuts at all', () => {
    expect(shouldHandle(key('Enter'), ready)).toBe(false);
  });
});

describe('resolveAction', () => {
  const registry = ['h', 'p', 's'];

  it('resolves ? to the help overlay', () => {
    expect(resolveAction('?', registry)).toEqual({ type: 'help' });
  });

  it('resolves a registered letter, whatever its case', () => {
    expect(resolveAction('P', registry)).toEqual({ type: 'activate', key: 'p' });
  });

  it('returns null for a letter nothing on the page carries', () => {
    expect(resolveAction('r', registry)).toBeNull();
  });

  it('returns null for a key that is not a shortcut', () => {
    expect(resolveAction('Enter', registry)).toBeNull();
  });
});

describe('isTypingTarget', () => {
  it('spots text fields and editable regions anywhere on the path', () => {
    expect(isTypingTarget([{ tagName: 'INPUT' }])).toBe(true);
    expect(isTypingTarget([{ tagName: 'TEXTAREA' }])).toBe(true);
    expect(isTypingTarget([{ tagName: 'SELECT' }])).toBe(true);
    expect(isTypingTarget([{ tagName: 'SPAN' }, { tagName: 'DIV', isContentEditable: true }])).toBe(true);
  });

  it('lets keys through from ordinary elements and non-elements', () => {
    expect(isTypingTarget([{ tagName: 'A' }, { tagName: 'BODY' }, {}])).toBe(false);
  });
});

describe('readEnabled', () => {
  it('is on unless the stored value says off', () => {
    expect(readEnabled(null)).toBe(true);
    expect(readEnabled('on')).toBe(true);
    expect(readEnabled('garbage')).toBe(true);
    expect(readEnabled('off')).toBe(false);
  });
});
