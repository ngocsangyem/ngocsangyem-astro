import {
  HOTKEYS_OFF,
  HOTKEYS_STORAGE_KEY,
  isTypingTarget,
  readEnabled,
  type PathNodeLike,
  resolveAction,
  shouldHandle,
} from '../lib/hotkeys';

/*
 * The registry is the markup: a key exists on a page exactly when some element
 * carries `data-hotkey`, and it is looked up at keydown time. Nothing has to
 * register, so script order can never drop a key.
 */

const root = document.documentElement;
const help = document.querySelector<HTMLDialogElement>('#hotkey-help');
const toggles = document.querySelectorAll<HTMLButtonElement>('[data-shortcuts-toggle]');

function readStored(): string | null {
  try {
    return localStorage.getItem(HOTKEYS_STORAGE_KEY);
  } catch {
    return null;
  }
}

let enabled = readEnabled(readStored());

/** Stamps the state everywhere it shows: hint visibility and every toggle. */
function render(): void {
  if (enabled) delete root.dataset.hotkeys;
  else root.dataset.hotkeys = HOTKEYS_OFF;

  for (const toggle of toggles) {
    toggle.setAttribute('aria-pressed', String(enabled));
    const state = toggle.querySelector('[data-shortcuts-state]');
    if (state) state.textContent = enabled ? 'On' : 'Off';
  }
}

function setEnabled(next: boolean): void {
  enabled = next;
  try {
    if (next) localStorage.removeItem(HOTKEYS_STORAGE_KEY);
    else localStorage.setItem(HOTKEYS_STORAGE_KEY, HOTKEYS_OFF);
  } catch {
    // Storage blocked: the choice holds for this page only.
  }
  render();
}

/** Elements carrying a key, in document order, skipping any marked hidden. */
function carriers(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-hotkey]:not([hidden])')];
}

/** Rebuilds the letter rows from what the current page actually carries. */
function fillHelp(): void {
  if (!help) return;
  help.querySelectorAll('[data-hotkey-row]').forEach((row) => row.remove());

  const rows: Record<'navigate' | 'actions', HTMLLIElement[]> = { navigate: [], actions: [] };
  // Keys a fixed row already lists alongside their alternates.
  const seen = new Set(
    [...help.querySelectorAll<HTMLElement>('[data-hotkey-static]')].map((row) => row.dataset.hotkeyStatic),
  );
  for (const el of carriers()) {
    const key = el.dataset.hotkey;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const row = document.createElement('li');
    row.dataset.hotkeyRow = '';
    const label = document.createElement('span');
    label.textContent = el.dataset.hotkeyLabel ?? el.textContent?.trim() ?? key;
    const kbd = document.createElement('kbd');
    kbd.textContent = key.toUpperCase();
    row.append(label, kbd);
    // Links go somewhere; everything else does something on this page.
    rows[el instanceof HTMLAnchorElement ? 'navigate' : 'actions'].push(row);
  }

  // Letter rows lead each group, ahead of the fixed rows already in markup.
  help.querySelector('[data-hotkey-rows="navigate"]')?.prepend(...rows.navigate);
  help.querySelector('[data-hotkey-rows="actions"]')?.prepend(...rows.actions);
}

function openHelp(): void {
  if (!help) return;
  fillHelp();
  help.showModal();
}

// State first, so a toggle is never shown with a stale aria-pressed.
render();
for (const toggle of toggles) {
  toggle.addEventListener('click', () => setEnabled(!enabled));
  toggle.hidden = false;
}

/** Picks up a choice made elsewhere: another tab, or this page restored by Back. */
function resync(): void {
  enabled = readEnabled(readStored());
  render();
}
window.addEventListener('storage', (event) => {
  if (event.key === HOTKEYS_STORAGE_KEY) resync();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) resync();
});

// Clicking the backdrop resolves to the dialog itself, never a child.
help?.addEventListener('click', (event) => {
  if (event.target === help) help.close();
});

document.addEventListener('keydown', (event) => {
  const context = {
    enabled,
    typing: isTypingTarget(event.composedPath() as PathNodeLike[]),
    dialogOpen: document.querySelector('dialog[open]') !== null,
  };
  if (!shouldHandle(event, context)) return;

  const registry = carriers().flatMap((el) => (el.dataset.hotkey ? [el.dataset.hotkey] : []));
  const action = resolveAction(event.key, registry);
  if (!action) return;

  event.preventDefault();
  if (action.type === 'help') {
    openHelp();
    return;
  }
  document.querySelector<HTMLElement>(`[data-hotkey="${action.key}"]:not([hidden])`)?.click();
});
