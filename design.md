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
- Chrome · N9 edge-aligned minimal nav: frosted-glass header — the same `--glass-bg` + `backdrop-filter` panel as the content container, `border-radius: 0.5rem`, a `0.5rem` gap above and below so header and content read as two cards rather than one seam — hand-drawn "Sang" mark top-left, right-aligned row of ≤4 text links (Posts · Projects · About) + search icon + theme toggle · footer: none — pages end with a "Find me on" social row (GitHub, LinkedIn) + DM Mono email line inside the prose column · one floating control: an icon-only back-to-top anchor in the bottom-right gutter, on the same glass, revealed by scrolling and never by script
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
  --color-paper:     #fafafa;   /* off-white (amended 2026-08-22 from #ffffff with the grove redesign: the grove's sage line art needs a paper a half-step off pure white to sit in, and running ink keeps AA with room to spare) */
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
  --color-paper:     #0d0d0d;   /* deep near-black (amended 2026-08-22 from #050505: lifted one step so the grove's moss haze has a value to read against) */
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
  --dur-fast: 150ms;  --dur-base: 240ms;

  --radius-chip: 4px;

  /* Luỹ tre ambient layer (redesigned 2026-08-22: full-width pen-and-ink
     line art on two canvases behind a frosted content container, replacing
     first the masked margin line-art and then the flat silhouettes). This is
     the ONE sanctioned exception to "chrome takes no hue", and it is scoped to
     the grove: a desaturated leaf-green a few points from grey, never a
     chromatic accent. Depth is two planes, each carrying its own alpha —
     `ink` is the drawing, `haze` is the same grove restated as wide soft
     strokes on a CSS-blurred canvas behind it. */
  --grove-ink:        rgba(58, 66, 54, 0.56);
  --grove-haze:       rgba(96, 112, 92, 0.42);
  --grove-haze-blur:  8px;
  /* The frosted content container over the grove: translucent paper + blur.
     Bamboo under the column melts into depth; text stays fully readable. */
  --glass-bg:   rgba(250, 250, 250, 0.6);
  --glass-blur: 12px;
}
[data-theme="dark"] {
  /* Moonlit sketch on near-black: the pen turns pale so the line still reads,
     while the mass behind it stays a deep moss. The only place in the site
     where the dark theme inverts a value instead of dimming it. */
  --grove-ink:  rgba(198, 216, 196, 0.5);
  --grove-haze: rgba(66, 104, 76, 0.46);
  --glass-bg:   rgba(13, 13, 13, 0.6);
}
```

## Identity (own work — fills the slots antfu's excluded artwork left)
- **Personal mark** · hand-drawn "Sang" as an SVG path, stroke-animated on load (`stroke-dasharray`/`stroke-dashoffset` draw-in, `--ease-out`, ~1.2s, once per visit). v1 path is designed by Hallmark; swap for the author's real handwriting later — the slot + animation spec are the contract, the path is replaceable.
- **Ambient layer · luỹ tre** (redesigned 2026-08-22; the masked margin
  line-art before it read as a wireframe mesh, and the flat silhouettes that
  replaced it read as wallpaper — a hedge has contours). A Vietnamese bamboo
  hedge: the dense picket planted at a village edge, drawn as **pen-and-ink
  line art** — every mark a stroked polyline of uniform weight, nothing
  filled — from a seeded PRNG in `src/lib/bamboo-lines.ts`, painted onto two
  canvases by `src/components/identity/BambooLines.astro`. Decorative in the
  strict sense: `aria-hidden` and inert to the pointer.
  - **Two planes, one grove, and the glass between them and the reading.** The
    grove spans the FULL viewport width, reading column included. Behind
    everything sits `.bamboo` at `z-index: -1`, holding `canvas.bamboo-haze`
    (the same grove restated as wide soft strokes, blurred in CSS by
    `--grove-haze-blur`, overhanging the frame by `HAZE_PAD` so the blur never
    fades into a vignette) and `canvas.bamboo-ink` (the drawing). Over them the
    content container wears frosted glass (`.page-glass`: translucent
    `--glass-bg` + `backdrop-filter: blur(--glass-blur)`, `z-index: 2`), so
    bamboo passing under the text blurs into depth while staying 100% readable,
    and the culms in the margins render crisp. No mask, no keep-out band, no
    viewport cutoff: the layer works at every width because the glass, not
    geometry, protects the reading. The header and the back-to-top anchor wear
    the same glass, and unlike `.page-glass` they carry it on every page:
    `--glass-bg` is the paper colour at 0.6 alpha, so where no grove renders it
    composites to bare paper and the blur has nothing to act on, which makes a
    per-page condition pointless for them.
  - **What carries the read.** None of it is optional.
    1. *A culm is a tube, not a line* — its two outlines walked along one
       centreline at ±half-diameter, front plane 2.4–3.3% of the drawing unit
       across, tapering by a third toward the tip.
    2. *The node is drawn* — two lines across the culm about 5px apart,
       overshooting the tube by a sixth, with a local swelling in the diameter
       carrying the ring between them. **The collar is the joint**; a plain gap
       reads as a break in the pen stroke at this weight.
    3. *Internode spacing is "slow-fast-slow"* — short at the foot, longest a
       little past mid-culm, **shortest of all at the tip**. Spacing that
       simply widens upward is the most common way a drawing of bamboo goes
       wrong.
    4. *Culms stand plumb and lean as one* — a steady splay away from the
       middle of the frame, so the grove fans; plus a whisper of bow. Never a
       wobble.
    5. *Leaves are narrow lanceolate blades with a midrib*, strung along a twig
       that arcs out of a node concave-down — steep as it leaves the culm,
       flattening as it reaches. Blades lift toward the sky before fanning
       either side of the twig: left to follow the tangent they hang sideways
       and read as willow. Oversized or rounded blades read as plum.
    6. *Size answers to the narrow side of the frame*, length to the height.
       `drawingUnit()` is `min(height, width × 0.78)` — scale girth off the
       height alone and a phone gets a 27px culm across a 375px screen.
    7. *Depth is two planes and opacity* — never a second colour and never a
       heavier outline. Most front-plane culms leave through the top of the
       frame: a hedge whose every tip is visible is a row of plants in pots.
  - **Motion is the page-load moment, then stillness.** Every culm rises out
    of its own foot as a **partial trace of its own outlines** — real
    elongation, not a scale transform, so the drawing never stretches — and
    each leaf cluster unfurls just after the tip clears its node. The whole
    grove settles inside a hard budget (`SETTLE_MS`, 1.9s), after which the
    canvases are painted once more and never again: no running loop, no idle
    CPU or GPU. Timing rides on the geometry as fractions of that budget, and
    every stroke's window is clamped to close inside its own stalk's — a mark
    still mid-draw when the grove settles would stay half-finished for good.
    The rate is **smoothstep, not ease-out**: a culm that shoots up and brakes
    reads as a UI transition, where growth is the slow part being long. With
    `prefers-reduced-motion` the hedge is simply already grown — the settled
    frame is exactly `t = 1`.
  - **Repaint, never redraw.** A theme flip repaints the settled frame in the
    new ink (the canvases read their own `color`, so tokens stay the single
    owner). A new frame re-cuts the canvases and paints settled, never replaying
    the entrance — and **re-cutting is not regrowing**: the geometry is rebuilt
    only on a change of width or a change of height too large to be browser
    chrome, because a phone's address bar moves the height on every scroll and a
    grove regrown each time would reshuffle under the reader's thumb. A
    height-only change just re-anchors the drawing at the floor, so the grove
    keeps its feet down and the top of the frame reveals a little more or less
    of it. Watched by a `ResizeObserver` on the layer (which catches chrome and
    scrollbars, neither of them window resizes) *and* a window `resize` listener
    (which catches a move to a display of a different pixel ratio, which
    resizes no box at all), both debounced into one idempotent handler.
  - **Marks are bucketed by pen weight** so a frame goes down in ~90 paths
    rather than ~6000 — which is also truer, since strokes inside one path
    composite once instead of stacking into a darker blot wherever a leaf
    crosses a culm. Measured cost: ~0.5ms a frame for both planes.
  - **Excluded on article pages.** There the margin is the TOC's, and a reading
    surface should hold still. The grove belongs to pages a reader passes
    through: home, `/posts`, `/projects`, `/about`, `/tags/*`, 404. The glass
    travels with the grove (`page-glass` is set only when the grove renders),
    both because it is meaningless over bare paper and because
    `backdrop-filter` makes the container a containing block for fixed
    descendants — article-page floats must not inherit that.
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
- **No perpetual motion anywhere** (amended 2026-08-22 with the grove
  redesign, retiring the sway clause): the grove's growth is an entrance
  animation with a hard 2-second budget, its canvases painted one last time
  when it ends, and after it the grove is a static
  background. Nothing on the site may loop.
- Everything else: opacity/colour transitions at `--dur-fast`. Animate `transform` + `opacity` only — never `transition: all`.
- `prefers-reduced-motion` · slide-enter and mark draw-in collapse to a ≤150ms opacity crossfade; the grove does not rise — it is painted once, already grown.

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

## References
Botanical sources behind the luỹ tre geometry (added 2026-08-22). The artwork is
our own generative work; these fixed its proportions and its growth order.
- Internode rhythm along the culm — short at the foot, longest mid-culm,
  shortest at the tip; an S-shaped cumulative curve, "slow-fast-slow":
  <https://link.springer.com/article/10.1007/s11676-012-0281-1> and
  <https://www.guaduabamboo.com/bamboo-culm-sections/> (Guadua angustifolia runs
  roughly 22cm at the base, 34–36cm through the middle, 14cm at the top).
- Culm diameter, wall thickness and taper, and how each varies with height:
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC11175016/> (Moso: 9.7–17.5m tall,
  5.1–17.2cm across, internodes 2.9–46.4cm).
- Growth: a shoot reaches full height *and* full diameter in one season by
  elongating internodes from the base upward, with up to ~40 elongating at once;
  it never thickens again, only lignifies. Culm sheaths protect the young shoot:
  <https://biologyinsights.com/what-is-a-bamboo-culm-anatomy-structure-and-growth/>
  and <https://www.sciencedirect.com/science/article/pii/S0926669023011937>.

## Exports
`tokens.css` (in this project) becomes the source of truth once a build exists.
It now exists at `src/styles/tokens.css` and carries the token values above
verbatim, with one sanctioned indirection: the font families reference the
Fonts-API variables (`--font-display: var(--font-inter), system-ui, sans-serif`)
so Astro's size-adjusted fallback faces stay in play.
For Tailwind v4 `@theme` or DTCG `tokens.json`, ask *"extend design-main.md
with exports"*.
