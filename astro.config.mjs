import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://falling-u.com',
  integrations: [
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/go/')
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light'
    }
  }
});
