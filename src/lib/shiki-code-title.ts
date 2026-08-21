import type { ShikiTransformer } from 'shiki';

const TITLE = /(?:^|\s)title="([^"]+)"/;

/**
 * Copies a fence's `title="..."` onto the `<pre>` as a data attribute. Astro's
 * Shiki config is the only place with access to the raw meta string, so the
 * value is parked here and turned into a caption later in the hast pass.
 */
export function shikiCodeTitle(): ShikiTransformer {
  return {
    name: 'shiki-code-title',
    pre(node) {
      const raw = this.options.meta?.__raw;
      if (typeof raw !== 'string') return;

      const title = TITLE.exec(raw)?.[1];
      if (title) node.properties['data-code-title'] = title;
    },
  };
}
