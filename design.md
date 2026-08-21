# Design — ngocsangyem blog

<!-- Hallmark · studied: yes · DNA-source: url (+ browser vision pass)
     source-url: https://astro-cactus.chriswilliams.dev/ · extracted: 2026-08-21
     vision pass: 2026-08-21 (home light+dark, post detail) — rhythm verified
     STATUS: reference-only since 2026-08-21. The locked system is now
     ./design-main.md — Hallmark runs read that file, not this one. Only the
     Pagefind-modal search pattern from this DNA carries over. -->

Reference file (Astro Cactus DNA). Superseded by ./design-main.md.

## System
- Genre · editorial (personal blog / digital-garden voice)
- Macrostructure · Long Document (Catalogue/Index lean — date-indexed post lists in one centred ~48rem column)
- Theme · studied-DNA (source: astro-cactus.chriswilliams.dev)
- Axes · dual paper (light >85 / dark <30) / mono display / accent hue-swaps per theme (warm-red ↔ emerald)
- Type · single family, mono-only on purpose — system mono stack, no webfont. Hierarchy via size (2xl titles), weight (semibold), and colour — never via a second face.
- Chrome · compact masthead-stack nav (N1a/N6 hybrid, vision-verified): brand row on top (logo + wordmark in accent-2), link row directly beneath it separated by vertical hairline dividers; search trigger + theme toggle pinned right; oversized logo hangs into the left margin on ≥sm, greyscale-until-hover · Ft1 minimal footer (copyright left, text links right, hairline dividers)

## Rhythm (vision-verified)
- Density · medium-generous: one deep breath after the masthead (~7rem, `mb-28`), then even ~4rem gaps between sections (`mt-16`), airy 1rem-spaced list rows. Not luxury-sparse — a readable working rhythm.
- Heading-to-body · short mono heading + medium body (letter/index voice, never long declarative headlines).
- Asymmetry · centred symmetric column; the one asymmetric excursion is the post-page TOC floating in the right margin (≥xl), collapsible "▼ Table of Contents".
- Accent discipline (observed) · accent goes ONLY to: nav links, *linked* section titles (plain section titles stay ink), heading `#` anchor markers, and the tag `#links`. Everything else is greyscale ink.

## Provenance
Extracted from `https://astro-cactus.chriswilliams.dev/` on 2026-08-21 as a
public reference for the user's own blog. Authorization basis: source is the
demo of Astro Cactus, an MIT-licensed open-source theme (github.com/chrismwilliams/astro-cactus)
— reuse is explicitly licensed. Tokens are exact (extracted from source CSS).
Fonts are exact (system mono stack — the source loads no webfont). Rhythm is
vision-verified: 2026-08-21 browser pass over rendered pages (home in both
themes + post detail) — the usual URL-mode rhythm blind spot no longer applies.

## Tokens (canonical · `tokens.css` is the source of truth)
```css
:root {
  /* light (default) */
  --color-paper:      oklch(98.48% 0 0);
  --color-paper-2:    oklch(26.99% 0.0096 235.05 / 5%);  /* tinted note-cards: ink at 5% */
  --color-ink:        oklch(26.99% 0.0096 235.05);
  --color-ink-2:      oklch(44.6% 0.03 256.802);          /* muted — dates, footer */
  --color-rule:       oklch(92% 0.004 286.32);
  --color-accent:     oklch(55.27% 0.195 19.06);          /* warm red — nav, linked titles */
  --color-accent-ink: oklch(18.15% 0 0);                  /* headings */
  --color-link:       oklch(55.44% 0.0431 185.69);        /* teal — hover underline colour */
  --color-focus:      oklch(55.27% 0.195 19.06);
}
[data-theme="dark"] {
  --color-paper:      oklch(23.64% 0.0045 248);
  --color-paper-2:    oklch(83.54% 0 264 / 5%);
  --color-ink:        oklch(83.54% 0 264);
  --color-ink-2:      oklch(70.7% 0.022 261.325);
  --color-rule:       oklch(37% 0.013 285.805);
  --color-accent:     oklch(70.91% 0.1415 163.7);         /* emerald — the hue swap is the signature */
  --color-accent-ink: oklch(94.66% 0 0);
  --color-link:       oklch(70.44% 0.1133 349);           /* pink */
  --color-focus:      oklch(70.91% 0.1415 163.7);
}
:root {
  --font-display: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  --font-body:    var(--font-display);
  --font-mono:    var(--font-display);

  /* base size 0.875rem (14px); titles at --text-2xl semibold */
  /* 4-pt spacing scale, named: --space-3xs … --space-4xl. See tokens.css. */

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 180ms;  --dur-base: 240ms;  --dur-slow: 320ms;

  --radius-card: 6px;  --radius-pill: 9999px;  --radius-input: 6px;
}
```

## CTA voice
- No buttons. Actions are text links: underlined, `text-underline-offset: 2px`; hover thickens the underline to 2px and recolours it `--color-link`.
- Post rows · two-col grid: fixed-width muted mono date, then underlined title.
- Notes/asides · tinted card (`--color-paper-2`), `--radius-card`, compact padding.

## Article voice (vision-verified, post pages)
- Post header · title, then a muted meta row `date / N min read`, plus an optional "Updated: <date>" pill — accent-tinted fill (accent at ~10%), accent text, `--radius-pill`ish small radius.
- Tag row · small `#tag` links, underlined, muted until hover.
- Headings · prefixed with a `#` anchor marker in accent; heading text stays ink.
- Horizontal rules · dashed/dotted hairlines (`--color-rule`), never solid heavy bars.
- TOC · floats in the right margin outside the 48rem column on wide viewports; collapses inline below it.

## Motion stance
- Silent — no motion library, no scroll reveals. The only animation is the theme-toggle icon swap (scale + opacity) and search-modal appear.
- Animate `transform` and `opacity` only, named easings; reduced-motion fallback · ≤150 ms opacity crossfade.

## Notes (do NOT carry over from the source)
- `transition: all` on the theme-toggle icons — scope transitions to `transform, opacity`.
- Placeholder copy energy ("Hello World!", lorem titles) — the H5 Letter hero wants a real first-person greeting; never ship the sample text.

## Exports
`tokens.css` (in this project) is the source of truth once a build exists. For
Tailwind v4 `@theme`, DTCG `tokens.json`, or shadcn/ui CSS variables, ask
*"extend design.md with Tailwind exports"* — Hallmark will append them.
