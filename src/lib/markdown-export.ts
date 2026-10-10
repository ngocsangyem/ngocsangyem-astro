/**
 * The raw-markdown copy of a post served at `/posts/<id>.md`: the source body
 * under its title, with every relative target made absolute so the text still
 * works once pasted somewhere else. MDX imports and components stay as
 * written; this is the source, not a rendering.
 */

export interface ExportInput {
  title: string;
  body: string;
  /** Site origin, no trailing slash. */
  site: string;
  /** Absolute URL of the post page, no trailing slash. */
  postUrl: string;
  /** Built URL for a colocated asset path as written in the body, if any. */
  resolveAsset?: (path: string) => string | null;
}

/** `[text](target "title")` and `![alt](target)`; the target has no spaces. */
const LINK = /(!?\[[^\]]*\]\()(\S+?)((?:\s+"[^"]*")?\))/g;
/** Fenced blocks and inline code, which are left byte for byte. */
const CODE = /(```[\s\S]*?```|`[^`\n]+`)/g;

function absolutize(target: string, input: ExportInput): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) return target;
  if (target.startsWith('/')) return `${input.site}${target}`;
  const asset = input.resolveAsset?.(target);
  if (asset) return asset.startsWith('/') ? `${input.site}${asset}` : asset;
  return new URL(target, `${input.postUrl}/`).href;
}

export function toExportMarkdown(input: ExportInput): string {
  const body = input.body
    .split(CODE)
    .map((chunk, index) =>
      // split with one capture group alternates prose, code, prose…
      index % 2 === 1 ? chunk : chunk.replace(LINK, (_m, open, target, close) => open + absolutize(target, input) + close),
    )
    .join('');
  return `# ${input.title}\n\n${body.trim()}\n`;
}
