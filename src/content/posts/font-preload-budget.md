---
title: "Preloading every weight is not a font strategy"
date: 2026-08-21
tags: ["performance", "fonts"]
draft: true
---

Astro's Fonts API preloads the faces you declare, and I declared four Inter
weights plus two DM Mono weights because those are the ones the design uses. That
produced six `rel="preload"` tags, all competing for bandwidth during the initial
render.

Declared and needed-immediately are different questions. Only body text and
headings paint above the fold, which is Inter 400 and 600. The rest can load when
something on the page actually asks for them.

Still checking what this does to the layout shift numbers before I write the rest
of this up.
