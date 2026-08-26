import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  // Both shapes, one level deep: a bare `slug.md`, or `slug/index.md` for a post
  // that colocates its images. The loader strips the trailing `/index`, so every
  // id stays a single slug segment either way, which is what the /posts/[id]
  // route and the design's /posts/[slug] contract require.
  loader: glob({ pattern: ['*.{md,mdx}', '*/index.{md,mdx}'], base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
    /** Suppresses the table of contents on a post that would otherwise get one. */
    toc: z.boolean().default(true),
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
    /**
     * Running order on the page, lowest first. The collection comes back sorted
     * by id, so neither the order of `projects.json` nor the category names
     * decide what leads — without this the top slot goes to whichever id or
     * heading happens to start with an early letter.
     */
    order: z.number().default(100),
  }),
});

export const collections = { posts, projects };
