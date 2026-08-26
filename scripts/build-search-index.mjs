/**
 * Builds the Pagefind index with URLs this site can actually serve.
 *
 * The CLI derives a result URL from where a file lands on disk, so every page
 * indexes as `/posts/slug/` while `trailingSlash: 'never'` makes that form a
 * 404. Setting `data-pagefind-meta="url:…"` in the page only reaches the main
 * result: the UI reads `meta.url | default(url)` there, but heading chips link
 * straight to `sub.url`, which Pagefind derives from the page URL it recorded.
 *
 * The Node API takes the URL explicitly, which fixes both at once — the whole
 * index agrees with the canonical tag, the sitemap, and the feed.
 *
 * Run against dist/ after a build.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import process from 'node:process';
import * as pagefind from 'pagefind';

const DIST = 'dist';

/** Already-built assets, not pages. Indexing them would waste the crawl. */
const SKIP_DIRS = new Set(['pagefind', '_astro']);

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* htmlFiles(join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      yield join(dir, entry.name);
    }
  }
}

/**
 * `dist/posts/slug/index.html` -> `/posts/slug`, and `dist/index.html` -> `/`.
 * Root is the one path that keeps its slash, because stripping it leaves the
 * empty string rather than a URL.
 */
function urlFor(file) {
  const segments = relative(DIST, file).split(sep);
  const last = segments.pop();
  if (last !== 'index.html') segments.push(last);
  return segments.length ? `/${segments.join('/')}` : '/';
}

const { index, errors: createErrors } = await pagefind.createIndex();
if (!index) {
  console.error('Pagefind could not create an index:', createErrors);
  process.exit(1);
}

let indexed = 0;
for await (const file of htmlFiles(DIST)) {
  const { errors } = await index.addHTMLFile({
    url: urlFor(file),
    content: await readFile(file, 'utf8'),
  });
  // A page Pagefind rejects is a page that silently drops out of search, so it
  // fails the build rather than shipping a quietly incomplete index.
  if (errors?.length) {
    console.error(`Pagefind failed on ${file}:`, errors);
    process.exit(1);
  }
  indexed += 1;
}

const { errors: writeErrors } = await index.writeFiles({
  outputPath: join(DIST, 'pagefind'),
});
if (writeErrors?.length) {
  console.error('Pagefind could not write the index:', writeErrors);
  process.exit(1);
}

await pagefind.close();
console.log(`Pagefind indexed ${indexed} pages`);
