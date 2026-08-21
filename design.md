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
- Chrome · N9 edge-aligned minimal nav: transparent header, hand-drawn "Sang" mark top-left, right-aligned row of ≤4 text links (Posts · Projects · About) + search icon + theme toggle · footer: none — pages end with a "Find me on" social row (GitHub, LinkedIn) + DM Mono email line inside the prose column
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
  --color-paper:     #ffffff;
  --color-ink:       #555555;   /* body prose — never pure black on white */
  --color-ink-deep:  #222222;   /* headings, active nav */
  --color-ink-max:   #000000;   /* rare emphasis */
  --color-ink-light: #767676;   /* dates, read-times, inactive labels — contrast floor for muted text (amended 2026-08-21 from #888888: 4.54:1 on white meets AA; dark-mode value unchanged) */
  --color-chip:      #88888822; /* magic-link chip fill — works on both papers by design */
  --color-accent:    var(--color-ink-deep); /* NO chromatic accent — content carries colour */
  --color-focus:     var(--color-ink-deep);

  /* Semantic status hues — ADMONITIONS ONLY (added 2026-08-22 at the author's
     request). Content semantics, not a brand accent: chrome stays greyscale, so
     the neutral-accent axis above still holds. Each value sits in the same
     luminance band as the ink token it stands in for (5.2:1–6.4:1 on white), so
     an admonition gains hue without gaining weight. Only the label and the left
     hairline take the hue; body text stays --color-ink. */
  --color-note:      #2b6cb0;   /* 5.42:1 on white */
  --color-tip:       #2f7a55;   /* 5.20:1 */
  --color-important: #6b46c1;   /* 6.42:1 */
  --color-warning:   #8a5a00;   /* 5.93:1 */
  --color-caution:   #b03636;   /* 6.13:1 */
}
[data-theme="dark"] {
  --color-paper:     #050505;   /* true near-black, not charcoal */
  --color-ink:       #bbbbbb;
  --color-ink-deep:  #dddddd;
  --color-ink-max:   #ffffff;
  --color-ink-light: #888888;
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
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* grove sway only */
  --dur-fast: 150ms;  --dur-base: 240ms;

  --radius-chip: 4px;

  /* Luỹ tre ambient layer (added 2026-08-22). Opacity is the whole safety
     margin: the grove sits behind the page, so anything strong enough to
     notice while reading is too strong. Ink only — the grove takes no hue. */
  --grove-opacity:      0.075;
  --grove-opacity-back: 0.045;
  --grove-width:  17rem;                              /* margin each grove fills */
  --grove-clear:  calc(var(--prose-max-width) + 9rem); /* band kept clear of art */
  --grove-falloff: 7rem;                              /* mask fade into the band */
}
[data-theme="dark"] {
  /* Near-black paper swallows a light stroke, so the grove is lifted to hold
     the same apparent presence it has on white. */
  --grove-opacity:      0.11;
  --grove-opacity-back: 0.07;
}
```

## Identity (own work — fills the slots antfu's excluded artwork left)
- **Personal mark** · hand-drawn "Sang" as an SVG path, stroke-animated on load (`stroke-dasharray`/`stroke-dashoffset` draw-in, `--ease-out`, ~1.2s, once per visit). v1 path is designed by Hallmark; swap for the author's real handwriting later — the slot + animation spec are the contract, the path is replaceable.
- **Ambient layer · luỹ tre** (expanded 2026-08-22 from a static single-margin
  sprig at ≥100rem). A Vietnamese bamboo hedge: the dense picket planted at a
  village edge. Two groves, one per page margin, generated at build time from a
  seeded PRNG in `src/lib/grove.ts` and emitted as inline SVG — no client
  script, no measurement, no layout shift. Decorative in the strict sense:
  `aria-hidden`, inert to the pointer, and masked out of the reading column.
  - **What carries the read**, in order, and none of it is optional. *Verticality
    in numbers* — culms stand plumb and bow only across the top third (the
    deflection exponent is 3.4; at 2.4 the same curve reads as windswept grass,
    which is how the first pass failed). *Node rings* — ~10 per culm, internodes
    lengthening upward. *The arch*. *Small drooping lanceolate leaves* in fans of
    2–4 off the topmost nodes; oversized or rounded leaves read as plum, not
    bamboo. *Three depth planes* — stroke and opacity step back into haze.
  - **Motion** · `grove-rise`, a base-to-tip stroke draw, back plane first,
    every culm settled by ~8s; then `grove-sway` and a leaf `fan-lag`, bounded
    as the motion stance requires. Each culm's sway starts as its own draw ends,
    which both prevents a bend-before-it-exists pop and desynchronises the grove
    without a random negative delay.
  - **Column protection** · a horizontal `mask-image`, not a clip: the grove
    thins into the margin like haze. The clear band is derived from
    `--prose-max-width`, so it tracks the measure instead of guessing at
    breakpoints. Below 64rem the layer is `display: none`.
  - **Excluded on article pages.** There the margin is the TOC's, and a reading
    surface should hold still. The grove belongs to pages a reader passes
    through: home, `/posts`, `/projects`, `/about`, `/tags/*`, 404.
- Both stay neutral (ink greys) — identity comes from line quality, not colour.

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
- Two entrance animations besides it: the mark draw-in and the grove rise (both under ## Identity).
- **One ambient animation, and only one** (amended 2026-08-22 at the author's
  request, replacing "mark draw-in is the only other entrance animation"): the
  grove sway. It is the sole perpetual motion anywhere on the site and it is
  bounded so it reads as presence rather than movement — amplitude under 1°,
  period 13–22s, opacity ≤0.11, and strictly outside the reading column. Those
  four bounds are the licence; a perpetual animation that breaks any of them is
  not sanctioned by this clause. Nothing else on the site may loop.
- Everything else: opacity/colour transitions at `--dur-fast`. Animate `transform` + `opacity` only — never `transition: all`.
- `prefers-reduced-motion` · slide-enter and mark draw-in collapse to a ≤150ms opacity crossfade; the grove stops entirely — no rise, no sway, simply already present.

## Notes (do NOT carry over from sources)
- antfu's signature artwork (the "af" logo, plum-branch art, Bad Script annotations) is excluded — our slots are filled by ## Identity instead. Never imitate the plum branch; the bamboo must read as its own work.
  - What *was* taken from that source, deliberately and at technique level only
    (2026-08-22): an ambient art layer spanning the full page rather than a
    margin sprig; a slow draw measured in seconds, not milliseconds; and a
    stagger driven by a per-element custom property. The geometry, the motion
    values, and the plant are ours. A branch armature is the wrong silhouette
    for this site regardless — a luỹ tre is a picket, not a bough.
- Cactus DNA contributes ONLY the Pagefind-modal search pattern; its mono-everywhere type, chromatic accent hue-swap, and masthead-stack nav do not apply.
- Never ship sample/lorem copy — the home greeting is real first-person text.
- **Paper belongs on `html`, never on `body`.** The grove sits at `z-index: -1`
  inside the body, and a background on the body itself paints over it. This is a
  load-bearing constraint, not a style preference.

## Exports
`tokens.css` (in this project) becomes the source of truth once a build exists.
It now exists at `src/styles/tokens.css` and carries the token values above
verbatim, with one sanctioned indirection: the font families reference the
Fonts-API variables (`--font-display: var(--font-inter), system-ui, sans-serif`)
so Astro's size-adjusted fallback faces stay in play.
For Tailwind v4 `@theme` or DTCG `tokens.json`, ask *"extend design-main.md
with exports"*.
