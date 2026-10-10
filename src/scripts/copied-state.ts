/**
 * The confirmation every copy control shares: the label switches to its
 * result word for ~1.5s, then returns. The state is also stamped on
 * `data-state` for styling, and announced once through one polite live
 * region, so a screen reader hears "Copied" without the button's name
 * changing under focus being relied on.
 */

const HELD = 1500;

let region: HTMLElement | null = null;

function announce(message: string): void {
  if (!region) {
    region = document.createElement('div');
    region.className = 'visually-hidden';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  // Cleared first so the same word twice in a row is still announced.
  region.textContent = '';
  requestAnimationFrame(() => {
    if (region) region.textContent = message;
  });
}

const timers = new WeakMap<HTMLElement, number>();

export function showCopied(button: HTMLElement, idle: string, label: string, state: 'copied' | 'failed'): void {
  button.textContent = label;
  button.dataset.state = state;
  announce(label);
  clearTimeout(timers.get(button));
  timers.set(
    button,
    window.setTimeout(() => {
      button.textContent = idle;
      delete button.dataset.state;
    }, HELD),
  );
}
