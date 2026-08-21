/** Stands in for astro:content under vitest, which has no content store. */
export async function getCollection(): Promise<never[]> {
  throw new Error('getCollection is not available in unit tests');
}
