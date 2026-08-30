# Production Deployment Guide

> Consolidated documentation for deploying **Gospel, Nature, and Grace** to Cloudflare Pages — covering static pages, Keystatic CMS via SSR Worker, and all errors encountered with fixes.

---

## Table of Contents

1. [Cloudflare Pages Configuration](#1-cloudflare-pages-configuration)
2. [Static Pages (Working ✅)](#2-static-pages-working-)
3. [Keystatic CMS via SSR Worker](#3-keystatic-cms-via-ssr-worker)
4. [Error Log & Fixes](#4-error-log--fixes)
5. [Appendices](#5-appendices)

---

## 1. Cloudflare Pages Configuration

### General Settings

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `npm install --legacy-peer-deps && npm run build` |
| **Build output directory** | `dist/client` |
| **Build system version** | 3 (latest) |
| **Root directory** | `/` |
| **Build comments** | Enabled |

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | `Iv23li9tlAeOkjCucURy` | Keystatic GitHub OAuth App client ID |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | *(set in dashboard)* | Keystatic GitHub OAuth App client secret |
| `KEYSTATIC_SECRET` | *(set in dashboard)* | Encryption key for Keystatic session data |
| `NPM_FLAGS` | `--legacy-peer-deps` | Bypass peer dependency conflicts with Keystatic |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | `gospel-nature-grace-cms` | GitHub App slug for Keystatic |
| `SKIP_DEPENDENCY_INSTALL` | `true` | Skip install if using dependency cache |
| `SKIP_KEYSTATIC` | `true` | Skip Keystatic initialization in build (disables admin UI in production) |

### Build System Default Tools

| Tool | Default Version | Override Env Var |
|------|----------------|------------------|
| Go | 1.24.3 | `GO_VERSION` |
| Node.js | 22.16.0 | `NODE_VERSION` (or `.nvmrc`) |
| Bun | 1.2.15 | `BUN_VERSION` |
| Python | 3.13.3 | `PYTHON_VERSION` (or `.python-version`) |
| Ruby | 3.4.4 | `RUBY_VERSION` (or `.ruby-version`) |

---

## 2. Static Pages (Working ✅)

### How It Works

All static pages are prerendered at build time via `export const prerender = true` in each page component. Astro generates HTML files directly into the output directory.

### Output Structure (`dist/client/`)

```
dist/client/
├── index.html                  # /
├── about/index.html            # /about
├── blog/index.html             # /blog (listing)
├── blog/names/index.html       # /blog/names
├── blog/nice/index.html        # /blog/nice
├── blog/quotes-from-the-bible/ # /blog/quotes-from-the-bible
├── _astro/                     # Bundled CSS & JS assets
│   ├── BaseLayout.Cz1isZrj.css # Tailwind CSS output (~43KB)
│   ├── client.DC-NXwka.js
│   └── keystatic-page.CTJL5ovl.js
├── images/                     # Public images
├── fonts/                      # Self-hosted fonts (WOFF2)
├── _headers                    # Cache-Control headers for assets
└── favicon.ico / favicon.svg
```

Cloudflare Pages serves these static files directly without any server-side processing.

### Required Configuration

| Setting | Value |
|---------|-------|
| **Build command** | `npm install --legacy-peer-deps && npm run build` |
| **Build output directory** | `dist/client` |

No custom copy commands are needed. Pages automatically serves the prerendered HTML from the output directory.

### GitHub Storage Mode

Keystatic is configured to use **GitHub storage** (not local filesystem). This is required because Cloudflare Workers have no persistent filesystem. When the Keystatic admin UI saves content, it commits changes directly to the GitHub repository via the GitHub App.

**`keystatic.config.ts`:**
```ts
storage: {
  kind: 'github',
  repo: 'james-matoy/gospel-nature-grace',
  branchPrefix: 'content',
}
```

> ⚠️ Remove `SKIP_KEYSTATIC=true` from production environment variables when using GitHub storage — the admin UI must be active to create and edit content via the browser.

### Static Page Files

| File | Route | Role |
|------|-------|------|
| `src/pages/index.astro` | `/` | Home page |
| `src/pages/about.astro` | `/about` | About page |
| `src/pages/blog/index.astro` | `/blog` | Blog listing |
| `src/pages/blog/[slug].astro` | `/blog/:slug` | Individual blog posts |
| `src/layouts/BaseLayout.astro` | — | Shared layout with Tailwind CSS |

### CSS Bundling (Important Fix)

CSS is imported in the Astro frontmatter — **not** via a raw `<link>` tag:

```astro
---
import '../styles/global.css';
---
```

Astro processes this import at build time, producing a hashed CSS file in `/_astro/BaseLayout.Cz1isZrj.css`. The built HTML automatically references the correct hashed path.

**Do not use:**
```html
<!-- WRONG: This only works in dev mode (Vite serves /src/ paths) -->
<link rel="stylesheet" href="/src/styles/global.css" />
```

---

## 3. Keystatic CMS via SSR Worker (Working ✅)

### Architecture

Keystatic requires **server-side rendering** for:
- The Keystatic admin UI at `/keystatic`
- Keystatic API endpoints at `/keystatic/api/*` (GitHub OAuth, content CRUD)

These routes cannot be prerendered. They need a Cloudflare Worker. The `@astrojs/cloudflare` adapter builds the Worker at `dist/server/entry.mjs`.

### Strategy A: Separate Worker + Route Trigger (Recommended)

Keystatic runs as a standalone Cloudflare Worker, separate from the static Pages site.

**1. Deploy static pages** via Git integration (already configured — auto-deploys on push to `main`).

**2. Deploy the Worker manually:**
```bash
npx wrangler deploy dist/server/entry.mjs --name gospel-nature-grace-keystatic-worker
```

This produces a standalone Worker with all SSR routes including Keystatic.

**3. Configure routing** in Cloudflare Dashboard:
1. Go to **Workers & Pages** → `gospel-nature-grace-keystatic-worker`
2. Click **Triggers** → **Routes**
3. Add route: `gospel-nature-grace.pages.dev/keystatic*`
4. *(Optional)* Add route: `gospel-nature-grace.pages.dev/keystatic/api/*`

This forwards all requests starting with `/keystatic` to the Worker, while everything else goes to Pages directly.

### Strategy B: Pages Advanced Mode (`_worker.js`) — Experimental

The Worker entry is copied into the Pages output as `_worker.js`, enabling **Cloudflare Pages Advanced Mode** — one single deploy handles both static and SSR routes.

**Build command:**
```
npm install --legacy-peer-deps && npm run build && cp dist/server/entry.mjs dist/client/_worker.js && cp dist/server/virtual_astro_middleware.mjs dist/client/ && cp -r dist/server/chunks dist/client/
```

**Build output directory:** `dist/client`

> ⚠️ **Experimental:** This has not been fully verified. Pages wraps the Worker and provides the `ASSETS` binding automatically. The worker must correctly use `context.env.ASSETS.fetch()` to serve static assets. This may not work out of the box with `@astrojs/cloudflare` v13.

### Environment Variables for Keystatic

These must be set in the Cloudflare Pages dashboard (available to both build and Worker runtime):

| Variable | Purpose |
|----------|---------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub OAuth App client ID for Keystatic login |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `KEYSTATIC_SECRET` | Encryption/decryption key for Keystatic session |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | GitHub App slug for API calls |
| `SKIP_KEYSTATIC` | Set to `true` to skip Keystatic during build (disables admin UI in production) |

### Deploy Status

| Route | Type | Status |
|-------|------|--------|
| `/` | Static | ✅ Fully styled |
| `/about` | Static | ✅ Fully styled |
| `/blog` | Static | ✅ Fully styled |
| `/blog/:slug` | Static | ✅ Fully styled |
| `/keystatic` | SSR (Worker) | ⚠️ See Strategy A above |
| `/keystatic/api/*` | SSR (Worker) | ⚠️ See Strategy A above |

---

## 4. Error Log & Fixes

### 4.1 `wrangler.toml` Conflict with Server-Side Rendering

**Error:**
```
at runInRunnerObject (workers/runner-worker/index.js:107:3)
at _NonRunnablePipeline.getComponentByRoute
at matchRoute
at DevApp.devMatch
```

**Root cause:** A `wrangler.toml` file existed with a Pages-style `[site]` bucket config:
```toml
name = "gospel-nature-grace"
pages_build_output_dir = "dist"
compatibility_date = "2026-06-09"

[site]
bucket = "./dist"
```

This forced **Pages static mode**, but `@astrojs/cloudflare` with `output: 'server'` expects **Workers SSR mode**. The mismatch caused the Cloudflare dev runner to fail during route matching.

**Fix:** Remove `wrangler.toml` entirely:
```bash
git rm wrangler.toml
git commit -m "chore: remove conflicting wrangler.toml"
```

Without `wrangler.toml`, the Cloudflare adapter falls back to its default SSR-compatible behavior.

**Commit:** `c25d247`

---

### 4.2 Wrong Build Output Directory

**Error:** Site deployed but showed "Page not found" or blank.

**Root cause:** The **Build output directory** in Cloudflare Pages was set to `dist`, but the actual static content Astro generates lives in `dist/client/`. Pages could not find any files to serve.

**Fix:** Change **Build output directory** from `dist` to `dist/client` in the Cloudflare Pages dashboard.

---

### 4.3 Missing CSS / Unstyled HTML Pages

**Error:** Pages deployed successfully but rendered as plain unstyled HTML — all content but no Tailwind CSS styles.

**Root cause:** `BaseLayout.astro` had a raw `<link>` tag pointing to the source CSS file:
```html
<link rel="stylesheet" href="/src/styles/global.css" />
```

In production, `/src/styles/global.css` **does not exist** — the build output flattens everything into `dist/client/`. Only the dev server (Vite) resolves `/src/` paths.

**Fix:** Replace the raw `<link>` tag with an Astro frontmatter import:
```astro
---
import '../styles/global.css';
---
```

Astro bundles the CSS into `dist/client/_astro/BaseLayout.Cz1isZrj.css` with a content hash. The built HTML automatically references the correct path.

**File changed:** `src/layouts/BaseLayout.astro`
- Removed: `<link rel="stylesheet" href="/src/styles/global.css" />` (line 32)
- Added: `import '../styles/global.css';` in frontmatter (line 3)

**Commit:** `153a17d`

---

### 4.4 `cp` vs `copy` — Linux Build Environment

**Error:** Build command failed with `copy: not found` (exit code 127).
```
/bin/sh: 1: copy: not found
```

**Root cause:** Cloudflare Pages uses a **Linux** build environment. `copy` is a Windows terminal command.

**Fix:** Use Linux `cp` instead:

| Windows (wrong) | Linux (correct) |
|-----------------|-----------------|
| `copy file1 file2` | `cp file1 file2` |
| `dir\subdir\file` | `dir/subdir/file` |
| `/Y` (suppress prompts) | Not needed |

Example corrected command:
```bash
cp dist/server/entry.mjs dist/client/_worker.js
```

---

### 4.5 `module is not defined` — Keystatic Worker Compatibility

**Error:**
```
Internal server error: module is not defined
at runInRunnerObject (workers/runner-worker/index.js:107:3)
```

**Root cause:** The Cloudflare Workerd runtime does not have `module` as a global variable. Keystatic's dependency chain (specifically the `superstruct` validation library used by `@keystatic/core`) references `module` at the top level, which crashes the runner.

**Impact:** Only affects **server-rendered routes** (`/keystatic`, `/keystatic/api/*`). Static prerendered pages are unaffected.

**Status:** 🟡 **Unresolved in the dev runner.** The `_NonRunnablePipeline.getComponentByRoute` error in the dev server is caused by this module resolution issue. Keystatic admin UI may not function correctly in the Cloudflare dev runner.

**Production workaround:** Deploy the Worker separately using Strategy A (Section 3). The `wrangler deploy` pipeline uses a different bundling process than the Pages dev runner, which may resolve this.

---

### 4.6 Missing Worker Dependency: `virtual_astro_middleware.mjs`

**Error:**
```
Could not resolve "../virtual_astro_middleware.mjs"
chunks/worker-entry_Depf35TB.mjs:24526:27:
  middleware: () => import("../virtual_astro_middleware.mjs"),
```

**Root cause:** `entry.mjs` imports Astro's middleware helper via `../virtual_astro_middleware.mjs`, which lives next to the `chunks/` directory. When copying the Worker for Advanced Mode (Strategy B), this file was missing.

**Fix:** Copy all three server artifacts:
```bash
cp dist/server/entry.mjs      dist/client/_worker.js
cp dist/server/virtual_astro_middleware.mjs  dist/client/
cp -r dist/server/chunks      dist/client/
```

---

## 5. Appendices

### A. Final `astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
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
```

### B. Final `BaseLayout.astro` — CSS import

```astro
---
import '../styles/global.css';
---
```

### C. Final Cloudflare Pages Dashboard Settings

| Setting | Value |
|---------|-------|
| **Build command** | `npm install --legacy-peer-deps && npm run build` |
| **Build output directory** | `dist/client` |
| **Production branch** | `main` |

### D. Screenshot References

The following screenshots are available in `docs/screenshots/`:

| Screenshot | Shows |
|------------|-------|
| `cloudflare-pages-dashboard.png` | Cloudflare Pages dashboard with build settings and environment variables |
| `github-app-oauth-settings.png` | GitHub App OAuth configuration for Keystatic authentication |

---

*Last updated: June 2026*