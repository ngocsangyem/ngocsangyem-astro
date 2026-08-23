# Design — ngocsangyem blog (main · locked)

## Intent
Personal dev notes, written in English. One author, one voice. Simple,
developer-friendly, calm. Built with Astro as a true MPA — no client router,
no framework runtime on content pages.

## System
- Genre · editorial (personal site / notes voice)
- Macrostructure · Long Document; home = index-first (1–2 line greeting + recent posts), listing pages = Catalogue/Index with ghost-year numeral chapters
- Theme · studied-DNA base: antfu.me (structure + tokens), with own identity filling the signature slots (see ## Identity)
- Axes · dual paper (light >85 / dark <30) / neutral-grotesque display / **accent NEUTRAL — chroma delegated to content** (favicons in link-chips, syntax tokens). This is the strongest signature; never add a chromatic accent.
- Type · one workhorse grotesque — **Inter** for display + body, hierarchy by size and weight only; **DM Mono** for dates, read-times, email, inline code labels; **Roboto Condensed** only inside link-chips. Self-hosted woff2, latin subset (content is English).
- Chrome · N9 edge-aligned minimal nav: a plain header on bare paper with a `0.5rem` gap above and below — hand-drawn "Sang" mark top-left, right-aligned row of ≤4 text links (Posts · Projects · About) + search icon + theme toggle · footer: none — pages end with a "Find me on" social row (GitHub, LinkedIn) + DM Mono email line inside the prose column · one floating control: an icon-only back-to-top anchor in the bottom-right gutter, on the same glass, revealed by scrolling and never by script, wearing a frosted `--glass-bg` panel because it is sticky and page text scrolls under it
- Column · single centred prose column, `--prose-max-width: 65ch`, `line-height: 1.75`

## Content model
- **One writing collection: `posts`** — the "notes" ARE the posts; no separate notes/TIL collection. Cheap to write: title + date + tags is enough frontmatter.
- Collections: `posts`, `projects` (data collection), plus an `about` page.
- URLs · collection-prefixed: `/posts/[slug]`, `/posts` (full index), `/projects`, `/about`, `/tags/[tag]`.
- Format · **MDX for all content** (plain-Markdown files still work unchanged; MDX keeps the door open for embedded demos/components).
- Home · greeting (real first-person, 1–2 lines — never sample copy) + recent posts list, link to `/posts` for the rest.
- `/posts` · rows grouped by year under ghost-year numerals; row = DM Mono muted date + title, opacity-step hover.
- `/projects` · antfu-style grid grouped by category: icon + name + one-line description, greyscale-until-hover.

## Tokens (canonical — emit as `tokens.css` when a build exists)
```css
:root {
  /* light (default) */
  /* Warm laid paper (amended 2026-08-22 from #fafafa):
     sampled off the reference artwork, which is drawn on a warm stock, not an
     off-white. Every ink below was re-solved against it to hold the contrast
     ratio it had on #fafafa, so the paper got warmer and nothing got harder to
     read. #ink-deep is the one that could not be held — 15.2:1 is unreachable on
     this paper (pure black gives 13.3:1) — and lands at 11.3:1, still far past
     AAA for headings. */
  --color-paper:     #d3cec4;   /* warm laid paper */
  --color-ink:       #3d3a35;   /* body prose, 7.2:1 (was 7.1:1 on #fafafa) */
  --color-ink-deep:  #1b1813;   /* headings, active nav, 11.3:1 */
  --color-ink-max:   #000000;   /* rare emphasis */
  --color-ink-light: #5c5853;   /* dates, read-times, inactive labels — 4.50:1. A shade darker than a faithful port would make it: the #767676 it came from was 4.54:1 on pure white but only 4.35:1 on #fafafa, so the "meets AA" note above it had quietly stopped being true. */
  --color-chip:      #88888822; /* magic-link chip fill — works on both papers by design */
  --color-accent:    var(--color-ink-deep); /* NO chromatic accent — content carries colour */
  --color-focus:     var(--color-ink-deep);

  /* Semantic status hues — ADMONITIONS ONLY (added 2026-08-22 at the author's
     request). Content semantics, not a brand accent: chrome stays greyscale, so
     the neutral-accent axis above still holds. Each value sits in the same
     luminance band as the ink token it stands in for (5.2:1–6.4:1 on white), so
     an admonition gains hue without gaining weight. Only the label and the left
     hairline take the hue; body text stays --color-ink. */
  --color-note:      #205183;   /* 5.22:1 on paper */
  --color-tip:       #235c40;   /* 5.01:1 */
  --color-important: #4d338b;   /* 6.20:1 */
  --color-warning:   #654200;   /* 5.74:1 */
  --color-caution:   #812828;   /* 5.91:1 */
}
[data-theme="dark"] {
  --color-paper:     #1a2023;   /* cool charcoal (amended 2026-08-22 from #0d0d0d: sampled off the reference's dark frame, which is a touch blue rather than neutral) */
  --color-ink:       #c8cbcb;   /* 10.1:1 (was 10.1:1 on #0d0d0d) */
  --color-ink-deep:  #edf0f0;   /* 14.4:1 */
  --color-ink-max:   #ffffff;
  --color-ink-light: #929595;   /* 5.5:1 */
  /* --color-chip unchanged */

  /* Lifted for the near-black paper; 8.6:1–10.6:1, matching dark ink's 10.6:1 */
  --color-note:      #8fbce6;
  --color-tip:       #87c9a6;
  --color-important: #bda6ee;
  --color-warning:   #dcae5e;
  --color-caution:   #e79191;
}
:root {
  --font-display: "Inter", system-ui, sans-serif;   /* same family as body */
  --font-body:    var(--font-display);
  --font-mono:    "DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-chip:    "Roboto Condensed", var(--font-body); /* link-chips ONLY */

  --prose-max-width: 65ch;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 150ms;  --dur-base: 240ms;

  --radius-chip: 4px;

  /* The frosted panel behind the sticky back-to-top control: paper at 0.6 plus a
     blur, so page text scrolling under the icon reads as depth. Each theme sets
     this to its own paper colour exactly, so the panel is invisible wherever
     nothing passes behind it. */
  --glass-bg:   rgba(211, 206, 196, 0.6);
  --glass-blur: 12px;
}
[data-theme="dark"] {
  --glass-bg:   rgba(26, 32, 35, 0.6);
}
```

## Identity (own work — fills the slots antfu's excluded artwork left)
- **Personal mark** · hand-drawn "Sang" as an SVG path, stroke-animated on load (`stroke-dasharray`/`stroke-dashoffset` draw-in, `--ease-out`, ~1.2s, once per visit). v1 path is designed by Hallmark; swap for the author's real handwriting later — the slot + animation spec are the contract, the path is replaceable.
- The mark stays neutral (ink greys) — identity comes from line quality, not colour.

## Signature moves (from antfu DNA — these travel)
- **Content-delegated colour** · chrome is greyscale; all chroma comes from content.
- **Magic-link chips** · inline links in running prose as small rounded chips: translucent grey fill (`--color-chip`), tiny brand favicon, condensed label (`--font-chip`), `translateY(3px)` optical alignment, `--radius-chip`.
- **Ghost-year chapters** · post lists grouped by year with a huge outlined numeral watermarked behind the first rows of each group.
- **Display-size tab strip** on listing pages when a page has sibling views: active in `--color-ink-deep`, inactive at `--color-ink-light` minimum (not paler), no underline/pill chrome.

## CTA voice
- No buttons anywhere. Actions are prose links (underlined) or magic-link chips.
- Hover language is opacity-step (op50 → op100) and underline — never scale/lift.

## Article voice (post pages)
- Header · title (Inter, size/weight hierarchy), then a muted DM Mono meta row `date · N min read`.
- Tags · small `#tag` links in the meta area, muted until hover; `/tags/[tag]` lists matching posts in the standard row style.
- TOC · floats in the right margin outside the 65ch column on wide viewports (≥xl); collapses inline below the header on narrow ones. **Optional per post** (`toc: false`) and, on wide viewports, **collapsed to a menu icon at rest**: the list fades in while the pointer is over the article or the icon, and on keyboard focus (amended 2026-08-22 at the author's request).
- Code blocks · Shiki (Astro built-in), dual theme **`vitesse-light` / `vitesse-dark`** switched with `[data-theme]`. Annotations come from `@shikijs/transformers` at build time (added 2026-08-22): a `title` caption, line highlighting, diff, focus, word marking, and error/warning levels. Diff and severity reuse the status tokens above; everything else tints with `--color-chip`. No client script: Expressive Code was evaluated and rejected because it ships a 2.5KB runtime that cannot be disabled on this setup.
- Horizontal rules · thin hairlines in muted ink, never heavy bars.
- Admonitions · GitHub alert syntax (`> [!NOTE]`), five types: note, tip, important, warning, caution. Type is carried by a small icon, a DM Mono uppercase label, and a left hairline, all in that type's semantic hue (see the status tokens). Body text stays `--color-ink`, so the hue marks the block without colouring the prose. This is the one sanctioned exception to the greyscale rule and is scoped to admonitions; chrome carries no hue.

## Features
- Tags + tag pages · RSS (`@astrojs/rss`) · dark/light toggle (`[data-theme]`, respects `prefers-color-scheme`, persisted) · TOC.
- **Search · Pagefind, Cactus-pattern**: `pagefind --site dist` as a postbuild step; `@pagefind/default-ui` inside a modal dialog opened from the nav search icon and a `/` (or `Cmd+K`) shortcut. Style the UI with the tokens above — no Pagefind default chrome colours.
- No comments in v1. No analytics decided — add deliberately if ever.

## Motion stance
- No motion library, no ClientRouter — real MPA navigation.
- One reveal primitive: `slide-enter` — fade-up (translateY(10px)→0 + opacity), staggered 90ms per child block, applied to prose children on page enter (pure CSS animation).
- One entrance animation besides it: the mark draw-in (under ## Identity).
- **No perpetual motion.** Everything with content in it holds still: no looping
  chrome, no drifting gradients, no breathing buttons.

  Amended three times on 2026-08-22 and settled on 2026-08-23. The clause was
  retired for the ambient grove, then reinstated for it alone on measurement,
  then made absolute again when the grove was removed from the site. It is now
  unconditional: nothing on the site loops. A future candidate would have to
  clear the bar the grove cleared — measured off a reference, imperceptible, and
  gated on tab visibility, viewport intersection and `prefers-reduced-motion` —
  and would be reopening a settled decision to do it.
- Everything else: opacity/colour transitions at `--dur-fast`. Animate `transform` + `opacity` only — never `transition: all`.
- `prefers-reduced-motion` · slide-enter and mark draw-in collapse to a ≤150ms opacity crossfade.

## Notes (do NOT carry over from sources)
- antfu's signature artwork (the "af" logo, plum-branch art, Bad Script annotations) is excluded — our slots are filled by ## Identity instead.
- Cactus DNA contributes ONLY the Pagefind-modal search pattern; its mono-everywhere type, chromatic accent hue-swap, and masthead-stack nav do not apply.
- Never ship sample/lorem copy — the home greeting is real first-person text.
- **Paper belongs on `html`, never on `body`**, so a short page and a full-height
  one are the same colour to the bottom of the viewport.

## Exports
`tokens.css` (in this project) becomes the source of truth once a build exists.
It now exists at `src/styles/tokens.css` and carries the token values above
verbatim, with one sanctioned indirection: the font families reference the
Fonts-API variables (`--font-display: var(--font-inter), system-ui, sans-serif`)
so Astro's size-adjusted fallback faces stay in play.
For Tailwind v4 `@theme` or DTCG `tokens.json`, ask *"extend design-main.md
with exports"*.
