/**
 * Guards the zero-JS contract on a built site: nothing may reach out to a
 * third-party origin, and no UI framework runtime may sneak into a bundle.
 * Run against dist/ after a build.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import process from 'node:process';

const DIST = 'dist';
const FETCHING_LINK_RELS = [
  'stylesheet',
  'preload',
  'modulepreload',
  'prefetch',
  'preconnect',
  'dns-prefetch',
  'icon',
  'manifest',
];
const ALLOWED_SCRIPT_DIRS = ['/_astro/', '/pagefind/'];
const FRAMEWORK_MARKERS = [
  'react-dom',
  '__vue__',
  'createElementVNode',
  'svelte/internal',
  'solid-js/web',
  'preact/hooks',
];

const failures = [];
const localAssets = new Set();

/**
 * Inline scripts the plan allows on every page: the blocking theme init, the
 * search module and the theme toggle. Changing these numbers is a deliberate
 * act, which is the point of asserting them.
 *
 * An article carries a fourth: the copy control on its code blocks. Portfolio
 * also carries a fourth, its scroll-linked career-route indicator. Both are
 * budgeted separately rather than by raising the figure everywhere, so a script
 * arriving on a page that should carry none of it still fails the audit.
 */
const ALLOWED_INLINE_SCRIPTS_PER_PAGE = 3;
const ALLOWED_INLINE_SCRIPTS_PER_ARTICLE = 4;
const ALLOWED_INLINE_SCRIPTS_PORTFOLIO = 4;

/** `posts/<slug>/index.html`, but not the `posts/index.html` listing. */
function isArticle(where) {
  return /^posts\/[^/]+\/index\.html$/.test(where);
}

function allowedInlineScripts(where) {
  if (isArticle(where)) return ALLOWED_INLINE_SCRIPTS_PER_ARTICLE;
  if (where === 'portfolio/index.html') return ALLOWED_INLINE_SCRIPTS_PORTFOLIO;
  return ALLOWED_INLINE_SCRIPTS_PER_PAGE;
}
let htmlCount = 0;
let inlineScriptCount = 0;
let structuredDataCount = 0;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/** The site's own origin appears in canonical and feed URLs by design. */
const siteOrigin = (await readFile('astro.config.mjs', 'utf8')).match(
  /site:\s*['"]([^'"]+)['"]/,
)?.[1];

function isExternal(url) {
  if (!/^(?:https?:)?\/\//i.test(url)) return false;
  if (!siteOrigin) return true;
  // Origin equality, not a prefix test: ngocsangyem.dev.example.com starts with
  // the site origin but is a different host entirely.
  try {
    return new URL(url, siteOrigin).origin !== new URL(siteOrigin).origin;
  } catch {
    return true;
  }
}

function fetchesSubresource(tag) {
  const rel = tag.match(/\srel=["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? '';
  return rel.split(/\s+/).some((value) => FETCHING_LINK_RELS.includes(value));
}

/** Catches url() and @import in any stylesheet, inline or emitted. */
function auditCss(css, where) {
  for (const [, url] of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    if (isExternal(url.trim())) failures.push(`${where}: external CSS url() ${url.trim()}`);
  }
  for (const [, url] of css.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/gi)) {
    if (isExternal(url)) failures.push(`${where}: external CSS @import ${url}`);
  }
}

function auditHtml(file, html) {
  const where = relative(DIST, file);

  for (const [, src] of html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi)) {
    if (isExternal(src)) {
      failures.push(`${where}: external script ${src}`);
    } else if (!ALLOWED_SCRIPT_DIRS.some((dir) => src.startsWith(dir))) {
      failures.push(`${where}: script outside the allowlist ${src}`);
    }
  }

  for (const [tag, href] of html.matchAll(/<link[^>]*\shref=["']([^"']+)["'][^>]*>/gi)) {
    if (fetchesSubresource(tag) && isExternal(href)) {
      failures.push(`${where}: external link ${href}`);
    }
  }

  for (const [, src] of html.matchAll(
    /<(?:img|video|audio|source|track|embed)[^>]*\ssrc=["']([^"']+)["']/gi,
  )) {
    if (isExternal(src)) failures.push(`${where}: external media ${src}`);
    else localAssets.add(src.split('?')[0]);
  }

  // srcset carries a comma-separated candidate list, each with an optional
  // descriptor, so every candidate needs checking on its own.
  for (const [, set] of html.matchAll(/\ssrcset=["']([^"']+)["']/gi)) {
    for (const candidate of set.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (!url) continue;
      if (isExternal(url)) failures.push(`${where}: external srcset candidate ${url}`);
    }
  }

  for (const [, data] of html.matchAll(/<object[^>]*\sdata=["']([^"']+)["']/gi)) {
    if (isExternal(data)) failures.push(`${where}: external object ${data}`);
  }

  // A video poster fetches just like a src.
  for (const [, poster] of html.matchAll(/<video[^>]*\sposter=["']([^"']+)["']/gi)) {
    if (isExternal(poster)) failures.push(`${where}: external video poster ${poster}`);
  }

  for (const [, action] of html.matchAll(/<form[^>]*\saction=["']([^"']+)["']/gi)) {
    if (isExternal(action)) failures.push(`${where}: form posts off-site to ${action}`);
  }

  // Inline CSS can fetch as effectively as any tag.
  for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    auditCss(css, where);
  }

  if (/<iframe[\s>]/i.test(html)) failures.push(`${where}: iframe present`);

  // Structured data is markup the crawler reads, not code the browser runs, so
  // it stays outside the executable budget below. It still gets parsed here: a
  // malformed ld+json block is invisible in the page and silent in the console.
  for (const [, json] of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      JSON.parse(json);
      structuredDataCount += 1;
    } catch (error) {
      failures.push(`${where}: unparseable ld+json (${error.message})`);
    }
  }

  const inlineOnPage = [
    ...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>/gi),
  ].filter(([tag]) => !/type=["']application\/ld\+json["']/i.test(tag)).length;
  inlineScriptCount += inlineOnPage;
  const allowed = allowedInlineScripts(where);
  if (inlineOnPage !== allowed) {
    failures.push(`${where}: ${inlineOnPage} inline scripts, allowlist permits ${allowed}`);
  }
}

// The search index is produced by a separate binary in the build chain; a bare
// `astro build` silently ships a site whose search cannot work.
try {
  await readFile(join(DIST, 'pagefind', 'pagefind-entry.json'), 'utf8');
} catch {
  failures.push('pagefind/pagefind-entry.json missing: run the full build chain');
}

const files = await walk(DIST);

for (const file of files) {
  const ext = extname(file);
  if (ext === '.html') {
    htmlCount += 1;
    auditHtml(file, await readFile(file, 'utf8'));
  } else if (ext === '.css') {
    auditCss(await readFile(file, 'utf8'), relative(DIST, file));
  } else if (ext === '.js' && relative(DIST, file).startsWith('_astro')) {
    const code = await readFile(file, 'utf8');
    for (const marker of FRAMEWORK_MARKERS) {
      if (code.includes(marker)) {
        failures.push(`${relative(DIST, file)}: framework runtime marker "${marker}"`);
      }
    }
  }
}

// A chip pointing at a missing icon renders as a broken image and shows up as a
// console error in an audit.
for (const asset of localAssets) {
  if (!asset.startsWith('/')) continue;
  try {
    await readFile(join(DIST, asset.slice(1)));
  } catch {
    failures.push(`referenced asset missing from dist: ${asset}`);
  }
}

/**
 * Social cards are rasterised from one shared template, and the only thing that
 * distinguishes them is the headline. resvg does not fail on a font it cannot
 * load, it silently drops the text -- so a card set in nothing still rasterises,
 * and every card collapses onto the same bytes. Comparing them to each other is
 * what catches that; a size floor would only ever be a guessed number.
 */
const cardHashes = new Map();
try {
  for (const name of await readdir(join(DIST, 'og'))) {
    if (extname(name) !== '.png') continue;
    const hash = createHash('sha256').update(await readFile(join(DIST, 'og', name))).digest('hex');
    const twin = cardHashes.get(hash);
    if (twin) {
      failures.push(
        `og/${name} is byte-identical to og/${twin}: the headline did not render, ` +
          `so the fonts behind the card are missing`,
      );
    } else {
      cardHashes.set(hash, name);
    }
  }
} catch {
  failures.push('no og cards in dist/og: the card route produced nothing');
}

console.log(
  `audited ${htmlCount} pages, ${cardHashes.size} og cards, ` +
    `${inlineScriptCount} inline scripts, ` +
    `${structuredDataCount} ld+json blocks, ${localAssets.size} local media refs`,
);

if (failures.length) {
  console.error('\ndist audit failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('dist audit passed');
