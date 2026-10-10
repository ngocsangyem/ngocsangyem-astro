import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import { satteri } from '@astrojs/markdown-satteri';
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from '@shikijs/transformers';
import { shikiCodeTitle } from './src/lib/shiki-code-title';
import { mdastReadingTime } from './src/lib/mdast-reading-time';
import { hastExternalLinks } from './src/lib/hast-external-links';
import { hastFigures } from './src/lib/hast-figures';
import { hastAdmonitions } from './src/lib/hast-admonitions';
import { hastCodeTitles } from './src/lib/hast-code-titles';
import { hastTaskLists } from './src/lib/hast-task-lists';
import { hastTables } from './src/lib/hast-tables';

export default defineConfig({
  site: 'https://ngocsangyem.dev',
  // Pinned so canonical, RSS and sitemap URLs cannot disagree.
  trailingSlash: 'never',
  // The whole per-page stylesheet is ~5KB gzipped, smaller than the cost of a
  // render-blocking request on a slow connection, so every page carries its
  // own CSS instead of fetching it.
  build: { inlineStylesheets: 'always' },
  // Markdown images carry no layout of their own, and without one Astro emits an
  // empty srcset. Setting it here is what makes every post image responsive.
  image: { layout: 'constrained' },
  integrations: [
    mdx(),
    sitemap(),
    // The include list is the site's icon inventory: only these ship, and a
    // typo'd name fails the build instead of rendering an empty box.
    icon({
      include: {
        lucide: ['sun', 'moon', 'chevron-right'],
      },
    }),
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    processor: satteri({
      mdastPlugins: [mdastReadingTime],
      // Figures last among the content plugins; it wraps image paragraphs in
      // place so Astro's own image marker, which runs after, still finds them.
      hastPlugins: [hastAdmonitions, hastCodeTitles, hastTaskLists, hastTables, hastExternalLinks, hastFigures],
    }),
    shikiConfig: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      // Emits both palettes as CSS vars so [data-theme] can switch them. A
      // CSS-variables theme was tried and dropped: it colours only keywords,
      // functions and strings, so code read as nearly monochrome.
      defaultColor: false,
      // All build-time: annotations become classes in the emitted HTML, so the
      // page ships no script for any of this.
      transformers: [
        shikiCodeTitle(),
        transformerMetaHighlight(),
        transformerMetaWordHighlight(),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff(),
        transformerNotationFocus(),
        transformerNotationErrorLevel(),
      ],
    },
  },
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.fontsource(),
      // 400 body, 500 titles and headings, 600 strong prose text. Bold
      // resolves to 600 by CSS font matching, so a 700 face never ships.
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      provider: fontProviders.fontsource(),
      // 400 labels, nav and code; 500 the uppercase mono H2.
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
});
