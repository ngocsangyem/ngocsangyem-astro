type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

const toggle = document.getElementById('theme-toggle');

/** Names the theme a press switches to, not the one already showing. */
function syncLabel(theme: Theme): void {
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  toggle?.setAttribute('aria-label', label);
  // The icon has no visible text, so the tooltip is the mouse user's label.
  toggle?.setAttribute('title', label);
}

function apply(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Pagefind's UI reads its own attribute, so both must move together.
  root.dataset.pfTheme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Preference is session-only when storage is blocked.
  }
  syncLabel(theme);
}

syncLabel(currentTheme());
toggle?.addEventListener('click', () => {
  apply(currentTheme() === 'dark' ? 'light' : 'dark');
});
