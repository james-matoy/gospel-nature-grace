// @ts-check
import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// Keystatic only works in local dev (Cloudflare adapter breaks it)
const isDev = process.env.NODE_ENV !== 'production';
const integrations = [markdoc()];
if (isDev) {
  integrations.push(keystatic());
}

const config = {
  integrations,
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@keystatic/astro'],
    },
    ssr: {
      noExternal: ['@keystatic/astro'],
    },
  },
};

if (!isDev) {
  config.adapter = cloudflare();
  config.output = 'server';
}

export default defineConfig(config);