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
  dialog.querySelector('pagefind-input')?.querySelector('input')?.focus();
}

trigger?.addEventListener('click', () => void open());

// Clicking the backdrop resolves to the dialog itself, never a child.
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

document.addEventListener('keydown', (event) => {
  if (dialog?.open) return;

  // composedPath rather than target: it reads correctly whether the focused
  // field is in the page or inside a custom element's shadow root, so this
  // keeps working if Pagefind ever moves its input there.
  const typing = event.composedPath().some((node) => {
    if (!(node instanceof HTMLElement)) return false;
    return (
      node.isContentEditable || node.tagName === 'INPUT' || node.tagName === 'TEXTAREA'
    );
  });
  if (typing) return;

  // Lowercased so Shift or Caps Lock does not defeat the shortcut.
  const shortcut =
    event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
  if (!shortcut) return;

  event.preventDefault();
  void open();
});
