import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only this project's own units; the repo also carries tooling with tests.
    include: ['src/**/*.{test,spec}.ts'],
  },
  resolve: {
    // lib/posts.ts imports astro:content for its collection wrapper; the pure
    // functions under test never call it.
    alias: { 'astro:content': new URL('./src/lib/test/astro-content-stub.ts', import.meta.url).pathname },
  },
});
