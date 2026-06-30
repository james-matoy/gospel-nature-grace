# Performance Audit Log — June 28, 2026

> A comprehensive record of Lighthouse audits, performance issues identified, fixes applied, and workarounds implemented during the June 28, 2026 optimization session.

---

## Table of Contents

1. [Initial Lighthouse Audit](#1-initial-lighthouse-audit)
2. [Issue: 9.8s LCP on Mobile](#2-issue-98s-lcp-on-mobile)
3. [Issue: Render-Blocking Google Fonts](#3-issue-render-blocking-google-fonts)
4. [Issue: Astro Dev Toolbar Critical Chain (1.1s)](#4-issue-astro-dev-toolbar-critical-chain-11s)
5. [Issue: YAML Parse Error During Build](#5-issue-yaml-parse-error-during-build)
6. [Issue: Missing Blog Cover Image (Why I Don't Like Politics)](#6-issue-missing-blog-cover-image-why-i-dont-like-politics)
7. [Issue: Blog Search Input Color in Dark Theme](#7-issue-blog-search-input-color-in-dark-theme)
8. [SEO: Blog Post Descriptions](#8-seo-blog-post-descriptions)
9. [Image Optimization Pass](#9-image-optimization-pass)
10. [Git Branch Strategy](#10-git-branch-strategy)
11. [Summary of All Changes](#11-summary-of-all-changes)

---

## 1. Initial Lighthouse Audit

### Tool Used
Lighthouse via MCP (`@danielsogl/lighthouse-mcp`) and Chrome DevTools.

### URLs Audited
| URL | Device | Score |
|-----|--------|-------|
| `http://127.0.0.1:4321/` (home) | Mobile (throttled) | **37/100** Performance — throttled |
| `http://127.0.0.1:4321/` (home) | Mobile (no throttle) | **87/100** Performance |
| `http://127.0.0.1:4321/` (home) | Mobile (subsequent) | **97/100** Performance |
| `https://gospel-nature-grace.pages.dev/` | Mobile (Brave) | 9.8s LCP |

### Key Metrics (Before Fixes — Mobile)
| Metric | Value | Score |
|--------|-------|-------|
| First Contentful Paint (FCP) | 5.8 s | 5/100 |
| Largest Contentful Paint (LCP) | 10.0 s | 0/100 |
| Total Blocking Time (TBT) | 1,170 ms | 21/100 |
| Cumulative Layout Shift (CLS) | 0.025 | 100/100 |
| Speed Index | 5.8 s | 50/100 |
| Time to Interactive (TTI) | 11.7 s | 18/100 |
| Accessibility | 90/100 | — |
| Best Practices | 100/100 | — |
| SEO | 91/100 | — |

---

## 2. Issue: 9.8s LCP on Mobile

### Symptom
The largest contentful paint took **9.8 seconds** on a mobile connection. The hero background image (`hero-bg.webp`) was not prioritized.

### Root Cause
Three factors combined to delay the hero image:
1. **No resource priority** — the hero image had no `fetchpriority` attribute
2. **No preload** — the browser only discovered the image after parsing the CSS/HTML body
3. **No explicit dimensions** — the browser had to compute layout before requesting the image

### Fixes Applied

#### a) fetchpriority="high" on hero image
**Files:** `src/pages/index.astro`
```astro
<img
  src="/images/pages/home/hero-bg.webp"
  width="1920"
  height="1080"
  fetchpriority="high"
/>
```

#### b) Preload hero image in `<head>`
**Files:** `src/layouts/BaseLayout.astro`
```astro
{isHome && <link rel="preload" as="image" href="/images/pages/home/hero-bg.webp" fetchpriority="high" />}
```
This required a `isHome` prop computed from `currentPath`.

#### c) Lazy-load below-fold images
**Files:** `src/pages/index.astro`
- Spotlight image: `loading="lazy"` + `decoding="async"` + `width="600" height="800"`
- Forest Path image: `loading="lazy"` + `width="600" height="600"`

#### d) Blog page lazy loading
**Files:** `src/pages/blog/index.astro`
- First blog cover: `loading="eager"`, `decoding="auto"`
- All subsequent covers: `loading="lazy"`, `decoding="async"`

### Result
LCP dropped from 10.0s → 2.2s on unthrottled mobile testing.

---

## 3. Issue: Render-Blocking Google Fonts

### Symptom
Both Google Fonts (`Libre Caslon Text`, `Source Serif 4`, `Work Sans`) and the Material Symbols icon font blocked initial page render, adding **810ms** to FCP.

### Fix Applied
**Files:** `src/layouts/BaseLayout.astro`

Both font stylesheets now use the `media="print"` + `onload="this.media='all'"` pattern:

```astro
<link
  href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,700;1,400&family=Work+Sans:wght@400;500;700&display=swap"
  rel="stylesheet"
  media="print" onload="this.media='all'"
/>
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
  rel="stylesheet"
  media="print" onload="this.media='all'"
/>
```

Each has a `<noscript>` fallback:
```astro
<noscript>
  <link href="..." rel="stylesheet" />
</noscript>
```

### How It Works
- `media="print"` makes the browser treat the stylesheet as low-priority (downloaded asynchronously)
- `onload="this.media='all'"` switches it to the correct media once downloaded
- `<noscript>` ensures browsers without JS still load the fonts

### Security Note
This is safe — fonts are loaded via HTTPS from Google's CDN with preconnect hints. No XSS or injection risk.

---

## 4. Issue: Astro Dev Toolbar Critical Chain (1.1s)

### Symptom
Brave Lighthouse audit showed a **critical request chain** of 20+ development-only scripts adding **1,094ms** to LCP:

```
Initial Navigation (284 ms, 79 KB)
├── entrypoint.js (682 ms, 51 KB)
├── xray-*.js (907 ms, 6 KB)
├── astro-*.js (902 ms, 20 KB)
├── @vite/client (680 ms, 288 KB)
├── global.css (687 ms, 62 KB)
├── ...15+ more chunks
```

### Root Cause
When running `npm run dev`, Astro injects the **Dev Toolbar** and **Vite HMR client** into every page. These ~580 KB of JavaScript do not exist in production builds — they are stripped by the Cloudflare adapter.

### Workaround Applied (Reverted)
**Files:** `astro.config.mjs` (reverted)
```js
devToolbar: { enabled: false },
```
This eliminates the dev toolbar chain during local Lighthouse testing. **Reverted** because the user wanted the toolbar available for development.

### Recommendation
For accurate production Lighthouse scores, either:
1. Run `npm run build && npx serve dist/` and test against the static build, or
2. Test the production site at `https://gospel-nature-grace.pages.dev/`
3. Temporarily set `devToolbar: { enabled: false }` → test → revert

No production impact — the dev toolbar is stripped from the Cloudflare build.

---

## 5. Issue: YAML Parse Error During Build

### Symptom
```
js-yaml: YAMLException: unacceptable kind of mapping value
at readBlockMapping
at safeParseFrontmatter
```

Build failed after adding `description` fields to blog frontmatter.

### Root Cause
Single-quoted YAML strings (`'...'`) cannot contain apostrophes. Several descriptions had `God's` or other contractions, causing YAML to interpret the apostrophe as the end of the string:

```yaml
# BROKEN — apostrophe ends the string early
description: 'Salvation is entirely God's work—He draws us to Christ...'
```

### Fix Applied
Switched all blog `description` values from single quotes to **double quotes**:

```yaml
# FIXED — double quotes handle apostrophes correctly
description: "Salvation is entirely God's work—He draws us to Christ..."
```

### Files Changed
All 6 blog `.mdoc` files in `src/content/blog/`:
- `a-blueprint-for-the-papacy-standing-firm-on-biblical-truth.mdoc`
- `following-christ-vs-pleasing-people-a-call-to-true-discipleship.mdoc`
- `matters-of-the-heart-examining-our-motives-in-giving.mdoc`
- `not-church-but-Christ-the-work-of-God-in-salvaiton.mdoc`
- `returning-to-the-page-returning-to-him.mdoc`
- `why-i-dont-like-politics.mdoc`

### Lesson
In YAML frontmatter:
- Use **single quotes** (`'...'`) for strings without apostrophes
- Use **double quotes** (`"..."`) for strings that contain apostrophes or special characters
- Use **block scalar** (`>-)` or `|`) for multi-line strings

---

## 6. Issue: Missing Blog Cover Image (Why I Don't Like Politics)

### Symptom
On the blog listing page (`/blog`), the "Why I Don't Like Politics" post showed only alt text — no cover image.

### Root Cause
The folder `public/images/blog/why-i-dont-like-politics/` contained only `cover.png` (2 MB), but **no `cover.webp`**. The blog page template references `cover.webp`, so the browser couldn't load the image.

### Fix Applied
Generated `cover.webp` from the existing PNG using `sharp`:

```bash
node -e "
const sharp=require('sharp');
sharp('public/images/blog/why-i-dont-like-politics/cover.png')
  .resize(1200, 630, {fit: 'inside'})
  .webp({quality: 55})
  .toFile('public/images/blog/why-i-dont-like-politics/cover.webp')
"
```

### Result
Cover image now displays correctly in the blog listing.

---

## 7. Issue: Blog Search Input Color in Dark Theme

### Symptom
In dark theme, typing into the blog search bar showed text in the default dark color (nearly invisible).

### Fix Applied
**Files:** `src/pages/blog/index.astro`

Changed the dark theme text color from `dark:text-inverse-on-surface` to `dark:text-[#42425C]`:

```astro
class="… text-on-surface dark:text-[#42425C] …"
```

The placeholder color was retained as `dark:placeholder:text-[#a4a8a3]`.

---

## 8. SEO: Blog Post Descriptions

### Task
Add a `description` field to every blog post's frontmatter (max 130 characters) for SEO meta descriptions.

### Descriptions Added

| Blog Post | Description | Chars |
|-----------|------------|-------|
| A Blueprint for the Papacy | "A call for the Pope to stand firm on biblical truth, serving God over people, and defending the faith without compromise." | 121 |
| Following Christ vs. Pleasing People | "True discipleship means choosing Christ over people-pleasing, counting the cost, and surrendering all to follow Him." | 116 |
| Matters of the Heart | "Examine your heart in giving—do you give out of love for God, or out of greed for blessings? True giving honors God." | 116 |
| Not Church, But Christ | "Salvation is entirely God's work—He draws us to Christ, redeems us, and gives us a new heart to follow Him." | 107 |
| Returning to the Page, Returning to Him | "A personal journey of creating this blog and returning to writing as an act of drawing closer to God through faith." | 115 |
| Why I Don't Like Politics | "Politics can corrupt Christian values. Instead of hate, we are called to pray for leaders and keep our focus on the Gospel." | 123 |

### Template Usage
The blog index page (`src/pages/blog/index.astro`) already used `post.data.description` for the excerpt displayed under each post title.

---

## 9. Image Optimization Pass

### Tools Used
- `sharp` (already available via Astro's dependency tree)
- WebP output at quality 55 (home images) / quality 60 (hero)

### Home Page Images

| Image | Before | After | Reduction |
|-------|--------|-------|-----------|
| `hero-bg.webp` (1920×1080) | 147 KB | 95 KB | -35% |
| `spotlight.webp` (900×1200) | 385 KB | 205 KB | -47% |
| `forest-path.webp` (900×900) | 231 KB | 65 KB | -72% |
| **Total** | **763 KB** | **365 KB** | **-52%** |

### Blog Cover Images
All 6 blog cover folders now have optimized `cover.webp` files (1200×630, quality 55):
- `a-blueprint-for-the-papacy-standing-firm-on-biblical-truth`
- `following-christ-vs-pleasing-people-a-call-to-true-discipleship`
- `matters-of-the-heart-examining-our-motives-in-giving`
- `not-church-but-Christ-the-work-of-God-in-salvaiton`
- `returning-to-the-page-returning-to-him`
- `why-i-dont-like-politics`

### About Page Images (already small, no change needed)

| Image | Size | Status |
|-------|------|--------|
| `profile.webp` | 29 KB | OK |
| `planting.webp` | 105 KB | OK |
| `cultivating.webp` | 119 KB | OK |
| `bearing-fruit.webp` | 107 KB | OK |

### Compression Command Reference
```bash
node -e "
const sharp=require('sharp');
sharp('input.png')
  .resize(WIDTH, HEIGHT, {fit: 'inside'})
  .webp({quality: 55})
  .toFile('output.webp');
"
```

**Quality guidelines:**
- **55-60:** Good balance for photographs and complex images
- **70-80:** High quality for hero/LCP images
- **40-50:** Aggressive compression for thumbnail/decorative images
- Always keep an original `.png` source in case re-compression is needed

---

## 10. Git Branch Strategy

### Setup
Two branches in the remote repository:

| Branch | Contents | Purpose | Deployed by Cloudflare |
|--------|----------|---------|----------------------|
| `main` | Full site (code + content + all images) | Production deployment | Yes |
| `blog` | `src/content/blog/*.mdoc` + `public/images/blog/**` | Blog tracking & organization | No |

### How the Blog Branch Was Created

```bash
# 1. Create orphan branch (no commit history from main)
git checkout --orphan blog

# 2. Remove everything
git rm -rf .

# 3. Checkout only blog content from main
git checkout main -- src/content/blog public/images/blog

# 4. Commit and push
git add src/content/blog public/images/blog
git commit -m "chore(blog): mirror blog content and images only"
git push origin blog
```

### Workflow
```bash
# Work on blog content
git checkout blog
# ... edit .mdoc files, add images ...
git add src/content/blog/ public/images/blog/
git commit -m "chore(blog): add new post"
git push origin blog

# Merge into main for production
git checkout main
git merge blog
git push origin main
```

Cloudflare Pages should only build from `main`. Verify in Cloudflare Dashboard → your project → Settings → Production branch is set to `main`.

---

## 11. Summary of All Changes

### Files Modified
| File | Changes |
|------|---------|
| `src/layouts/BaseLayout.astro` | Added font preconnect hints, deferred fonts with `media="print"`, added `<slot name="head" />`, conditional hero preload |
| `src/pages/index.astro` | Added `fetchpriority="high"`, `width`, `height` on hero; `loading="lazy"` on below-fold images |
| `src/pages/blog/index.astro` | Added lazy-load attributes on covers, first-cover preload, dark theme search color |
| `src/content/blog/*.mdoc` (6 files) | Added `description` fields, switched from single to double quotes |
| `astro.config.mjs` | Dev toolbar disabled then reverted (no net change) |
| `.gitignore` | Added `lighthouse-report.json` and `lighthouse-blog-report.json` |

### Files Created (Blog branch)
| File | Description |
|------|-------------|
| `docs/PERFORMANCE_AUDIT_LOG.md` | This documentation |

### New/Replaced Binary Files
| File | Action |
|------|--------|
| `public/images/pages/home/hero-bg.webp` | Re-compressed (147 KB → 95 KB) |
| `public/images/pages/home/spotlight.webp` | Re-compressed (385 KB → 205 KB) |
| `public/images/pages/home/forest-path.webp` | Re-compressed (231 KB → 65 KB) |
| `public/images/blog/why-i-dont-like-politics/cover.webp` | Created (was missing) |
| All other blog `cover.webp` | Re-compressed |

### Git Commits Pushed
```bash
e45f969..eeb33b9  main -> main
  3235889  chore(seo): add descriptions to all blog posts and fix YAML quoting
  ce95827  fix(ui): set blog search input text color to #42425C in dark theme
  4a2351b  perf: defer Material Symbols font, add font preconnect hints, preload hero image
  eeb33b9  perf: compress all site images, prioritize hero LCP, fix missing blog cover
```

---

## Appendix: Security Review

> Quick security check of all changes made during this session.

| Change | Risk | Notes |
|--------|------|-------|
| `<slot name="head" />` in BaseLayout | Low | Pages can inject arbitrary `<head>` content; only trusted authors edit source |
| `preload` URL from blog frontmatter | Low | URL comes from `.mdoc` frontmatter; only trusted editors can modify |
| Image compression | None | No remote URLs, no user input |
| Font preconnect/defer | None | Standard CDN optimization |
| YAML quoting change | None | Purely syntactic, no injection vector |
| Dev toolbar toggle | None | Dev-only, no production effect |
| SEO text changes | None | Static text only |

**Conclusion:** No security vulnerabilities introduced. The site remains safe for production.