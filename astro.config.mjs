import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// Static-only output. No SSR, no serverless. Deployable to any static host.
// `site` is used for canonical URLs, the Atom feed, and sitemap-friendly absolute links.
// Override in CI for GitHub Pages, e.g. SITE=https://user.github.io BASE=/repo/.
const site = process.env.SITE ?? 'https://allm-academy.example';
const base = process.env.BASE ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [preact({ compat: true }), mdx()],
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed', wrap: true },
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: { noExternal: ['gsap'] },
  },
});
