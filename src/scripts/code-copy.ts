/**
 * A copy control on every code block.
 *
 * Injected rather than rendered at build time on purpose: the button only does
 * anything with a working Clipboard API, so a reader without one gets no
 * control instead of a dead one.
 *
 * The copied text comes from `textContent`, which is exactly the source. Shiki
 * separates its line spans with real newline text nodes, and the `+`/`-` diff
 * markers are CSS `::before` content, so they stay out of the clipboard where
 * they belong.
 */

/** How long the confirmation holds before the label returns to rest. */
const HELD = 1600;

const IDLE = 'Copy';
const DONE = 'Copied';
const FAILED = 'Copy failed';

function attach(pre: HTMLPreElement) {
  const code = pre.querySelector('code');
  if (!code) return;

  // A titled block already has a bar above the listing, so the control belongs
  // in it. A bare block gets a wrapper, because `pre` is the scroll container
  // and anything positioned inside it slides away with the code.
  const figure = pre.closest('figure.code-figure');
  let host: HTMLElement;
  if (figure instanceof HTMLElement) {
    host = figure;
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.replaceWith(wrap);
    wrap.append(pre);
    host = wrap;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-copy';
  button.textContent = IDLE;

  let timer = 0;

  function hold(label: string, state: 'copied' | 'failed') {
    button.textContent = label;
    button.dataset.state = state;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      button.textContent = IDLE;
      delete button.dataset.state;
    }, HELD);
  }

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent ?? '');
    } catch {
      // The permission can be refused even in a secure context. Staying silent
      // here reads as a broken button, so say so and put the listing under a
      // selection: the reader's own copy shortcut then finishes the job.
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      hold(FAILED, 'failed');
      return;
    }
    hold(DONE, 'copied');
  });

  host.append(button);
}

// Typed as always present, but absent for real outside a secure context.
if (navigator.clipboard) {
  for (const pre of document.querySelectorAll<HTMLPreElement>('pre.astro-code')) {
    attach(pre);
  }
}
