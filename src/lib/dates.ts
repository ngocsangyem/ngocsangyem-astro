/** Machine-readable form for a <time datetime> attribute. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Display form for meta rows and list rows: "Mar 4", or "Mar 4, 2024" off-year.
 * UTC throughout, so it cannot disagree with the year grouping.
 */
export function formatDate(date: Date, currentYear = new Date().getUTCFullYear()): string {
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return year === currentYear ? `${month} ${day}` : `${month} ${day}, ${year}`;
}

/**
 * List-row form: "Oct 08, 2026". Always dated and zero-padded, so a column of
 * rows lines up character for character in a tabular mono face. UTC, like
 * formatDate.
 */
export function formatDateShort(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${month} ${day}, ${date.getUTCFullYear()}`;
}

export function getYear(date: Date): number {
  return date.getUTCFullYear();
}
