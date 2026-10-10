/**
 * Pure rules for the single-key shortcut layer. No DOM access beyond the
 * plain values passed in, so every decision here is unit-tested; the runtime
 * in scripts/hotkeys.ts only gathers those values and acts on the answer.
 */

/** The parts of a KeyboardEvent the rules read. */
export interface KeyEventLike {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  /** Auto-repeat from a held key; a shortcut fires once per press. */
  repeat?: boolean;
}

export interface HotkeyContext {
  /** False once the reader switches shortcuts off (WCAG 2.1.4). */
  enabled: boolean;
  /** Focus is in a field, so the key is text, not a command. */
  typing: boolean;
  /** A modal owns the keyboard while it is open. */
  dialogOpen: boolean;
}

export type HotkeyAction = { type: 'help' } | { type: 'activate'; key: string };

/** Storage key and the one value that turns shortcuts off. */
export const HOTKEYS_STORAGE_KEY = 'hotkeys';
export const HOTKEYS_OFF = 'off';

/**
 * A single Latin letter (lowercased, so Shift and Caps Lock do not defeat a
 * shortcut) or `?`. Read from `event.key`, so `?` works on any layout that
 * can type it, not only where it sits on Shift+/.
 */
export function normalizeKey(key: string): string | null {
  if (key === '?') return '?';
  return /^[a-z]$/i.test(key) ? key.toLowerCase() : null;
}

export function shouldHandle(event: KeyEventLike, ctx: HotkeyContext): boolean {
  if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return false;
  if (!ctx.enabled || ctx.typing || ctx.dialogOpen) return false;
  return normalizeKey(event.key) !== null;
}

/** `registry` is the lowercase letters the current page carries. */
export function resolveAction(key: string, registry: Iterable<string>): HotkeyAction | null {
  const normalized = normalizeKey(key);
  if (normalized === '?') return { type: 'help' };
  if (normalized === null) return null;
  return [...registry].includes(normalized) ? { type: 'activate', key: normalized } : null;
}

/**
 * The parts of an event-path node the typing check reads. Loose on purpose:
 * `composedPath()` also yields Document, Window and ShadowRoot, which carry
 * neither field and so never count as typing.
 */
export interface PathNodeLike {
  tagName?: string;
  isContentEditable?: boolean;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Reads `event.composedPath()` rather than the target, so a field inside a
 * custom element's shadow root (Pagefind's input) still counts as typing.
 */
export function isTypingTarget(path: readonly PathNodeLike[]): boolean {
  return path.some(
    (node) => node.isContentEditable === true || (node.tagName !== undefined && TYPING_TAGS.has(node.tagName)),
  );
}

/** Shortcuts are on by default; only an explicit `off` disables them. */
export function readEnabled(stored: string | null): boolean {
  return stored !== HOTKEYS_OFF;
}
