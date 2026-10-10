/**
 * The site-wide social card: the template itself, rasterised at build time
 * with the same faces as the per-post cards, so the fallback can never drift
 * from the artwork the way a committed PNG could.
 */
import type { APIRoute } from 'astro';
import { cardResponse, loadCardTemplate } from '../lib/og-raster';

export const GET: APIRoute = async () => cardResponse(await loadCardTemplate());
