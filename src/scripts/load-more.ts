/**
 * Home page LOAD MORE: moves the next page of rows out of the server-rendered
 * <template> into the list. Synchronous, so there is no loading state.
 */
const PAGE_SIZE = 6;

const root = document.querySelector<HTMLElement>('[data-load-more-root]');
const list = root?.dataset.list ? document.getElementById(root.dataset.list) : null;
const template = root?.querySelector<HTMLTemplateElement>('[data-load-more-rows]');
const button = root?.querySelector<HTMLButtonElement>('[data-load-more]');
const hint = root?.querySelector<HTMLElement>('[data-load-more-hint]');

function setOffered(offered: boolean): void {
  if (button) button.hidden = !offered;
  if (hint) hint.hidden = !offered;
}

if (list && template && button && template.content.children.length > 0) {
  setOffered(true);
  button.addEventListener('click', () => {
    const batch = [...template.content.children].slice(0, PAGE_SIZE);
    list.append(...batch);
    // Keyboard and screen-reader users land on the first new post, not back
    // at the button they just pressed.
    batch[0]?.querySelector('a')?.focus();
    if (template.content.children.length === 0) setOffered(false);
  });
}
