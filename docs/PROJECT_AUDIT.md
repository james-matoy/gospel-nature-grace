# Project Audit: Remaining Issues & Enhancement Opportunities

> **Audit Date:** 2026-06-16
> **Scope:** Full project codebase, configuration, content, and infrastructure

---

## 1. Remaining Issues

### 1.1 Keystatic Not Functional on Cloudflare Workers 🔴

| Aspect | Detail |
|--------|--------|
| **Error** | `Internal server error: module is not defined` at `workers/runner-worker/index.js:107` |
| **Root cause** | Cloudflare Workerd lacks `module` global. Keystatic's `superstruct` (via `@keystatic/core`) references it. |
| **Status** | Unresolved — documented in `DEPLOYMENT.md` Section 4.5 |
| **Priority** | High — blocks production CMS usage |
| **Next step** | Try Strategy A (deploy Worker separately via `wrangler deploy`). The `wrangler deploy` bundler may wrap `module` references differently than the dev runner. |

### 1.2 Content Schema Missing Fields 🟡

| Issue | Details |
|-------|---------|
| **Missing `category` field** | The blog listing (`blog/index.astro`) displays `post.data.category`, but the content schema (`content.config.ts`) doesn't define a `category` field. Falls back to `'Reflection'`. |
| **Missing `description` field** | Blog index tries to show `post.data.description` as excerpt but it's not in the schema. Falls back to `post.data.title`. |
| **Missing `body` field** | Reading time calculation uses `post.data.body?.length` but `body` isn't in the schema. Always uses fallback `500`. |

**Files affected:**
- `src/content.config.ts` — schema only has `title`, `date`, `cover`
- `src/pages/blog/index.astro` — lines 74, 78, 88 reference undefined fields
- `src/pages/blog/[slug].astro` — lines 17, 63 reference undefined fields

**Fix:** Add to `src/content.config.ts` schema:
```ts
schema: z.object({
  title: z.string(),
  date: z.date(),
  cover: z.string().optional(),
  category: z.string().optional().default('Reflection'),
  description: z.string().optional(),
}),
```

### 1.3 Stale `@astrojs/node` Dependency 🟡

| Aspect | Detail |
|--------|--------|
| **File** | `package.json` line 17 |
| **Dependency** | `"@astrojs/node": "^10.1.3"` |
| **Problem** | This project uses `@astrojs/cloudflare` for deployment, not `@astrojs/node`. This dependency is unused — it was installed during early experimentation and can be removed. |

### 1.4 Unused React Component 🟡

| Aspect | Detail |
|--------|--------|
| **File** | `src/components/MdocTable.tsx` |
| **Purpose** | React component for rendering tables in Markdoc |
| **Problem** | `markdoc.config.ts` is empty (`defineMarkdocConfig({})`) — this component is never registered as a Markdoc tag. It exists but is not used anywhere. |

### 1.5 Orphaned `images/` Directory 🟡

| Aspect | Detail |
|--------|--------|
| **Path** | `images/` (project root) |
| **Contents** | `bearing fruit.png`, `cultivating.png`, `planting.png`, `Profile Picture.png` |
| **Problem** | These images are also stored in `public/images/author/` (with cleaner filenames). The root `images/` folder is not served by Astro — only `public/` is. These are likely duplicates from an earlier approach. The site references `/images/author/bearing-fruit.png` etc., which uses the `public/images/author/` versions. |

### 1.6 Dev Server Crashes on `/keystatic` 🟡

| Aspect | Detail |
|--------|--------|
| **Symptom** | Hitting `http://localhost:4321/keystatic` in dev triggers `module is not defined` in the Cloudflare runner |
| **Workaround** | Use `SKIP_KEYSTATIC=true` locally, or edit content via files directly in `src/content/blog/` |
| **Status** | Same root cause as 1.1. Affects both dev and production. |

---

## 2. Enhancement Opportunities

### 2.1 Search & Filter Buttons Are Non-Functional 🟢

**Location:** `src/pages/blog/index.astro` lines 27–41

The blog listing page has a search input and filter buttons (All Reflections, Forest Paths, Theology, Light, Quiet Spaces), but they're **static HTML** — no JavaScript handles filtering.

**Enhancement:** Add either:
- **Client-side filter** with vanilla JS (lightweight): filter posts by category on click
- **Active search input** that filters the post list as the user types

### 2.2 Pagination Links Are Placeholder 🟢

**Location:** `src/pages/blog/index.astro` lines 123–139

The pagination nav shows page 1, 2, 3, ... 12 with Next/Previous links, but:
- Only page 1 has content (the current page)
- All other links point to `href="#"` (no-ops)
- There's no pagination logic

**Enhancement:** Implement pagination — e.g., show 6 posts per page with page navigation. This needs both a component and a route parameter.

### 2.3 `SKIP_KEYSTATIC=true` Disables Keystatic Entirely 🟢

**Current state:** The env var `SKIP_KEYSTATIC=true` is set in the Cloudflare dashboard, which prevents Keystatic from mounting its admin UI in production. This is a **security measure** (don't expose CMS to production) but also means the live site cannot edit content.

**Enhancement:** Set up a **staging/preview branch** that:
- Does NOT set `SKIP_KEYSTATIC`
- Has its own GitHub OAuth App for Keystatic
- Is deployed to a separate Cloudflare Pages preview URL

This lets you edit content on a staging site, then promote to production via git merge.

### 2.4 No RSS Feed 🟢

Blog sites typically benefit from an RSS/Atom feed so readers can subscribe. Astro supports this natively.

**Enhancement:** Add an RSS feed at `/rss.xml` using `@astrojs/rss`:
```bash
npm install @astrojs/rss --legacy-peer-deps
```
Then add `src/pages/rss.xml.js` that generates a feed from the blog collection.

### 2.5 No Sitemap 🟢

**Current state:** No `sitemap.xml` — search engines won't easily discover all blog posts.

**Enhancement:** Add the `@astrojs/sitemap` integration:
```bash
npx astro add sitemap
```
This auto-generates a sitemap at `/sitemap-index.xml` during build.

### 2.6 `description` Meta Tag Missing on Some Pages 🟢

**Current state:** `BaseLayout.astro` accepts a `description` prop and renders it as `<meta name="description">`, but it's not set on all pages consistently. Review each page's `BaseLayout` usage.

### 2.7 Blog Post Content is Minimal 🟢

Currently only 3 posts:
- `names.mdoc` — just a table
- `nice.mdoc` — a few words + quote
- `quotes-from-the-bible.mdoc` — a single quote

None contain substantive content that would showcase the site's design.

**Enhancement:** Write 2–3 sample posts with realistic content (headings, paragraphs, images, blockquotes) to demonstrate the full styling.

### 2.8 Error Pages Missing 🟢

**Current state:** No custom 404 or error page. Cloudflare shows its default 404 page.

**Enhancement:** Add `src/pages/404.astro` for a styled not-found page.

### 2.9 No `.env.example` File 🟢

**Current state:** Developers need to know which environment variables to set. There's no `.env.example` in the repo.

**Enhancement:** Create `.env.example`:
```
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=
```

### 2.10 No CICD Improvement: Pre-deploy Checks 🟢

Build passes but no linting or type-checking step runs before deploy.

**Enhancement:** Add to `package.json`:
```json
"scripts": {
  "check": "astro check",
  "build": "astro check && astro build"
}
```

---

## 3. Summary

| Priority | # | Issue/Enhancement | Type | Effort |
|----------|---|-------------------|------|--------|
| 🔴 High | 1.1 | Keystatic not functional on Workers | Bug | Medium |
| 🟡 Medium | 1.2 | Content schema missing fields | Bug | Small |
| 🟡 Medium | 1.3 | Stale `@astrojs/node` dependency | Cleanup | Tiny |
| 🟡 Medium | 1.4 | Unused MdocTable component | Cleanup | Tiny |
| 🟡 Medium | 1.5 | Orphaned `images/` directory | Cleanup | Small |
| 🟡 Medium | 1.6 | Dev server crashes on `/keystatic` | Bug | Medium |
| 🟢 Low | 2.1 | Search & filter buttons non-functional | Feature | Small |
| 🟢 Low | 2.2 | Pagination is placeholder | Feature | Medium |
| 🟢 Low | 2.3 | Staging branch for Keystatic editing | Infrastructure | Large |
| 🟢 Low | 2.4 | No RSS feed | Feature | Small |
| 🟢 Low | 2.5 | No sitemap | Feature | Tiny |
| 🟢 Low | 2.6 | Missing meta descriptions on some pages | Polish | Small |
| 🟢 Low | 2.7 | Blog post content is minimal | Content | Medium |
| 🟢 Low | 2.8 | No custom 404 page | Feature | Small |
| 🟢 Low | 2.9 | No `.env.example` file | Polish | Tiny |
| 🟢 Low | 2.10 | No pre-deploy type checking | Process | Small |

### ⚡ Quick Wins (under 5 minutes each)
1. ~~ Delete `src/components/MdocTable.tsx` (unused)
2. ~~ Delete `@astrojs/node` from `package.json`
3. ~~ Delete `images/` folder (duplicate of `public/images/author/`)
4. ~~ Create `.env.example`
5. ~~ Add `astro check` to build script

---

*Generated by project audit tool — 2026-06-16*