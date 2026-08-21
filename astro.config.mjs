import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { mdastReadingTime } from './src/lib/mdast-reading-time';
import { hastLinkChips } from './src/lib/hast-link-chips';

export default defineConfig({
  site: 'https://ngocsangyem.dev',
  // Pinned so canonical, RSS and sitemap URLs cannot disagree.
  trailingSlash: 'never',
  integrations: [mdx(), sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    processor: satteri({
      mdastPlugins: [mdastReadingTime],
      hastPlugins: [hastLinkChips],
    }),
    shikiConfig: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      // Emits both palettes as CSS vars so [data-theme] can switch them.
      defaultColor: false,
    },
  },
  fonts: [
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      name: 'DM Mono',
      cssVariable: '--font-dm-mono',
      provider: fontProviders.fontsource(),
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
    {
      name: 'Roboto Condensed',
      cssVariable: '--font-roboto-condensed',
      provider: fontProviders.fontsource(),
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
});
