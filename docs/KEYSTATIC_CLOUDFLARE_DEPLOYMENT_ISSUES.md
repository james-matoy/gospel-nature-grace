# Keystatic on Cloudflare Workers — Troubleshooting Guide

> **Last updated:** 2026-06-18  
> **Status:** 🔴 Blocked — `module is not defined` in Workerd runtime  
> **Feature:** Keystatic CMS admin UI (`/keystatic`) + GitHub OAuth + content CRUD  
> **Goal:** Edit blog content via browser, saved as commits to `james-matoy/gospel-nature-grace`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Current Configuration (what's in place)](#2-current-configuration-whats-in-place)
3. [Error: `module is not defined`](#3-error-module-is-not-defined)
4. [Attempts and Results](#4-attempts-and-results)
5. [What Was Successfully Achieved](#5-what-was-successfully-achieved)
6. [Future Approaches to Try](#6-future-approaches-to-try)
7. [External Analysis: Gemini's Evaluation](#7-external-analysis-geminis-evaluation)
8. [Reverting Instructions (if removing Keystatic)](#8-reverting-instructions-if-removing-keystatic)

---

## 1. Architecture Overview

Keystatic requires **server-side rendering (SSR)** at runtime for two route categories:

| Route | Purpose |
|-------|---------|
| `/keystatic` | Admin UI page (React app) |
| `/keystatic/api/*` | GitHub OAuth + content CRUD endpoints |

The Astro project uses:
- **`@astrojs/cloudflare`** adapter with `output: 'server'` — builds SSR worker at `dist/server/entry.mjs`
- **`@keystatic/astro`** — Keystatic Astro integration
- **`@keystatic/core`** — Keystatic core library (depends on `superstruct` for validation)
- **GitHub storage** — `keystatic.config.ts` uses `kind: 'github'` to commit content via GitHub API
- **GitHub App** — `gospel-nature-grace-cms` (installed on repo, permissions: Contents R/W, Pull Requests R/W)

### Files involved

| File | Role |
|------|------|
| `keystatic.config.ts` | Storage config (github), collection schema, GitHub repo |
| `astro.config.mjs` | `output: 'server'`, `@astrojs/cloudflare` adapter, Keystatic integration |
| `src/content.config.ts` | Astro content schema (separate from Keystatic's schema) |
| `dist/server/entry.mjs` | Build output — Worker entry point |
| `dist/server/chunks/*.mjs` | Build output — Worker dependency chunks (including `keystatic-api_*.mjs`) |
| `dist/server/wrangler.json` | Auto-generated Worker config (by `@astrojs/cloudflare`) |
| `wrangler.toml` | Manual config for Worker deployment (compatibility flags + KV binding) |

---

## 2. Current Configuration (what's in place)

### 2.1 Cloudflare Pages Settings

| Setting | Value |
|---------|-------|
| **Build command** | `npm install --legacy-peer-deps && npm run build && sed -i 's/"compatibility_flags":\[\]/"compatibility_flags":["nodejs_compat"]/' dist/server/wrangler.json && cp dist/server/entry.mjs dist/client/_worker.js && cp dist/server/virtual_astro_middleware.mjs dist/client/ && cp -r dist/server/chunks dist/client/ && cp dist/server/wrangler.json dist/client/` |
| **Build output directory** | `dist/client` |
| **Production branch** | `main` |

### 2.2 Environment Variables (Cloudflare Pages)

| Variable | Value | Purpose |
|----------|-------|---------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | `Iv23li9tlAeOkjCucURy` | GitHub OAuth App client ID |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | *(set in dashboard)* | GitHub OAuth App client secret |
| `KEYSTATIC_SECRET` | *(set in dashboard)* | Encryption key for Keystatic session data |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | `gospel-nature-grace-cms` | GitHub App slug for API calls |
| `SKIP_DEPENDENCY_INSTALL` | `true` | Skip npm install on deploy (uses cache) |
| ~~`SKIP_KEYSTATIC`~~ | *(deleted)* | Was set to `true` to disable Keystatic in production |

### 2.3 KV Namespace Binding (Cloudflare Pages Functions)

| Variable name | KV Namespace |
|--------------|--------------|
| `SESSION` | `gospel-nature-grace-kv` |

### 2.4 Compatibility Flags (Cloudflare Pages Dashboard)

| Flag | Location |
|------|----------|
| `nodejs_compat` | Settings → Functions → Compatibility flags → Production |

### 2.5 GitHub App (`gospel-nature-grace-cms`)

| Property | Value |
|----------|-------|
| **Home URL** | `https://gospel-nature-grace.pages.dev/` |
| **Callback URL** | `https://gospel-nature-grace.pages.dev/api/keystatic/github/oauth/callback` |
| **Repository access** | `james-matoy/gospel-nature-grace` (Only select repositories) |
| **Permissions** | Contents: Read & write, Pull Requests: Read & write, Metadata: Read-only |

### 2.6 `wrangler.toml` (for standalone Worker deployment)

```toml
name = "gospel-nature-grace-keystatic-worker"
main = "dist/server/entry.mjs"
compatibility_date = "2026-04-15"
compatibility_flags = ["nodejs_compat"]
workers_dev = false
```

---

## 3. Error: `module is not defined`

### 3.1 The Root Cause

```
Internal server error: module is not defined
at runInRunnerObject (workers/runner-worker/index.js:107:3)
at _NonRunnablePipeline.getComponentByRoute
at matchRoute
at DevApp.devMatch
```

**Why it happens:**

1. `@keystatic/core` depends on `superstruct` (a validation library)
2. `superstruct` contains code like: `typeof module !== 'undefined' && module.exports`
3. Cloudflare Workerd has no `module` global — that's a Node.js/CommonJS concept
4. Workerd uses ES modules; the `module` reference throws `ReferenceError`
5. This crashes before any page renders, producing HTTP 500 or blank page

### 3.2 Why `nodejs_compat` Doesn't Fix It

The `nodejs_compat` compatibility flag polyfills Node.js APIs like `Buffer`, `process`, `setTimeout` — but it does **not** create a `module` global or implement CommonJS module resolution in the ES module runtime. `superstruct` is accessing `module` as a top-level global, which is fundamentally incompatible with Workerd's module system.

### 3.3 Route Constraint: `*.pages.dev` Cannot Have Custom Routes

Cloudflare's routing documentation ([Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)) confirms:

> Routes only work for domains whose DNS is managed by Cloudflare (orange-clouded).

A `*.pages.dev` subdomain is Cloudflare's internal domain, not a custom domain you own. Routes **cannot** be configured for it. This means:

- **Separate Worker with route trigger on `*.pages.dev`** → ❌ Not possible
- **Separate Worker at its own `.workers.dev` URL** → ✅ Works (but Keystatic still crashes on render)
- **Separate Worker with custom domain** → ✅ Possible, but requires purchasing a domain
- **Pages Advanced Mode (`_worker.js`)** → ✅ No routes needed, runs natively in Pages (but API still crashes)

**Practical impact:** The routing barrier is real but secondary. Even if routing worked, the `module is not defined` crash would still prevent Keystatic from rendering.

---

## 4. Attempts and Results

### Attempt 1: Standalone Worker with `wrangler deploy`

| Aspect | Detail |
|--------|--------|
| **Command** | `npx wrangler deploy dist/server/entry.mjs --name gospel-nature-grace-keystatic-worker` |
| **Result** | ❌ Worker deployed but `/keystatic` returned blank page |
| **Why** | Workerd lacks `module` global; the bundled entry crashes before rendering |
| **Notes** | Worker also bundled all static assets (wasted space) |

### Attempt 2: Standalone Worker with `--no-bundle` flag

| Aspect | Detail |
|--------|--------|
| **Command** | `npx wrangler deploy dist/server/entry.mjs --name gospel-nature-grace-keystatic-worker --no-bundle` |
| **Result** | ❌ Still bundled static assets |
| **Why** | `dist/server/wrangler.json` (auto-generated) includes `"assets": { "binding": "ASSETS", "directory": "../client" }` |
| **Notes** | The assets config is injected by `@astrojs/cloudflare` adapter |

### Attempt 3: Standalone Worker with custom config (no assets)

| Aspect | Detail |
|--------|--------|
| **Command** | `npx wrangler deploy dist/server/entry.mjs --name gospel-nature-grace-keystatic-worker --config tmp-wrangler.toml` |
| **Result** | ✅ Worker deployed without static assets, bindings correct |
| **Keeness** | Deployment worked correctly — Worker URL live |
| **But** | `/keystatic` returned a **blank page** — the `module is not defined` crash still happens |
| **Status** | Worker deploys but Keystatic crashes at runtime |

### Attempt 4: Pages Advanced Mode (`_worker.js`)

| Aspect | Detail |
|--------|--------|
| **Build command** | `npm install ... && cp dist/server/entry.mjs dist/client/_worker.js && cp dist/server/virtual_astro_middleware.mjs dist/client/ && cp -r dist/server/chunks dist/client/` |
| **Result** | Static pages work ✅, `/keystatic` page loads ✅, **but API calls return HTTP 500** |
| **Why** | The Keystatic **page** renders (React UI), but the **API** chunk (`keystatic-api_*.mjs`) crashes because it imports `superstruct` which references `module` |
| **Evidence** | `Failed to execute 'json' on 'Response': Unexpected end of JSON input` |

### Attempt 5: Pages + `nodejs_compat` Compatibility Flag

| Aspect | Detail |
|--------|--------|
| **Method** | Set `nodejs_compat` in Cloudflare Pages Dashboard → Settings → Functions → Compatibility flags |
| **Result** | ❌ Still HTTP 500 on API calls |
| **Why** | `nodejs_compat` doesn't create the `module` global that `superstruct` needs |
| **Notes** | Also tried: setting flag via `wrangler.toml` and patching `dist/server/wrangler.json` via sed — same result |

### Attempt 6: GitHub App Installation

| Aspect | Detail |
|--------|--------|
| **Action** | Installed `gospel-nature-grace-cms` GitHub App on `james-matoy/gospel-nature-grace` |
| **Result** | ✅ App shows as installed with Contents: Read & Write |
| **Notes** | Necessary for GitHub storage mode, but the Worker still crashed before it could hit the API |

---

## 5. What Was Successfully Achieved

| Component | Status | URL |
|-----------|--------|-----|
| Static pages | ✅ Working | `https://gospel-nature-grace.pages.dev/` |
| Blog listing | ✅ Working | `https://gospel-nature-grace.pages.dev/blog` |
| Blog posts | ✅ Working | `https://gospel-nature-grace.pages.dev/blog/names` |
| CSS/styling | ✅ Working | Tailwind CSS bundled via Astro, correct cache headers |
| Content schema | ✅ Updated | Added `category`, `description` fields to `src/content.config.ts` |
| Keystatic config | ✅ Set up | GitHub storage, blog collection, schema, GitHub App credentials |
| GitHub App | ✅ Installed | `gospel-nature-grace-cms` on `james-matoy/gospel-nature-grace` |
| KV Namespace | ✅ Created | `gospel-nature-grace-keystatic-worker-session` |
| Standalone Worker | ✅ Deployed | Worker URL live (but Keystatic crashes) |

**Keystatic Admin UI:** ❌ Not functional — `module is not defined` in Workerd runtime blocks rendering

---

## 6. Future Approaches to Try

### 6.1 Approach A: Decap CMS (formerly Netlify CMS)

**What it is:** A client-side CMS that works entirely in the browser. No SSR Worker needed. Uses GitHub's API directly via OAuth.

**Benefits:**
- ✅ Runs 100% client-side — no SSR, no Worker, no `module` issues
- ✅ Works on Cloudflare Pages static hosting out of the box
- ✅ Git-based — saves commits to your repo (same as Keystatic)
- ✅ Markdown/Markdoc support
- ✅ No new dependencies to install — just a `public/admin/config.yml` file

**Estimated effort:** 2-3 hours

### 6.2 Approach B: Standalone Node.js Server + Cloudflare Tunnel

**What it is:** Run Keystatic on a cheap Node.js host (Railway, Render, Fly.io) and expose it at `cms.yourdomain.com` via Cloudflare Tunnel.

**Benefits:**
- ✅ Keystatic works natively on Node.js — no Workerd conflicts
- ✅ Full CMS functionality

**Downsides:**
- ❌ Monthly cost ($5-10/mo)
- ❌ Two services to manage
- ❌ Need a custom domain

**Estimated effort:** 4-6 hours

### 6.3 Approach C: Migrate to Vercel (Recommended — keep Keystatic)

**What it is:** Move the entire Astro app to Vercel, which supports full Node.js SSR natively. Keystatic works out of the box.

**Why Vercel over alternatives:**

| Factor | **Netlify** | **Vercel** ✅ | **Render** |
|--------|------------|-----------|-----------|
| **SSR support** | ✅ Full Node.js | ✅ Full Node.js | ✅ Full Node.js |
| **Free build minutes/mo** | 300 | **6,000** | 750 |
| **Free bandwidth/mo** | 100 GB | 100 GB | 100 GB |
| **Built-in KV for OAuth** | ✅ Netlify Blobs | ✅ Vercel KV | ❌ Needs $7/mo Redis |
| **Astro integration** | Good | **First-party** | Manual Docker setup |
| **Custom domain (free)** | ✅ Yes | ✅ Yes | ✅ Yes |

Render is out because it lacks free KV storage for Keystatic OAuth sessions. Vercel wins over Netlify with 20x more build minutes and first-party Astro support from the framework's creators.

**Migration steps:**
```bash
npm install @astrojs/vercel --legacy-peer-deps
npm uninstall @astrojs/cloudflare --legacy-peer-deps
```

```js
// astro.config.mjs — change adapter:
import vercel from '@astrojs/vercel';
// instead of: import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // integrations unchanged: react(), markdoc(), keystatic()
  // ...
});
```

Then:
1. Remove `wrangler.toml` from project
2. Restore build command in dashboard to `npm install --legacy-peer-deps && npm run build`
3. Remove `SESSION` KV binding from dashboard
4. Push to GitHub, connect repo to Vercel, deploy
5. Update GitHub App callback URL to Vercel domain

**Estimated effort:** 30-60 minutes

### 6.4 Approach D: Patch `superstruct` at Build Time

**What it is:** Use a Vite plugin or esbuild `define` to replace `module` references in the `superstruct` dependency during build.

```
define: { 'typeof module': '"object"' }
```

**Why it might work:** The error comes from `superstruct` checking `typeof module !== 'undefined'`. If we define `module` as an empty object at build time, the check passes.

**Why it might fail:** `superstruct` may also use `module.exports` for exports, which would still crash.

**Estimated effort:** 1-2 hours

### 6.5 Approach E: Explicitly Pass Environment Variables from Cloudflare Bindings

**What it is:** `@keystatic/astro`'s auto-generated API handler may rely on `process.env` which doesn't exist in Cloudflare Workers. Creating a manual handler with explicit bindings may resolve the 500 error on the login endpoint.

```ts
// src/pages/api/keystatic/[...params].ts
import { makeApi } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

export const prerender = false;

export const ALL = async (context) => {
  const env = context.locals?.runtime?.env || process.env;
  const handler = makeApi({
    config,
    secret: env.KEYSTATIC_SECRET,
    github: {
      clientId: env.KEYSTATIC_GITHUB_CLIENT_ID,
      clientSecret: env.KEYSTATIC_GITHUB_CLIENT_SECRET,
    }
  });
  return handler(context);
};
```

**Why it might fail:** The `module is not defined` crash in `superstruct` would still happen when the Worker loads `@keystatic/core`. This is a separate issue from environment variables.

**Estimated effort:** 2-3 hours

### 6.6 Approach F: Use Keystatic's `local` Mode via API

**What it is:** Run Keystatic in `local` mode on a separate process / server, and expose only its API endpoints to Cloudflare via a fetch wrapper.

**Estimated effort:** High — essentially building a custom proxy layer.

---

## 7. External Analysis: Gemini's Evaluation

On 2026-06-18, Gemini analyzed the Keystatic-on-Cloudflare issue and provided an independent assessment.

### 7.1 What Gemini Got Right

| Finding | Our Section | Status |
|---------|------------|--------|
| **Path A (Pages Advanced Mode) is the right direction** | Section 4, Attempt 4 | ✅ Already concluded |
| **"Silent failure" on HTTP 500** — Functions log shows `Ok` but app returns 500 | Section 5, Attempt 5 | ✅ Documented |
| **Environment variables may not reach Keystatic** | Section 6.5 (Approach E) | ✅ Added |
| **Custom API route with explicit bindings** | Section 6.5 with code snippet | ✅ Added |

### 7.2 What Gemini Missed

| Gap | Explanation |
|-----|-------------|
| **`module is not defined` is the primary blocker** | Standalone Worker proved this: page returns **blank** because `superstruct` crashes before any Keystatic code runs. |
| **`export const prerender = false` is unnecessary** | With `output: 'server'`, all routes are server-rendered by default. |
| **`mode: 'advanced'` adapter option is outdated** | v13 `@astrojs/cloudflare` dropped the explicit `mode` option. |

### 7.3 Updated Priority Order

| Priority | Approach | Section | Effort |
|----------|----------|---------|--------|
| **1st** | **D** — Patch `superstruct` at build time | 6.4 | 1-2 hr |
| **2nd** | **C** — Migrate to Vercel (keep Keystatic, switch hosting) | 6.3 | 30-60 min |
| **3rd** | **E** — Custom API route with env var passthrough | 6.5 | 2-3 hr |
| **4th** | **A** — Switch to Decap CMS (keep Cloudflare) | 6.1 | 2-3 hr |
| **5th** | **B** — Standalone Node.js server + Cloudflare Tunnel | 6.2 | 4-6 hr |

---

## 8. Reverting Instructions (if removing Keystatic)

### 8.1 Remove Keystatic Dependencies

```bash
npm uninstall @keystatic/astro @keystatic/core --legacy-peer-deps
```

### 8.2 Update `astro.config.mjs`

Remove the Keystatic integration from the `integrations` array.

### 8.3 Delete Keystatic Config Files

```bash
rm keystatic.config.ts
```

### 8.4 Restore `output` Mode

Change `output: 'server'` to `output: 'static'` in `astro.config.mjs` — removes the SSR Worker entirely.

### 8.5 Remove `wrangler.toml`

Delete `wrangler.toml` — no longer needed for static deployment.

### 8.6 Update Build Command (Cloudflare Pages Dashboard)

```
npm install --legacy-peer-deps && npm run build
```

### 8.7 Clean Up Cloudflare Dashboard

- Delete `SESSION` KV namespace binding from Pages Functions settings
- Remove `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` from environment variables
- Delete the `gospel-nature-grace-keystatic-worker` Worker
- Delete the `gospel-nature-grace-keystatic-worker-session` KV namespace

### 8.8 Keep Content Files

Content files at `src/content/blog/*.mdoc` are unaffected — they're static content that Astro reads at build time. The blog will still display them without Keystatic.