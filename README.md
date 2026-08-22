# ngocsangyem.dev

Personal dev notes. Astro static build, no client-side framework, vanilla CSS and
TypeScript.

Every page runs three inline scripts of its own and no more: the blocking theme
init, the theme toggle, and search. Anything else that looks like behaviour is
resolved while the site builds. `npm run audit:dist` holds that line by asserting
the count exactly, allowing bundled scripts only from `/_astro/` and
`/pagefind/`, and failing on an iframe, an off-origin request, a framework
runtime or a missing local asset. The rule is enforced rather than documented.

The design system is locked by [`DESIGN.md`](./DESIGN.md); `src/styles/tokens.css`
is the emitted source of truth for its token values.

## What's here

- Posts at `/posts`, grouped by year, with tag pages at `/tags/[tag]` and a feed
  at `/rss.xml`.
- A projects grid at `/projects`, driven by `src/data/projects.json`.
- Full-text search over the built site, via Pagefind.
- Light and dark themes, taken from the OS and overridable, applied before first
  paint so the wrong paper never flashes.
- Markdown that does its work at build time: reading time, admonitions, code
  titles, line and word highlighting, diff and focus annotations, accessible task
  lists, scrollable tables, and favicon link chips.
- A handwritten "Sang" signature that draws itself once per visit, over a
  procedural bamboo grove.

## Project structure

```
src/
  components/
    base/         header, nav, head, theme toggle, social row, cd-up and to-top links
    identity/     the signature and the bamboo grove
    posts/        rows, meta, tag list, table of contents
    projects/     grid and item
    search/       the Pagefind modal
  content/posts/  the posts, flat
  data/           projects.json
  layouts/        BaseLayout, PostLayout
  lib/            build-time logic, with unit tests
  pages/          routes
  scripts/        the two client scripts: theme, search
  styles/         tokens, global, prose, shiki, animations
public/           favicons, robots.txt, OG image, _headers
scripts/          audit-dist.mjs
```

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
- Code fences take a `title="path/to/file.ts"` for a caption, a line range such
  as `{2,4-5}` to highlight lines, and comment markers for the rest:
  `// [!code ++]` and `// [!code --]` for a diff, `// [!code error]` or
  `// [!code warning]` for severity, `// [!code focus]` to dim everything else,
  and `// [!code word:term]` to mark a word. Prefer the comment form for words:
  the `/term/` meta form reads slashes as delimiters, so a `title` containing a
  path breaks it. All of it resolves at build time and ships no JavaScript.
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

## How it works

`src/lib/` holds the logic the build needs, kept out of the components so it can
be tested without rendering a page. The markdown pipeline runs on satteri:
`mdast-reading-time` counts words while the content is still a syntax tree, then
the hast plugins rewrite the emitted HTML for admonitions, code titles, task
lists, tables and link chips. Shiki highlights code with both palettes written
out as CSS variables, so switching theme recolours the page without
re-highlighting anything.

Two rules decide most of the arguments.

Nothing reaches a third-party origin. Fonts are self-hosted through Astro's font
provider, link-chip favicons are committed under `public/favicons/`, and the
content schema rejects a remote project icon instead of fetching it.

No framework runtime on content pages. Anything that can be resolved during the
build is resolved during the build, which is why the markdown features above are
plugins rather than components.

The back-to-top anchor follows the same rule at runtime: it is revealed by a
sticky rail that starts one viewport down, not by a scroll listener, because a
fourth inline script would break the count `audit:dist` asserts. If you ever need
to change how it appears, read the comment in `ToTopLink.astro` first. The two
offsets in it are load-bearing and a plausible-looking simplification stops it
sticking.

`DESIGN.md` is the locked design authority, and the comments in it record why
each value is what it is. Change `DESIGN.md` first when a token needs to move,
then `src/styles/tokens.css` to match.

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

## Working on it

Branch off `main`. CI runs the same four commands, in this order: `npx astro
check`, `npm run build`, `npm run audit:dist`, `npm test`. A push that fails any
of them fails the build, so it is cheaper to run them locally first.

To add an entry to `/projects`, append it to `src/data/projects.json`. `name`,
`description` and `category` are required. `url` has to be https, and `icon` has
to be a local `.svg` file name, because a remote one would break the
no-external-requests rule.

Bug reports and feature requests each have a form under
[`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE).

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

## License

The code is MIT licensed. See [`LICENSE`](./LICENSE).

The posts under `src/content/posts/` and the site's written copy are not covered
by that licence: they are Copyright 2026 Sang Nguyen, all rights reserved. Quote
them with attribution, but please do not republish them whole.
