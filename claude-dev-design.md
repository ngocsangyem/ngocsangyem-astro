# claude.dev — Animation Analysis & Design Guideline

Oct 10, 2026 · @Sang

## Scope and method

This document is based on the content and HTML structure of four claude.dev pages, read on October 10, 2026: [Home](https://claude.dev/), [Mods](https://claude.dev/mods/), [Terminal](https://claude.dev/terminal/) and the post [Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods/). The page reader could not load CSS, JS, images or video, so real durations, easing curves and fonts were not measured.

Each claim carries one of three labels:

- **\[Observed\]** — present directly in page content (text, labels, structure, meta).
- **\[Inferred\]** — not seen in motion, but the content makes it near certain (for example, a demo with a Play button implies playback).
- **\[Proposed\]** — a specific value set by this document to recreate the style. Verify in DevTools before treating it as the original spec.

The guideline (from Motion system onward) is a rule set for building in the claude.dev style, not an internal Anthropic spec.

## Core design principles

claude.dev is a blog designed like the product it writes about: Claude Code in the terminal. These five principles drive every other decision.

1. **The site is a warm terminal.** TUI grammar (prompts, hotkeys, ASCII glyphs, uppercase labels) sits on a cream #faf9f5 background instead of black. The result reads as developer-native but stays comfortable for long reading. \[Observed: theme-color #faf9f5, nav "\[H\]HOME", "TREE" table of contents with └, ░░░ progress bar\]
2. **The keyboard is first-class.** Every primary action has a hotkey, and the hotkey is printed in the UI, not hidden in a help page. \[Observed: "\[S\] SEARCH", "Press R to load more", "PRESS ↑ / ↓ TO SCROLL", hotkeys 1/2 in the Blast Radius demo\]
3. **Show first, explain second.** Features are introduced with a real or simulated working session, then the description and specs. \[Observed: every mod on the Mods page opens with a terminal demo and a Play button\]
4. **Text is the primary material.** Icons, thumbnails and decoration are cut to a minimum. Status, progress and video controls are written in words or glyphs. \[Observed: "PLAY MUTE 00:00 / 34:42 EXPAND", post list without thumbnails\]
5. **One structure, many surfaces.** The same content appears as a web page and as a shell; the same feature is demoed in Terminal and Desktop. \[Observed: /terminal/ recreates the home page; "Terminal / Desktop" tabs on each video in the post\]

## Animation analysis

Motion on claude.dev imitates how a terminal prints output: line by line, step by step, in discrete beats, instead of the smooth slides of a typical landing page. Animation almost always carries information (working, done, how full, which step), and rarely exists for decoration.

### Motion inventory

| Element | Page | Motion | Evidence |
| --- | --- | --- | --- |
| Simulated terminal demo | Mods | Scripted replay of a Claude Code session on Play | Play button observed; motion inferred |
| "Thinking" spinner | Mods, post videos | ✻ / · glyph with a verb and a time and token counter | Text observed; motion inferred |
| Pane beside the transcript | Mods (Blast Radius, Replay Theater) | Bordered frame appears, takes focus, closes on × or Cancel | Structure observed |
| Token Weather band | Mods, post (FIG B, FIG C) | Steps Clear → Showers → Storm, changing color and sparkline | Observed in captions describing the cycle |
| ASCII reading progress | Post | ░ characters fill with scroll percentage | "░░░ 00%" observed; filling inferred |
| TREE table of contents | Post | Highlights the section in view while scrolling | Inferred |
| Load more | Home, Terminal, post | Appends posts to the list (R key) | Button observed; reveal inferred |
| Topic filter tabs | Home, Terminal, post | Swaps the post list by topic | Tabs observed |
| Terminal / Desktop tabs | Post | Swaps the video between surfaces | Tabs observed |
| Video player | Home | Running timecode, Expand to enlarge | Controls observed |
| Dismissible notice | Terminal | Appears, then leaves on DISMISS | Observed |
| Clawd drifting through dots | OG image, possibly hero | Clawd drifts slowly across a dot grid | Only seen in the OG image alt text; on-page animation unconfirmed |

### Terminal demos on the Mods page

This is the most important animation on the site. Each demo is a Claude Code session rebuilt in HTML and text, not a video, so it stays crisp at any resolution and matches the page style exactly.

Every demo follows the same four-beat script:

1. **The user prompt** appears after the ❯ glyph.
2. **Tool calls** show collapsed, such as "Read 4 files" or "Ran 2 shell commands".
3. **The spinner** runs with a playful verb and a counter, such as "Cogitating… (11s · ↓ 322 tokens)".
4. **A completion line** summarizes the time, such as "✻ Churned for 2s · done 4:20 PM".

Details that make the demos feel real:

- Spinner verbs change between turns: Churned, Brewed, Baked, Cooked, Worked, Cogitating. This matches real Claude Code.
- The clock is consistent within a demo: Token Weather turns finish at 4:20, 4:21 and 4:22 PM.
- Durations match the work: reading 1 file takes 2s, reading 4 files takes 5s, waiting for the user's answer takes 52s.
- A fixed footer, "manual mode on · ← for agents", sits at the bottom of every demo like a real status bar.

### Script of each mod

**Token Weather.** Three file-reading turns in a row, each filling the context further. The band above the prompt moves from a light state to "☇ Storm 81% of context 161.1k / 200k", with a sparkline and "▲ +26.7k last turn". The demo ends on a "90% context used" warning. The motion here is a stepped state change, one color per step (yellow, cyan, blue, magenta, red per the post).

**Blast Radius.** The demo with a dramatic climax:

1. The user asks to run `rm -rf build`.
2. The first attempt is cancelled; Claude reports the build folder was not deleted.
3. The user asks again; the "Cogitating…" spinner runs.
4. A "⚠ Blast Radius · rm -rf" pane pops up, listing the 9 files (1.1 MB) that would be deleted.
5. Two choices, "1: Proceed 2: Cancel", with the line "Claude is waiting on your answer".

The "fail, retry, held with an explanation" rhythm tells the mod's value story without any descriptive copy.

**Replay Theater.** Five diff blocks appear in the transcript, then a "▶ Replay Theater step 5 of 5" pane opens with a "1 2 3 4 5" step strip and "\[ ◀ Prev \] \[ Next ▶ \] \[ Close \]" buttons. The main motion is stepping inside a fixed pane, not sliding pages.

**Next steps.** After Claude answers, three numbered suggestions appear above the prompt. The demo ends with suggestion 1 filled into the prompt box, showing the "press a digit, the prompt fills itself" flow.

### Motion on the post page

- **ASCII progress bar.** Instead of a thin colored bar at the top of the page, progress is drawn as a ░ string and a percentage. As it fills, it moves in character steps, not smoothly.
- **TREE table of contents.** Almost certainly uses scrollspy to highlight the section in view, consistent with the ↑ / ↓ hint.
- **Illustrative videos.** Videos are the only place with continuous motion. Each video has a FIG caption explaining what will happen; FIG B, for example, describes the band cycling through three forecasts.

### What claude.dev does not do

The page content shows no sign of these common effects: parallax, per-block fade-in on scroll, autoplay carousels, custom cursors, glitch or CRT effects. This restraint is part of the style: motion appears only to tell the product story or report status.

## Motion system

Root rule: anything that belongs to the terminal moves in steps (`steps()`, line-by-line reveal); anything that belongs to the web chrome moves briefly and smoothly. Every value below is \[Proposed\].

### Duration and easing tokens

| Token | Value | Used for |
| --- | --- | --- |
| `--motion-instant` | 0ms | Filter tab swap, band state change, checkbox toggle |
| `--motion-tick` | 20ms per character | Typing the prompt in a demo (about 50 characters per second) |
| `--motion-line` | 90ms | Delay between output lines in a sequential reveal |
| `--motion-fast` | 120ms | Hover, button press, link color change |
| `--motion-base` | 180ms | Pane open, Terminal / Desktop tab swap, notice enter |
| `--motion-slow` | 280ms | Notice exit, video expand |
| `--spinner-frame` | 110ms | Each frame of the spinner glyph |
| `--ease-ui` | cubic-bezier(0.2, 0, 0, 1) | Panes, notices, video |
| `--ease-term` | steps(1, end) | Blinking cursor, ASCII progress, line reveal |
| `--ease-linear` | linear | Timecode, video progress |

```css
:root {
  --motion-instant: 0ms;
  --motion-tick: 20ms;
  --motion-line: 90ms;
  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 280ms;
  --spinner-frame: 110ms;
  --ease-ui: cubic-bezier(0.2, 0, 0, 1);
  --ease-term: steps(1, end);
}

.pane[data-open] {
  animation: pane-in var(--motion-base) var(--ease-ui);
}
@keyframes pane-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}
```

### Motion rules

- **Small amplitude.** Move at most 4px, scale no more than 1.02, never rotate. Text inside a terminal frame is never distorted or slid.
- **Animate only `opacity` and `transform`.** Never animate width, height or large background colors, to avoid layout shift.
- **Every motion must answer a question:** what is happening, is it done, how much, which step. If it answers none, cut it.
- **No endless motion off screen.** Demos run only on Play or when entering the viewport, and pause when they leave it.

### Terminal demo script

A demo should follow this beat: type the prompt (at `--motion-tick`), pause 300ms, show the tool line, run the spinner for 0.8 to 2 seconds, reveal output line by line (at `--motion-line`), show the completion line, hold 2.5 seconds, then start the next turn.

- The spinner cycles back and forth through · ✢ ✳ ✶ ✻ ✽, with a random verb and a seconds and token counter.
- Displayed times ("Churned for 2s") must fit the work, and the clock must stay consistent within a demo.
- Long demos compress real time (a 52s wait can play in 3s) while still showing the real number.
- The climax (a pane popping up, a warning) is the only moment that uses `--motion-base` with smooth easing; everything else is stepped.

## Color

The cream background #faf9f5 is the only confirmed color \[Observed: meta theme-color\]. The rest of the palette is \[Proposed\], based on the familiar Anthropic brand colors, and should be re-measured in DevTools.

### Background and text

| Token | Hex | Role |
| --- | --- | --- |
| `--bg` | #faf9f5 | Page background (confirmed) |
| `--bg-raised` | #f0eee6 | Terminal frames, code blocks, cards |
| `--fg` | #141413 | Body text, headings |
| `--fg-muted` | #73726c | Dates, reading time, metadata labels |
| `--border` | #e3e1d8 | 1px dividers between blocks and list rows |
| `--accent` | #d97757 | Hovered link, selected item, "Try Claude Code" button |

### ANSI-style status colors

Status colors in demos and bands use terminal ANSI color names, not web green / red \[Observed: the post defines Clear yellow, Cloudy cyan, Showers blue, Storm magenta, Compact soon red\].

| Token | Role | Example on the site |
| --- | --- | --- |
| `--ansi-yellow` | Normal, safe | ☀ Clear; yellow border on Blast Radius in band mode |
| `--ansi-cyan` | Informational | ☁ Cloudy |
| `--ansi-blue` | Rising | ☂ Showers |
| `--ansi-magenta` | Warning | ☇ Storm; magenta border on Replay Theater |
| `--ansi-red` | Danger, action needed | ↯ Compact soon; removed diff lines |
| `--ansi-green` | Added | Added diff lines |

### Color rules

- Use the orange accent for one emphasis point per screen region. Never fill large blocks with it.
- ANSI colors appear only inside terminal frames or status bands, never on page chrome.
- Never use color as the only channel: always pair it with a glyph (☀ ☇ ↯) and a word (Clear, Storm).
- No gradients, no colored shadows. Layer with `--bg-raised` and 1px borders.

## Typography

Type splits into two roles: monospace for everything "machine" (labels, hotkeys, metadata, code, demos) and a readable face for long-form text. The real font names are unconfirmed; the role split is \[Inferred\] from labels that are always uppercase and use terminal notation.

### Font roles

| Role | Proposed font | Used for |
| --- | --- | --- |
| Mono | JetBrains Mono, IBM Plex Mono, fallback ui-monospace | Nav, filter tabs, uppercase labels, metadata, code, terminal demos |
| Body | A readable sans or serif (for example Inter, Source Serif), fallback system-ui | Post paragraphs, deks, mod descriptions |
| Display | Same family as body, heavier | Page H1, post titles |

### Type scale

| Token | Size / line-height | Used for |
| --- | --- | --- |
| `--text-display` | 48px / 1.05 | H1 "claude.dev", "mods" |
| `--text-h1` | 36px / 1.15 | Post titles |
| `--text-h2` | 13px uppercase mono / 1.4, letter-spacing 0.08em | Section headings in posts ("HOW A MOD WORKS") |
| `--text-body` | 17px / 1.65 | Post body text |
| `--text-ui` | 15px / 1.4 | Titles in the post list, mod descriptions |
| `--text-label` | 12px uppercase mono / 1.3, letter-spacing 0.06em | Nav, tabs, AUTHOR, HOOKS, LOAD MORE |
| `--text-code` | 14px mono / 1.55 | Code blocks, terminal demos |

### Type rules

- **Uppercase labels are always mono.** Examples on the site: AUTHOR, PUBLISHED, READING TIME, HOOKS, DRAWS, BUILT INTO CLAUDE CODE \[Observed\].
- **Section headings inside posts are small caps-style uppercase**, not large bold type. Examples: "HOW A MOD WORKS", "FOUR HABITS WORTH KEEPING" \[Observed\]. Hierarchy comes from whitespace and position, not size.
- **Page titles are lowercase**: "claude.dev", "mods" \[Observed\]. The contrast with uppercase labels sets the rhythm.
- **Numbers use tabular-nums** for dates, reading time, timecodes and percentages, so they do not jump as values change.
- **Only single-width glyphs inside mono areas** (☀ ☁ ☂ ☇ ↯ ❯ └ ░), never emoji, so columns stay aligned. The post gives mod authors exactly this advice.

## Layout, grid and spacing

Every page is a narrow, readable content column with very little decoration around it. Only the post page adds a navigation sidebar.

### Page structures

| Page | Top-to-bottom structure | Note |
| --- | --- | --- |
| Home | Header (Clawd logo, nav, CTA) → H1 + tagline → filter tabs + Search → Featured post → post list → Load more → Featured videos | No large hero image \[Observed\] |
| Mods | Header → H1 + description + 3 CTAs → mod blocks (demo + specs) → Built into Claude Code → From the community → Your mods | Every mod block uses one template \[Observed\] |
| Terminal | Header → a shell frame filling the content area: greeting, Featured posts, tabs, list, notice | Same content as Home, different form \[Observed\] |
| Post | Header → topic label, H1, dek, metadata grid → two columns: sidebar (TREE, progress, Share) and content → Related posts | Sidebar sticks while scrolling \[Inferred\] |

### Grid and sizes

- Post text column: about 68 characters per line max (about 680px at 17px) \[Proposed\].
- List and Mods columns: about 960px max \[Proposed\].
- Post sidebar: 220 to 240px, hidden or moved above the post below 1024px \[Proposed\].
- The header repeats two nav sets in the HTML, suggesting a desktop version and a mobile menu \[Observed: nav appears twice\].

### Spacing

Use a 4px-multiple scale \[Proposed\]: 4, 8, 12, 16, 24, 32, 48, 64, 96.

- Between post list rows: 12 to 16px, separated by a 1px border rather than large gaps.
- Above each H2 in a post: 64px, because headings are label-sized and whitespace must carry the hierarchy.
- Between mod blocks on the Mods page: 96px.
- No large radii: 0 to 4px for cards and terminal frames \[Proposed\].

## Components

The site uses a small component set reused across pages. Each component below has an \[Observed\] structure and \[Proposed\] usage rules.

| Component | Anatomy | States | Rules |
| --- | --- | --- | --- |
| Nav item | `[key]` + uppercase label, e.g. \[H\]HOME | Default, hover, current | Hotkey always visible; current item changes text color, no thick underline |
| Filter tab | Row of uppercase labels: ALL, AGENTS, ENGINEERING… | Default, selected | Swaps the list instantly, no sliding indicator |
| Post row | Date · title · reading time | Default, hover | No thumbnail; the whole row is a link; reading time has a full screen-reader version |
| Featured post | Featured label · title · author · topic · time | Default, hover | One per list |
| Load more button | LOAD MORE label + key hint (Press R / /posts) | Default, loading, exhausted | Loading shows a glyph spinner; hide when no posts remain |
| Terminal frame | Transcript, band above prompt, ❯ prompt, status footer | Idle, playing, finished | Clear Play button; pause when out of viewport |
| Pane | ANSI-colored border, title with a glyph (⚠, ▶), content, hotkeyed buttons | Open, focused, closed | Buttons carry digits: "1: Proceed", "2: Cancel" |
| Mod spec card | Title, one-sentence description, HOOKS, DRAWS, (BY, INSTALL), CTA | — | Same field order for every mod |
| Install command | INSTALL label + mono command + COPY | Default, copied | After copying, label reads COPIED for about 1.5s |
| Metadata grid | Uppercase label above, value below: AUTHOR, PUBLISHED, READING TIME | — | At most 4 columns |
| TREE table of contents | TREE heading, items prefixed with └ | Default, in view | In-view item changes color; avoid deep indentation |
| Reading progress | ░ string + two-digit percentage | Follows scroll | Lives in the sidebar, never over content |
| Share | X.com, LinkedIn, Email, Copy URL, Copy markdown | Default, copied | Always include Copy markdown pointing to the .md version |
| Figure | FIG A, B… label + italic caption | — | Captions describe what the viewer will see, not just a name |
| Media tabs | Terminal / Desktop | Selected | Keep the frame size fixed when switching |
| Code block | CODE label + language + Copy | Default, copied | Language label always visible |
| Video player | PLAY, MUTE, timecode, EXPAND in words | Paused, playing, muted | Text controls, no icons |
| Notice | Title, one sentence, DISMISS, READ MORE → | Shown, dismissed | Remember the dismissed state |

## Interaction and keyboard

Every primary action must work from the keyboard, and hotkeys must be visible in the UI.

### Hotkey map

| Key | Action | Source |
| --- | --- | --- |
| H | Go home | Observed |
| M | Mods page | Observed |
| D | Open Docs | Observed |
| T | Terminal page | Observed |
| C | Changelog (Terminal page) | Observed |
| S | Search | Observed |
| R | Load more posts | Observed |
| ↑ / ↓ | Scroll the post | Observed |
| 1, 2, 3… | Choose a pane button or demo suggestion | Observed in demos |
| /help, /posts | Commands on the Terminal page | Observed |
| Esc | Close pane, notice, search | Proposed |

### Rules

- **Single-letter hotkeys fire only when no input has focus**, and never with Ctrl, Alt or Cmd, so they do not steal browser shortcuts.
- **Print hotkeys in square brackets before the label** (\[H\]HOME) or as a hint sentence (Press R to load more).
- **On touch, hide key hints** but keep the labels; buttons stay tappable as usual.
- **The Terminal page is an alternate mode, not the default.** Everything there must also be reachable from the regular pages.
- **Never hijack scrolling.** ↑ / ↓ is only a hint for native scrolling.
- **Focus is always visible:** a 2px `--accent` outline offset by 2px.

## Microcopy and voice

UI copy is short and specific, written as one engineer talking to another. No marketing words.

- **Labels are short uppercase verbs or nouns:** LOAD MORE, WATCH MORE ON YOUTUBE ↗, SEE HOW IT WORKS →, SHARE YOUR MOD → \[Observed\].
- **Arrows signal destination:** → for links inside the site, ↗ for external links \[Observed\]. Links that open a new tab add "(opens in a new tab)" for screen readers \[Observed on the Terminal page\].
- **Feature descriptions are one sentence about what it does:** "Holds a risky shell command and shows what it would change, with Proceed and Cancel." \[Observed\]
- **Specs instead of adjectives:** HOOKS `tool.call`, `ui.render`; DRAWS "A pane beside the transcript" \[Observed\]. Never "powerful" or "seamless".
- **Figure captions narrate what happens:** FIG D "Blast Radius holds rm -rf build and lists the 9 files (1.1 MB) it would delete…" \[Observed\].
- **Demo data is plausible with a light touch of humor:** `forecast.py` returns "sunny" on odd days and "cloudy" on even days; the clock reads 4:20 PM \[Observed\]. Joke in the data, never in the labels.
- **Taglines are sentence case, not uppercase:** "Sharing tips, tricks, and POVs from Anthropic's developers." \[Observed\]
- **Group headings carry a count:** BUILT INTO CLAUDE CODE 3, FROM THE COMMUNITY 1 \[Observed\].

## Accessibility and reduced motion

claude.dev already gets several accessibility details right in its markup; the rest are mandatory rules when recreating the style.

### What the site already does

- Durations have two forms: a short visible one ("9 min", "34m 42s") and a full one for screen readers ("9 minutes", "34 minutes 42 seconds") \[Observed\].
- Alt text describes the real content of images; the Token Weather band image, for example, describes all three states, colors and token counts \[Observed\].
- The hook-chain diagram has an equivalent text version right beside it \[Observed\].
- Links that open a new tab say "(opens in a new tab)" \[Observed\].

### Mandatory rules

- **`prefers-reduced-motion: reduce`:** terminal demos show the final state immediately, with no typing and no spinner; panes and notices appear without movement; video never autoplays.
- **Hide decorative glyphs from screen readers:** └, ░, ❯ and ✻ get `aria-hidden="true"`. The ASCII progress bar needs `role="progressbar"` with `aria-valuenow`.
- **Terminal demos need a summary label:** an `aria-label` describing the demo, e.g. "Demo: Blast Radius holds rm -rf and lists the 9 files it would delete". Do not let screen readers read each line as it plays.
- **No `aria-live` on spinner frames;** announce once when the turn completes.
- **Single-letter hotkeys must be turn-off-able** or active only when focus is on the page, per WCAG 2.1.4.
- **Contrast:** `--fg-muted` on `--bg` must reach at least 4.5:1; ANSI yellow and cyan on a light background need darker shades than their dark-terminal versions to pass.

## Adoption checklist

- [ ] Re-measure the real palette, fonts and easing in DevTools and update the \[Proposed\] values
- [ ] Page background #faf9f5, dark text, exactly one accent color
- [ ] Every uppercase label uses the mono font; page titles are lowercase
- [ ] Every nav item shows its hotkey; hotkeys never fire while typing
- [ ] Post list without thumbnails, with date and reading time in tabular-nums
- [ ] Features introduced with a text-built terminal demo and a Play button
- [ ] Demos follow the beat: prompt → tool → spinner → output → completion line
- [ ] Animation uses only `opacity` / `transform`, moving at most 4px
- [ ] Terminal parts move in steps; UI parts use `--ease-ui` at 120 to 280ms
- [ ] A `prefers-reduced-motion` branch for demos, panes and video
- [ ] Decorative glyphs are `aria-hidden`; demos have a summary `aria-label`
- [ ] Posts have TREE, ASCII progress, and Share with Copy markdown
- [ ] Figures carry a FIG label and a caption that narrates what happens
- [ ] ANSI colors appear only inside terminal frames, always with a glyph and a word

## Sources

- [claude.dev — Home](https://claude.dev/)
- [claude.dev — Mods](https://claude.dev/mods/)
- [claude.dev — Terminal](https://claude.dev/terminal/)
- [Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods/)
