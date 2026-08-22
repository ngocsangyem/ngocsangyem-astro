---
title: "Can a web page contain multiple header and footer elements?"
date: 2022-03-08
tags: ["html", "w3c", "semantics"]
description: "Yes to both. Header and footer are scoped to their nearest sectioning ancestor, and that scoping is what decides how many a page should hold."
---

Yes to both, and a page carrying several of each is ordinary markup. `<footer>`
represents a footer for its nearest ancestor sectioning element, and `<header>`
works the same way, so `<body>`, every `<article>` and every `<section>` can have
its own pair.

```html title="index.html" {2,7,14,17}
<body>
  <header>
    <a href="/">Cute Puppies Express</a>
  </header>

  <article>
    <header>
      <h2>Beagles</h2>
      <time datetime="2022-03-08">8 March 2022</time>
    </header>

    <p>Beagle ears are unreasonably soft.</p>

    <footer>Filed under dogs.</footer>
  </article>

  <footer>
    <small>Copyright 2022</small>
  </footer>
</body>
```

Four of them, all valid.

## What the spec restricts is nesting, not counting

There is no rule capping how many you write. The restriction is in the content
model. Neither element may contain a `<header>` or a `<footer>` descendant, and
neither may be a descendant of `<address>`. So this is invalid no matter how it
looks on screen:

```html
<header>
  <h1>Site</h1>
  <footer>A footer cannot be a descendant of a header.</footer>
</header>
```

## Where the count starts to matter

Placement decides the accessibility role, and that is the part worth getting
right. A `<header>` that sits outside sectioning content, `<main>`, and any
element with a matching ARIA role maps to the `banner` landmark. A `<footer>` in
that position maps to `contentinfo`. Nest either one inside `<article>`,
`<aside>`, `<main>`, `<nav>` or `<section>` and it drops to the `generic` role,
which means it stops being a landmark and can no longer take `aria-label` or
`aria-labelledby`.

That is where the folk advice about one of each per section comes from. Two
`<header>` elements placed directly in `<body>` announce two page banners to a
screen reader, which is a real problem. Two article headers announce none,
because neither one is a landmark to begin with.

> [!NOTE]
> `<footer>` is not sectioning content, so it never opens a new section in the
> document outline. It labels the section it already sits in.

Both elements have worked in every major browser since July 2015, so there is
nothing to feature-detect.

## Additional links

* [MDN: `<header>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/header)
* [MDN: `<footer>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/footer)
* [Stack Overflow: using the header or footer tag twice](https://stackoverflow.com/questions/4837269/html5-using-header-or-footer-tag-twice)
