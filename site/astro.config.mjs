import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_ORIGIN / SITE_BASE come from actions/configure-pages in CI, so the same build
// works on arknodel.github.io/PetDropshipping now and on goodleashco.com once the
// custom domain is set. Local default = custom domain at root.
const site = process.env.SITE_ORIGIN || 'https://goodleashco.com';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  outDir: './dist',
  integrations: [sitemap()],
});
