import { HOTKEYS_OFF, isTypingTarget, type PathNodeLike } from '../lib/hotkeys';

const CSS_HREF = '/pagefind/pagefind-component-ui.css';
const JS_HREF = '/pagefind/pagefind-component-ui.js';

const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
const trigger = document.querySelector<HTMLButtonElement>('#search-open');
const statusEl = document.querySelector<HTMLElement>('[data-search-status]');
const ui = document.querySelector<HTMLElement>('[data-search-ui]');

let loading: Promise<void> | null = null;

/**
 * Loads Pagefind's own emitted bundle. This appends a script element rather
 * than using import(), because the bundler rewrites a dynamic import of a
 * runtime path into its preload helper and the built asset does not exist at
 * build time.
 */
function loadUi(): Promise<void> {
  loading ??= new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_HREF}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_HREF;
      document.head.append(link);
    }

    const existing = document.querySelector(`script[src="${JS_HREF}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = JS_HREF;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Pagefind UI failed to load')));
    document.head.append(script);
  })
    .then(async () => {
      // whenDefined never rejects, and the script's load event only means the
      // module was fetched. Without a deadline a bundle that throws internally
      // would leave the dialog on its loading state for good.
      await Promise.race([
        customElements.whenDefined('pagefind-input'),
        new Promise((_resolve, rejectUpgrade) =>
          setTimeout(() => rejectUpgrade(new Error('Pagefind UI did not register')), 8000),
        ),
      ]);
      statusEl?.setAttribute('hidden', '');
      ui?.removeAttribute('hidden');
    })
    .catch((error: unknown) => {
      // Drop the cached rejection so a later open can retry.
      loading = null;
      throw error;
    });
  return loading;
}

/**
 * Pagefind announces result counts through live regions it appends to
 * <body>. While the modal is open everything outside it is inert, so those
 * announcements would never be spoken. The regions are moved into the dialog
 * (Pagefind keeps its own references to them, so moving is safe). They may be
 * created lazily on the first search, hence the call on input as well.
 */
function adoptAnnouncer(): void {
  const announcer = document.querySelector('[data-pagefind-announcer]');
  if (dialog && announcer && announcer.parentElement !== dialog) dialog.append(announcer);
}

async function open(): Promise<void> {
  if (!dialog || dialog.open) return;
  dialog.showModal();

  // Dev renders an explanatory note instead of the UI: there is no index to
  // search until a build has run Pagefind.
  if (!ui) return;

  try {
    await loadUi();
  } catch {
    if (statusEl) {
      statusEl.removeAttribute('hidden');
      statusEl.textContent = 'Search could not load.';
    }
    return;
  }
  adoptAnnouncer();
  dialog.querySelector('pagefind-input')?.querySelector('input')?.focus();
}

dialog?.addEventListener('input', () => requestAnimationFrame(adoptAnnouncer));

trigger?.addEventListener('click', () => void open());

// Clicking the backdrop resolves to the dialog itself, never a child.
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

/*
 * Esc clears, then closes. Pagefind's input clears its own query on Esc but
 * does not cancel the key, so the native dialog would close on the same press.
 * Whether there was a query is read in the capture phase, before Pagefind
 * empties the field, and a press that had one does not close the dialog.
 */
let escapeHadQuery = false;
dialog?.addEventListener(
  'keydown',
  (event) => {
    if (event.key !== 'Escape') return;
    const input = dialog.querySelector<HTMLInputElement>('pagefind-input input');
    // Only a press in the field clears it; from a result link Pagefind clears
    // nothing, so that press must close. Esc that ends an IME composition is
    // the input method's, not ours.
    escapeHadQuery = event.target === input && !event.isComposing && Boolean(input?.value);
  },
  true,
);
dialog?.addEventListener('cancel', (event) => {
  if (escapeHadQuery) event.preventDefault();
  escapeHadQuery = false;
});
// A press that never reaches `cancel` must not leave the flag set for the next.
dialog?.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') escapeHadQuery = false;
});

document.addEventListener('keydown', (event) => {
  // Lowercased so Shift or Caps Lock does not defeat ⌘K.
  const commandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

  // ⌘K toggles: pressed again inside the palette, it closes it. It is always
  // the site's, so the browser's own Ctrl+K never fires on top of an overlay.
  if (commandK) event.preventDefault();
  if (commandK && dialog?.open) {
    dialog.close();
    return;
  }

  // Any modal, not only this one: the shortcut overlay owns the keyboard too.
  if (document.querySelector('dialog[open]')) return;

  if (isTypingTarget(event.composedPath() as PathNodeLike[])) return;

  // `/` is a single-character shortcut, so it obeys the reader's OFF switch
  // (WCAG 2.1.4); ⌘K carries a modifier and stays live. The letter `S` belongs
  // to the hotkey registry, which clicks the trigger.
  const bare = !event.ctrlKey && !event.altKey && !event.metaKey;
  const slash = bare && event.key === '/' && document.documentElement.dataset.hotkeys !== HOTKEYS_OFF;
  if (!slash && !commandK) return;

  event.preventDefault();
  void open();
});
