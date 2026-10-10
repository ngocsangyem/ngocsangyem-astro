# Design — ngocsangyem blog (main · claude.dev system)

The antfu-derived "bamboo paper" system that this file used to lock was retired
on 2026-10-10. The site now follows the claude.dev "warm terminal" system:
values in this file are measured off claude.dev and re-solved for AA where the
measured value missed it. Motion and interaction detail live in
[`claude-dev-design.md`](./claude-dev-design.md); where that guideline marks a
value [Proposed], this file's measured value wins.

## Intent
Personal dev notes, written in English. One author, one voice. A blog designed
like a developer tool: terminal grammar (prompts, hotkeys, ASCII glyphs,
uppercase mono labels) on a cream page, comfortable for long reading. Built with
Astro as a true MPA — no client router, no framework runtime; every script is a
progressive enhancement.

## System
- Genre · editorial, set in a TUI register.
- Macrostructure · Long Document; home = index-first (greeting + recent posts), listing pages = dense date · title · reading-time rows.
- Theme · claude.dev, measured 2026-10-10 (light and dark).
- Axes · cream page (#faf9f5) / near-black dark (#141413) / one orange accent spent sparingly / ANSI status hues for content semantics.
- Type · **Inter** for titles, prose and values; **JetBrains Mono** for every label, nav item, hotkey, date, code and terminal glyph. Uppercase is mono only; page titles are lowercase. Self-hosted woff2, latin subset, plus a 4KB JetBrains Mono symbol subset (see Tokens).
- Chrome · header with hotkey-printed nav (`[P]POSTS` …), a footer, no glass, no background artwork. Every surface is flat; depth comes from tone steps (`bg` → `bg-raised` → `bg-panel`) and 1px lines.
- Column · `--page-max-width: 80rem` for chrome and index pages; `--prose-max-width: 41rem` (≈68ch at 18px) for reading.

## Content model
- **One writing collection: `posts`** — title + date + tags is enough frontmatter.
- Collections: `posts`, `projects` (data collection), plus an `about` page.
- URLs · `/posts/[slug]`, `/posts`, `/projects`, `/portfolio`, `/about`, `/tags`, `/tags/[tag]`.
- Format · MDX for all content (plain Markdown still works).
- Home · one centred column: greeting, profile links, a featured post, recent posts with LOAD MORE, link to `/posts` for the rest. H1 stays "Hello World!". No topic tabs — home is the author's introduction and deliberately does not copy claude.dev's index layout; tabs belong to the archive.
- `/posts` · rows of mono date · sans title · mono reading time, 1px separators, no thumbnails, no summaries, grouped by year: a large outlined numeral (JetBrains Mono, 1px `--color-ink-3` stroke) with `N posts` in its own sticky column beside the rows from 48rem, above them below that. It never sits under text. Topic tabs swap the list with no sliding indicator.
- `/tags` · one centred column of ruled rows, most-used first: `#name` large, `N posts` right, newest post title beneath.
- Post page · one centred reading column, deliberately quieter than claude.dev (2026-10-11): topic line, H1, standfirst, one meta line (author · date · N min read). A small contents list sits in the right margin from 80rem, marked by a left rule on the section being read; below 80rem it is a disclosure under the hero. Tags and share links are one line each after the article. No side rail, no progress meter. Every post is also served as raw source at `/posts/<id>.md` for Copy markdown — MDX imports and components stay as written, since it is the source, not a rendering.
- `/portfolio` · wide editorial résumé on the same tokens; no second visual identity. The name keeps its large typographic setting (weight 500); the career route's travelled stroke is the accent, the rest muted ink.
- `/projects` · one centred column, grouped by category (`Developer tools 2`), each project a ruled row: small greyscale icon, name with ↗, one-line description.
- `/about` · the author's own heading and bio verbatim, in prose styles.
- 404 · a fixed terminal scene (`❯ cd ~/this-page` / `cd: no such page`), then Home, Posts and the search key.
- Social cards · `public/og-default.svg` is the single source (cream ground, ink title, accent rule, JetBrains Mono eyebrow, Inter 500 headline). Per-post cards substitute the title; `/og-default.png` is the template rasterised at build, so neither can drift from the artwork.

## Tokens (canonical source: `src/styles/tokens.css`)
Ratios are WCAG contrast against `--color-bg` unless noted.

| Role | Token | Light | Dark |
|---|---|---|---|
| Page | `--color-bg` | #faf9f5 | #141413 |
| Code, frames | `--color-bg-raised` | #f1efe8 | #1a1a18 |
| Panes, palette | `--color-bg-panel` | #ece9e0 | #1e1d1b |
| Headings, values | `--color-ink` | #141413 (17.5) | #faf9f5 (17.5) |
| Body prose | `--color-ink-2` | #4c4b45 (8.3) | #b0aea5 (8.3) |
| Labels, meta | `--color-ink-3` | #65645e (5.6; 4.9 on panel) | #87867f (5.0; 4.6 on panel) |
| Decorative glyphs only | `--color-ink-4` | #a8a69d | #5e5d59 |
| Dividers | `--color-line` | #14141338 | #faf9f529 |
| Row separators, code border | `--color-line-soft` | #1414131c | #faf9f517 |
| Row hover fill | `--color-hover-row` | #1414130d | #faf9f50b |
| Accent (non-text, large) | `--color-accent` | #c15f3c (4.0) | #d97757 (5.9) |
| Accent text, links | `--color-accent-text` | #a94e2f (5.2) | #d97757 (5.9) |
| Focus ring | `--color-focus` | = accent | = accent |
| ANSI blue / cyan / green | `--color-ansi-*` | #2a60d6 / #156f93 / #537126 (≈5.3; ≥4.6 on every surface) | #82aaff / #89ddff / #c3e88d |
| ANSI magenta / yellow / red | `--color-ansi-*` | #8c46bb / #7a5d00 / #a04545 (5.4–5.9) | #c792ea / #e5c07b / #e08f8f |
| Diff add / del (on own tint) | `--color-diff-*` | #356b35 (5.5) / #a04545 (5.2) | #9ac29a (8.3) / #c29a9a (6.8) |

Deviations from the measured values, all for AA:
- `--color-ink-3` light is #65645e, not the measured #7b7a72 (4.1:1) or #73726b (passes on bg, fails on raised/panel/hover).
- Light accent text is #a94e2f; the measured #c15f3c is 4.0:1 and is used only for non-text or large marks.
- Light diff-add is #356b35; the measured #3e7a3e reads 4.47:1 on its own tint.
- ANSI yellow and dark red are not measured on claude.dev; solved to ≥ 5.9:1 and 7.5:1.
- Light ANSI blue, cyan, green and magenta are a shade darker than measured so every text token holds ≥ 4.5:1 on bg, raised, panel and the hovered row in both themes (QA, 2026-10-11).

Type tokens: `--text-display` (lowercase page titles), `--text-h1` (post title, 500), `--text-body` 1.125rem / `--leading-body` 1.7, `--text-ui` 1rem, `--text-label` 0.8125rem with `--tracking-label` 0.02em, `--text-code` 0.8125rem / `--leading-code` 1.75, `--text-caption` 0.75rem.

Motion tokens: `--motion-instant` 0, `--motion-tick` 20ms, `--motion-line` 90ms, `--motion-fast` 120ms, `--motion-base` 180ms, `--motion-slow` 280ms, `--spinner-frame` 110ms; `--ease-out` cubic-bezier(.19,1,.22,1) and `--ease-swift` cubic-bezier(.55,0,.1,1) (both measured), `--ease-term` steps(1, end).

Fonts: the Fonts API owns `--font-inter` (400/500/600) and `--font-jetbrains-mono` (400/500); tokens reference them so Astro's size-adjusted fallbacks stay in play. Fontsource's latin subset has no terminal glyphs, so `public/fonts/jetbrains-mono-symbols.woff2` (subset of JetBrains Mono 2.211, OFL, licence kept in its name table) is registered as `JetBrains Mono Symbols`, listed first in `--font-mono`, and scoped by `unicode-range` to exactly its cmap: arrows, box drawing, blocks, geometric shapes, ❮❯, ⚠. The spinner dingbats ✻ ✢ ✳ ✶ ✽, ※, ↯ and ✓ do not exist in JetBrains Mono and fall back to the system font, so anything that animates through them must sit in a fixed-width cell.

## CSS authoring rules

- **Default to logical properties for layout that follows document flow.** Use
  `margin-block`/`margin-inline`, `padding-block`/`padding-inline`, logical
  borders, `inset-*`, `inline-size`/`block-size`, and start/end alignment in
  preference to top/right/bottom/left or width/height equivalents. This keeps
  the layout correct for right-to-left and alternate writing modes.
- Keep a physical property only when the geometry is deliberately physical,
  such as a viewport-bound effect, an intrinsically square asset, a clipping
  technique, or a visual animation. Add a brief nearby comment when that
  distinction is not self-evident.
- **Use CSS custom properties for design values that recur or vary by theme or
  component state.** Name them by role, not their literal value; reuse an
  existing token before adding one. Keep canonical colours, typography, motion,
  and container widths in `src/styles/tokens.css`; keep gutters and the spacing
  scale in `src/styles/global.css`; scope component-only variables to that
  component.
- Do not create a token for a one-off value or use variables to obscure a value
  whose meaning is clearer inline. Tokens express stable design roles, not a
  complete inventory of numbers.
- Radius is 0 everywhere; edges are drawn by 1px lines and tone steps.
- `--color-ink-4` never carries information on its own: it is for `aria-hidden` glyphs, never for hotkey letters, labels or meta.
- Dates, reading times and percentages use `tabular-nums` (`time`, `.num`).

## Identity
- **Personal mark** · hand-drawn "Sang" SVG path, stroke-drawn once per visit (`draw-in`, `--ease-out`). The path is replaceable; the slot and animation are the contract.
- The mark stays in ink; identity comes from line quality, not colour.

## Signature moves
- **Hotkeys printed in the UI** · every nav item shows its key (`[P]POSTS`, `[O]`, `[F]`, `[A]`, plus `H`, `S`, `R`, `?`); keys never fire while typing or with a modifier, and can be switched off from a visible toggle.
- **Mono labels over sans values** · uppercase JetBrains Mono labels in `--color-ink-3` above Inter values in `--color-ink`.
- **Terminal glyphs, sparingly** · `↗` on external links, `※ ✓ ▲ ⚠ ↯` on admonitions, `❯` in terminal demos — never as chrome decoration.
- **Words, not icons, for controls** · COPY / COPIED, SHARE, PLAY.

## CTA voice
- No pill buttons. Actions are mono labels or underlined prose links; external links end in ↗.
- Hover is a colour step or a row fill (`--color-hover-row`) — never scale or lift.

## Article voice (post pages)
- Header · topic line (mono label, links to the tag), H1 (Inter 500), standfirst in `--color-ink-2`, one meta line, closed by a hairline.
- Prose · Inter 18px / 1.7 in `--color-ink-2`; H2 is uppercase JetBrains Mono 500.
- Code blocks · Shiki dual theme (`vitesse-light` / `vitesse-dark`), switched by `[data-theme]`. A CSS-variables theme mapped to the ANSI tokens was tried and dropped (2026-10-11): it colours only keywords, functions and strings, so code read as nearly monochrome. On `--color-bg-raised` with a `<lang> · <title> · COPY` header row; transformers for highlight / diff / focus / error levels at build time. Diff uses the diff tokens; error levels use the ANSI tokens.
- Admonitions · GitHub alert syntax, five types, each label and left hairline in its ANSI hue (note blue, tip green, important magenta, warning yellow, caution red); body text stays `--color-ink-2`.
- Figures · every block-level image becomes a figure lettered `FIG A`, `FIG B`… (then `AA`); the image title is the caption when present, and the alt text is never repeated visibly.
- External links end in a `↗` hidden from AT; internal links have none.

## Features
- Tags + tag pages · RSS · light/dark toggle (`[data-theme]`, respects `prefers-color-scheme`, persisted) · contents list.
- **Search · Pagefind**, framed as a command palette labelled Search with a `❯` prompt (`S`, `/`, `⌘K`; ⌘K again closes). Pagefind keeps the index, ranking and keyboard behaviour. Esc in the field clears the query, then closes; Esc anywhere else closes. Only articles are indexed: `data-pagefind-body` sits on the article, so listings, tag pages and the 404 never appear in results.
- **`<TerminalDemo>`** MDX component (`src/components/mdx/TerminalDemo.astro`): a scripted terminal session — `❯` prompt typed one character per tick, collapsed tool lines (`●`), a spinner (`· ✢ ✳ ✶ ✻ ✽` ping-pong at 110ms, verb + real seconds + tokens, wait compressed to 0.8–2s), output line by line, an optional bordered pane in an ANSI hue (the only smooth motion), and a completion line (`✻ Brewed for 52s · done 4:21 PM`). The server renders the finished session with each line stamped `data-at`; the player asks "what is visible at t?" each frame, so pause and replay are just a different t. Plays when half the frame is in view (`autoplay={false}` waits for PLAY), pauses off-screen and in a hidden tab, keeps a reader's own pause, and reserves the finished height. AT gets the label and the finished transcript as text, plus one "Demo finished"; the animated stage is hidden from it. Reduced motion: no player, finished session shown. Usage:

  ```mdx
  import TerminalDemo from '../../components/mdx/TerminalDemo.astro';
  <TerminalDemo label="Demo: …" caption="FIG A — …" footer="manual mode on"
    turns={[{ prompt: 'npm test', tools: ['Ran 1 shell command'], verb: 'Cogitating',
      seconds: 4, tokens: 312, output: ['✓ 41 passed'], done: '4:20 PM' }]} />
  ```
- No comments, no analytics, no newsletter.

## Motion stance
- No motion library, no ClientRouter — real MPA navigation with a browser-native view-transition fade on the outgoing page.
- Motion is a status signal. Only `opacity` and `transform` animate, travel never exceeds 4px, and terminal parts step (`--ease-term`) instead of easing.
- One reveal primitive: `reveal` (opacity + 4px rise, `--motion-base`, `--ease-out`) on page heroes via `[data-enter]`, at most three stages. Body content does not cascade in.
- The signature draw-in plays once per visit.
- **No perpetual motion** outside a playing terminal demo. The demo pauses off-screen, honours a user pause, and shows its final state under reduced motion.
- `prefers-reduced-motion` · reveals are instant (no crossfade), the demo shows its final frame, the view transition is off.

## Decisions (2026-10-10, confirmed with the author)
- **D1** Full re-skin to claude.dev (cream / near-black, orange accent, ANSI status set). The previous lock is retired.
- **D2** Applies to every page: home, posts, post detail, tags, search, hotkeys and `?`, projects, portfolio, about, 404, OG cards.
- **D3** An MDX `TerminalDemo` component, no `/terminal` page.
- **D4** Fonts are Inter + JetBrains Mono; DM Mono and Roboto Condensed are gone.
- **D5** The light/dark toggle stays, on the measured claude.dev palettes.
- **D6** The bamboo grove and the glass panel are removed from every page.
- **D7** Magic-link chips become plain links, with ↗ on external ones.

## Notes
- Never ship sample or lorem copy; existing copy (greeting, bio, home H1) is kept verbatim.
- **The page tone belongs on `html`, never on `body`**, so a short page and a full-height one are the same colour to the bottom of the viewport.
- Anthropic Sans / Mono are proprietary and are not used; Inter and JetBrains Mono stand in.

## Exports
`src/styles/tokens.css` is the source of truth and carries the token values
above verbatim, with one sanctioned indirection: the font families reference the
Fonts-API variables (`--font-sans: var(--font-inter), system-ui, sans-serif`) so
Astro's size-adjusted fallback faces stay in play.
