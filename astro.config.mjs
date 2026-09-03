// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://mlankster16.github.io/coursera-design-guide
export default defineConfig({
  site: 'https://mlankster16.github.io',
  base: '/coursera-design-guide',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
