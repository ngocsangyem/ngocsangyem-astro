---
title: "A theme toggle that survives blocked storage"
date: 2026-08-20
tags: ["css", "a11y", "astro"]
---

Every no-flash dark mode recipe is the same shape: an inline, blocking script at
the top of `<head>` that sets an attribute before the first paint. The recipes
usually stop there, which leaves two holes.

The first is that `localStorage` is not always readable. In a Safari window with
"Block All Cookies" on, touching `localStorage` throws a `SecurityError` rather
than returning null. An unguarded read takes the whole init script down with it,
so the page loads with no theme attribute at all and the site falls back to
whatever the default stylesheet says. The user asked for more privacy and got a
broken site.

The second hole is that the toggle has the same problem in reverse. Reading is
guarded, writing is forgotten, and the click handler throws on the first attempt
to persist.

So both sides get a try/catch, and the fallback is the OS preference:

```js
var stored = null;
try {
  stored = localStorage.getItem('theme');
} catch (error) {
  // Storage blocked. OS preference stands in.
}
var theme = stored === 'light' || stored === 'dark'
  ? stored
  : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
```

The result is a preference that is session-only when storage is unavailable,
which is the honest behaviour. Nothing throws, and the theme is still right.

## Testing the case you cannot click

The awkward part is that you cannot reproduce blocked storage by hand in a normal
browser window. [Playwright](https://playwright.dev) can, by poisoning the accessor
before any page script runs, because
[DOMException](https://developer.mozilla.org/en-US/docs/Web/API/DOMException) is
exactly what Safari throws here:

```js
await ctx.addInitScript(() => {
  const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
  Object.defineProperty(window, 'localStorage', { get: boom });
  Object.defineProperty(window, 'sessionStorage', { get: boom });
});
```

Then assert three things: the attribute matches the OS preference, the toggle
still flips it, and `pageerror` fired zero times. That last assertion is the one
that catches a regression, because the first two can pass while an exception is
quietly thrown somewhere else on the page.

One more detail worth writing down. If you check for the flash by reading
`getComputedStyle` right after navigation commits, you will measure a transparent
background and think you have a bug. At commit the stylesheet is not parsed yet.
`DOMContentLoaded` is the state that matches the real first paint, because a
blocking stylesheet in `<head>` holds rendering until it lands.
