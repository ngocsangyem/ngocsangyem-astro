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

export function getYear(date: Date): number {
  return date.getUTCFullYear();
}
