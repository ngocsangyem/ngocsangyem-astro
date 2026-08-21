# Design — antfu.me DNA (reference)

<!-- Hallmark · studied: yes · DNA-source: url (+ browser vision pass)
     source-url: https://antfu.me/ · extracted: 2026-08-21
     NOTE: reference-only file. The project's locked system is ./design-main.md,
     which uses THIS DNA as its base (decided 2026-08-21) — read design-main.md
     for the rules; this file remains the extraction record. -->

## System
- Genre · editorial (personal site / letter voice)
- Macrostructure · Long Document, Letter-led (home = H5 Letter: name-only display heading + first-person prose; listing pages = Catalogue/Index with ghost-year numeral chapters)
- Theme · studied-DNA (source: antfu.me)
- Axes · dual paper (light >85 / dark <30) / neutral-grotesque display / accent NEUTRAL (chroma delegated to content)
- Type · one workhorse grotesque (source: Inter) for display + body — hierarchy by size and weight only; three tightly-scoped support faces: mono (source: DM Mono) for dates/email/code, condensed (source: Roboto Condensed) only inside link-chips, a handwriting face only for annotations
- Chrome · N9 edge-aligned minimal nav: transparent header, personal mark top-left, right-aligned row of ≤4 text links + icon links + theme toggle · footer: none — pages end with a "Find me on" social row + mono email line inside the prose column
- Column · single centred prose column, `--prose-max-width: 65ch`, `line-height: 1.75`

## Provenance
Extracted from `https://antfu.me/` on 2026-08-21. Attestation: (b) public
reference for the user's own blog. Site source is public (github.com/antfu/antfu.me,
MIT-licensed code) and widely forked with the author's blessing; this file is
DNA-only — signature artwork excluded (see ## Notes). Tokens are exact (source
CSS). Fonts are exact (source @font-face). Rhythm is vision-verified from
rendered screenshots (home light+dark, blog index, projects, post detail) —
the usual URL-mode rhythm blind spot does not apply.

## Tokens (canonical)
```css
:root {
  /* light (default) */
  --color-paper:     #ffffff;
  --color-ink:       #555555;   /* body prose — never pure black on white */
  --color-ink-deep:  #222222;   /* headings, active tab */
  --color-ink-max:   #000000;   /* rare emphasis */
  --color-ink-light: #888888;   /* dates, read-times, inactive labels */
  --color-chip:      #88888822; /* magic-link chip fill — translucent grey */
  --color-accent:    var(--color-ink-deep); /* NO chromatic accent — content carries colour */
  --color-focus:     var(--color-ink-deep);
}
[data-theme="dark"] {
  --color-paper:     #050505;   /* true near-black, not charcoal */
  --color-ink:       #bbbbbb;
  --color-ink-deep:  #dddddd;
  --color-ink-max:   #ffffff;
  --color-ink-light: #888888;
  /* --color-chip unchanged — #8882 works on both papers by design */
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

## Signature moves (structural — these travel)
- **Content-delegated colour.** Chrome is greyscale; all chroma comes from content — favicons inside link-chips, syntax tokens, red/blue inline annotations in posts. This is why the site reads calm yet colourful.
- **Magic-link chips.** Inline links in running prose rendered as small rounded chips: translucent grey fill, tiny brand favicon, condensed label, `translateY(3px)` optical alignment.
- **Ghost-year chapters.** Post lists grouped by year with a huge outlined numeral watermarked behind the first rows of each group.
- **Display-size tab strip** on listing pages: active tab in ink, inactive tabs pale grey, no underline/pill chrome.
- **Ambient margin ornament.** Decorative artwork drifts in the page margins outside the 65ch column — supplies asymmetry without breaking the centred layout. (Use YOUR OWN ornament — see Notes.)
- **Personal mark, not a logo-word.** A small hand-personal mark top-left instead of a wordmark.

## CTA voice
- No buttons anywhere. Actions are prose links (underlined) or magic-link chips.
- Hover language is opacity-step (op50 → op100) and underline, never scale/lift.

## Motion stance
- No motion library. One reveal primitive: `slide-enter` — fade-up (translateY(10px)→0 + opacity), staggered 90ms per child block, applied to prose children on page enter.
- Everything else: opacity/color transitions at 150ms. Animate transform + opacity only; reduced-motion collapses to ≤150ms opacity crossfade.

## Notes (do NOT carry over)
- **Signature artwork is excluded from this DNA**: the hand-drawn "af" stroke-animated logo, the generative plum-branch art, and the Bad Script handwritten annotations are Anthony Fu's personal identity. Keep the *slots* (personal mark, ambient margin ornament, annotation voice); fill them with your own work.
- One `transition: all` (scroll-to-top button) — scope to `transform, opacity`.
- Inactive-tab grey (~#bbb on white) sits below comfortable contrast — raise toward `--color-ink-light` minimum in any rebuild.

## Exports
Reference file — no tokens.css emitted. When building with this DNA, say
*"use the antfu DNA"* and Hallmark will generate `tokens.css` from ## Tokens.
