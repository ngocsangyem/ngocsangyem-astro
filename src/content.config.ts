import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  // Flat and non-recursive: every id stays a single slug segment, which is what
  // the /posts/[id] route and the design's /posts/[slug] contract require.
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: file('src/data/projects.json'),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.url({ protocol: /^https$/ }).optional(),
    // Local file name only. A remote icon would break the no-external-requests
    // invariant, so the build rejects one.
    icon: z
      .string()
      .regex(/^[a-z0-9-]+\.svg$/, 'icon must be a local .svg file name')
      .optional(),
    category: z.string(),
  }),
});

export const collections = { posts, projects };
