/**
 * Adds COPY to the header row of every code block (built by hast-code-titles).
 *
 * Injected rather than rendered at build time on purpose: the button only does
 * anything with a working Clipboard API, so a reader without one gets no
 * control instead of a dead one.
 *
 * The copied text comes from `textContent`, which is exactly the source. Shiki
 * separates its line spans with real newline text nodes, and the `+`/`-` diff
 * markers are CSS `::before` content, so they stay out of the clipboard.
 */
import { showCopied } from './copied-state';

const IDLE = 'Copy';

function attach(figure: HTMLElement): void {
  const header = figure.querySelector('.code-header');
  const code = figure.querySelector('pre code');
  if (!header || !code) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-copy';
  button.textContent = IDLE;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
    } catch {
      // The permission can be refused even in a secure context. Say so and put
      // the listing under a selection, so the reader's own shortcut finishes it.
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      showCopied(button, IDLE, 'Copy failed', 'failed');
      return;
    }
    showCopied(button, IDLE, 'Copied', 'copied');
  });

  header.append(button);
}

// Typed as always present, but absent for real outside a secure context.
if (navigator.clipboard) {
  for (const figure of document.querySelectorAll<HTMLElement>('figure.code-figure')) attach(figure);
}
