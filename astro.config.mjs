// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare'; // <-- 1. This import was missing

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(), // <-- 2. This adapter config was missing
  integrations: [react(), markdoc(), keystatic()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@keystatic/astro'],
    },
    ssr: {
      noExternal: ['@keystatic/astro'],
    },
  },
});