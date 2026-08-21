# Design — ngocsangyem blog (main · locked)

<!-- Locked design system — THE single rule file for this project.
     Decided 2026-08-21 via grilling interview (3 rounds, all branches closed).
     Base DNA: antfu.me (see ./design-antfu.md, reference-only).
     ./design.md (Astro Cactus DNA) is demoted to reference — only its
     Pagefind-modal search pattern carries over.
     Amend intentionally — this file is the rule. -->

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
}
[data-theme="dark"] {
  --color-paper:     #050505;   /* true near-black, not charcoal */
  --color-ink:       #bbbbbb;
  --color-ink-deep:  #dddddd;
  --color-ink-max:   #ffffff;
  --color-ink-light: #888888;
  /* --color-chip unchanged */
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
}
```

## Identity (own work — fills the slots antfu's excluded artwork left)
- **Personal mark** · hand-drawn "Sang" as an SVG path, stroke-animated on load (`stroke-dasharray`/`stroke-dashoffset` draw-in, `--ease-out`, ~1.2s, once per visit). v1 path is designed by Hallmark; swap for the author's real handwriting later — the slot + animation spec are the contract, the path is replaceable.
- **Ambient margin ornament** · **generative bamboo branch** — Hallmark-designed, greyscale ink at low opacity, drifting in the page margins *outside* the 65ch column. Supplies asymmetry without breaking the centred layout. Decorative only: `aria-hidden`, no pointer events, hidden when the viewport can't fit it beside the column.
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
- TOC · floats in the right margin outside the 65ch column on wide viewports (≥xl); collapses inline below the header on narrow ones.
- Code blocks · Shiki (Astro built-in), dual theme **`vitesse-light` / `vitesse-dark`** switched with `[data-theme]`.
- Horizontal rules · thin hairlines in muted ink, never heavy bars.

## Features
- Tags + tag pages · RSS (`@astrojs/rss`) · dark/light toggle (`[data-theme]`, respects `prefers-color-scheme`, persisted) · TOC.
- **Search · Pagefind, Cactus-pattern**: `pagefind --site dist` as a postbuild step; `@pagefind/default-ui` inside a modal dialog opened from the nav search icon and a `/` (or `Cmd+K`) shortcut. Style the UI with the tokens above — no Pagefind default chrome colours.
- No comments in v1. No analytics decided — add deliberately if ever.

## Motion stance
- No motion library, no ClientRouter — real MPA navigation.
- One reveal primitive: `slide-enter` — fade-up (translateY(10px)→0 + opacity), staggered 90ms per child block, applied to prose children on page enter (pure CSS animation).
- Mark draw-in (see ## Identity) is the only other entrance animation.
- Everything else: opacity/colour transitions at `--dur-fast`. Animate `transform` + `opacity` only — never `transition: all`.
- `prefers-reduced-motion` · slide-enter and mark draw-in collapse to a ≤150ms opacity crossfade.

## Notes (do NOT carry over from sources)
- antfu's signature artwork (the "af" logo, plum-branch art, Bad Script annotations) is excluded — our slots are filled by ## Identity instead. Never imitate the plum branch; the bamboo must read as its own work.
- Cactus DNA contributes ONLY the Pagefind-modal search pattern; its mono-everywhere type, chromatic accent hue-swap, and masthead-stack nav do not apply.
- Never ship sample/lorem copy — the home greeting is real first-person text.

## Exports
`tokens.css` (in this project) becomes the source of truth once a build exists.
It now exists at `src/styles/tokens.css` and carries the token values above
verbatim, with one sanctioned indirection: the font families reference the
Fonts-API variables (`--font-display: var(--font-inter), system-ui, sans-serif`)
so Astro's size-adjusted fallback faces stay in play.
For Tailwind v4 `@theme` or DTCG `tokens.json`, ask *"extend design-main.md
with exports"*.
