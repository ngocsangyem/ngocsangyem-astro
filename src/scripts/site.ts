/*
 * The one site-wide entry, imported once by BaseLayout. Theme, search and the
 * keyboard layer ship as a single script so the per-page inline-script budget
 * in scripts/audit-dist.mjs changes only when a page-scoped script is added.
 */
import './theme';
import './search';
import './hotkeys';
