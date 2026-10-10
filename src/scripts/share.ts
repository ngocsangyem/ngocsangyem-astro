/**
 * Copy URL and Copy markdown in the share list. Both are shown only where the
 * Clipboard API exists; the plain share links work without this script.
 */
import { showCopied } from './copied-state';

async function fetchText(path: string): Promise<Blob> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return new Blob([await response.blob()], { type: 'text/plain' });
}

async function copyMarkdown(path: string): Promise<void> {
  // ClipboardItem takes a promise, which keeps the write inside the click's
  // user activation while the file is still being fetched (Safari requires
  // that); writeText after an await would be refused there.
  const blob = fetchText(path);
  // Handled here as well, so a write that throws before reading the promise
  // does not leave its rejection unhandled.
  blob.catch(() => {});
  if (typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
      return;
    } catch {
      // Some engines refuse a promised item; fall through to plain text.
    }
  }
  await navigator.clipboard.writeText(await (await blob).text());
}

if (navigator.clipboard) {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
    const idle = button.textContent?.trim() ?? '';
    const value = button.dataset.copyValue ?? '';
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        if (button.dataset.copy === 'markdown') await copyMarkdown(value);
        else await navigator.clipboard.writeText(value);
        showCopied(button, idle, 'Copied', 'copied');
      } catch {
        showCopied(button, idle, 'Copy failed', 'failed');
      }
    });
  }
}
