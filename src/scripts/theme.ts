type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
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
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  apply(currentTheme() === 'dark' ? 'light' : 'dark');
});
