import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../config/site';
import { getDescription, getPublishedPosts, postUrl, slugifyTag } from '../lib/posts';

export const GET: APIRoute = async (context) => {
  const posts = await getPublishedPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    // Matches the pinned trailingSlash: 'never', so feed links and canonical
    // URLs are the same string.
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      // The schema field is `date`; the feed field is `pubDate`.
      pubDate: post.data.date,
      description: getDescription(post),
      link: postUrl(post),
      // Slugified, so the feed agrees with the site's one-tag-per-slug model.
      categories: post.data.tags.map(slugifyTag).filter(Boolean),
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
};
