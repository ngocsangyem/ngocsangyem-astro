import type { APIRoute, GetStaticPaths, ImageMetadata } from 'astro';
import { SITE } from '../../config/site';
import { toExportMarkdown } from '../../lib/markdown-export';
import { getPublishedPosts, postUrl, type Post } from '../../lib/posts';

/**
 * Every image colocated with a post, keyed by its path from the project root,
 * so a body's `./step-01.webp` can be mapped to the asset the build emitted.
 */
const assets = import.meta.glob<ImageMetadata>('/src/content/posts/**/*.{png,jpg,jpeg,webp,gif,avif,svg}', {
  eager: true,
  import: 'default',
});

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

function assetResolver(post: Post) {
  const dir = post.filePath ? `/${post.filePath.replace(/[^/]+$/, '')}` : null;
  return (path: string) => {
    if (!dir) return null;
    const key = new URL(path, `file://${dir}`).pathname;
    return assets[key]?.src ?? null;
  };
}

export const GET: APIRoute = ({ props }) => {
  const post = (props as { post: Post }).post;
  const markdown = toExportMarkdown({
    title: post.data.title,
    body: post.body ?? '',
    site: SITE.url,
    postUrl: `${SITE.url}${postUrl(post)}`,
    resolveAsset: assetResolver(post),
  });
  return new Response(markdown, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
