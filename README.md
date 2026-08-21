# ngocsangyem.dev

Personal dev notes. Astro static build, no client-side framework, vanilla CSS and
TypeScript. The design system is locked by [`DESIGN.md`](./DESIGN.md);
`src/styles/tokens.css` is the emitted source of truth for its token values.

## Setup

Node is pinned. With nvm:

```sh
nvm use          # reads .nvmrc (22.22.0)
npm ci           # lockfile install; never plain `npm install` in CI or deploys
npm run dev      # http://localhost:4321
```

## Writing a post

Posts live **flat** in `src/content/posts/`. Sub-directories are deliberately not
routed, so that every post id stays a single URL segment.

```md
---
title: "A title in sentence case"
date: 2026-08-21
tags: ["astro", "css"]
description: "One sentence. Optional, but this is what RSS and social cards use."
draft: false
---

Body text. `.md` and `.mdx` both work; use `.mdx` only when you need a component.
```

Only `title` and `date` are required. Notes on the rest:

- `description` is optional. Without it, feeds and meta tags fall back to the
  first paragraph, then to the site description. Writing one is better.
- `tags` are matched case-insensitively, so `Astro` and `astro` are one tag.
- `draft: true` keeps a post out of every list, tag page, the feed, the sitemap
  and the search index. There is no scheduled publishing: a future `date`
  publishes immediately.
- `toc: false` suppresses the table of contents on a post that would otherwise
  get one. By default it appears whenever a post has two or more headings at
  depth 2 or 3, and is absent otherwise, so most posts need nothing here.
- Reading time is computed at build time. Nothing to fill in.
- External links in prose become link chips when `public/favicons/<hostname>.svg`
  exists. Add that file to opt a domain in; without it the link stays a plain
  underlined link, which is the intended fallback. A `www.` host also matches the
  bare domain's icon.
- Admonitions use GitHub alert syntax, so they render in the repository too:
  `> [!NOTE]` on its own line, then the body as further quote lines. The five
  types are NOTE, TIP, IMPORTANT, WARNING and CAUTION. A marker with no body, or
  an unknown type, stays an ordinary blockquote.

See `src/content/posts/markdown-fundamentals.mdx` for a page that exercises every
supported feature; it doubles as a rendering test.

## Search

Pagefind indexes the built site, so search does nothing in `npm run dev` (the dev
server says as much when you open it). To work on search:

```sh
npm run build && npm run preview
```

## Checks

```sh
npm run build        # astro build, then pagefind indexes dist/
npm run audit:dist   # no external requests, no framework runtime, index present
npm test             # unit tests for src/lib
npx astro check      # types
```

`npm run audit:dist` is the guard on this site's central promise: every script in
`dist/` is one of the four allowed ones (inline theme init, theme toggle, search,
Astro's prefetch), nothing reaches a third-party origin, and no referenced local
asset is missing. CI runs all four on every push.

## Deploy

Cloudflare Pages, static output, no adapter:

- Build command: `npm ci && npm run build`
- Output directory: `dist`
- Environment: `NODE_VERSION` = the value in `.nvmrc`

The build command chains Pagefind directly rather than relying on a `postbuild`
lifecycle hook, because some package managers skip those.

Changing the domain means changing `site` in `astro.config.mjs`. Canonical tags,
the feed, the sitemap and the OG image URL are all built from it, so rebuild and
re-check those four before deploying.

## Rollback

Fastest path, no rebuild: open the Cloudflare Pages project, find the last good
deployment, and use **Rollback to this deployment**.

To roll back the source as well:

```sh
git revert <bad-commit>
git push
```

That triggers a fresh deploy from the reverted tree. Prefer revert over a force
push, so the deployment history stays readable.
