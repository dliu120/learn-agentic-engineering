import { fileURLToPath } from 'node:url';
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
