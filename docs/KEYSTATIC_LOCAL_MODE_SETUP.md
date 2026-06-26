# Keystatic Local Mode Setup

> Date: 2026-06-25  
> Status: ✅ Working

---

## What Works Now

| Feature | Status |
|---------|--------|
| Keystatic admin UI at `/keystatic` | ✅ Working |
| Blog collection editor | ✅ Working |
| Pages collection editor | ✅ Working |
| Local file storage (`src/content/blog/*.mdoc`) | ✅ Working |
| Cover images in blog posts | ✅ Working |
| Blog branch automation (`npm run blog:publish`) | ✅ Ready to use |
| Cloudflare Pages static deployment | ✅ Working (when pushed to `main`) |

---

## What Was Fixed Today

### 1. Keystatic `Astro.locals.runtime.env` Error
**Problem:** `@keystatic/astro@5.0.6` crashed with `Astro.locals.runtime.env has been removed in Astro v6`  
**Fix:** Updated to `@keystatic/astro@5.1.0` and patched `node_modules/@keystatic/astro/dist/keystatic-astro-api.js` to wrap the env access in try/catch.  
**File:** `patches/@keystatic+astro+5.1.0.patch`

### 2. Keystatic `non-Node.js environment` Error
**Problem:** `@astrojs/cloudflare` dev runner uses Workerd (no filesystem), but Keystatic `kind: 'local'` needs Node.js fs  
**Fix:** Conditional config in `astro.config.mjs` — Keystatic only enabled in dev, Cloudflare adapter only in production  
**File:** `astro.config.mjs`

### 3. Keystatic Worker Bundle Rejection
**Problem:** The `worker` bundle of `@keystatic/core` had a stub `localModeApiHandler` that returned 500 error  
**Fix:** Replaced `node_modules/@keystatic/core/dist/keystatic-core-api-generic.worker.js` with the real `node` bundle that has the actual filesystem handler

### 4. Schema Validation Error — Missing `description` Field
**Problem:** Existing blog file had `description:` in frontmatter, but `keystatic.config.ts` schema didn't define it  
**Fix:** Added `description: fields.text({ label: 'Description', multiline: true })` to blog schema in `keystatic.config.ts`

### 5. Cover Image Not Displaying
**Problem:** Blog post was missing `cover` field in frontmatter  
**Fix:** Added `cover: /images/blog/green-heartleaf.png` to `src/content/blog/returning-to-the-page-returning-to-him.mdoc`

---

## Current Configuration

### `keystatic.config.ts`
```typescript
storage: { kind: 'local' }  // Writes to local filesystem during dev
```

### `astro.config.mjs`
```javascript
// Keystatic only in dev, Cloudflare adapter only in production
const isDev = process.env.NODE_ENV !== 'production';
const integrations = [react(), markdoc()];
if (isDev) integrations.push(keystatic());

const config = { integrations, vite: { /* ... */ } };
if (!isDev) { config.adapter = cloudflare(); config.output = 'server'; }
```

---

## Blog Publishing Workflow

### Step 1: Write
```bash
npm run dev
# Open http://127.0.0.1:4321/keystatic
# Write and save your blog post
# File is saved to: src/content/blog/your-post.mdoc
```

### Step 2: Publish to Separate Branch
```bash
npm run blog:publish "Your Blog Title"
# Creates: blog/your-blog-title branch on GitHub
# Pushes only blog files to that branch
# Prints PR link
```

### Step 3: Merge PR
1. Open the printed GitHub PR link
2. Review and merge to `main`
3. Cloudflare Pages auto-deploys

---

## Important Notes

### Why No GitHub Mode Yet
- GitHub mode (`kind: 'github'`) requires a separate Cloudflare Worker + route trigger
- The Worker (`gospel-nature-grace-keystatic-worker`) exists but the `/keystatic*` route trigger was never configured in the Cloudflare Dashboard
- Local-only mode is simpler and fully functional for now

### What Happens to Existing Blog Posts
- The first blog (`returning-to-the-page-returning-to-him.mdoc`) stays on `main` permanently
- Any new blogs created via `npm run blog:publish` go to their own `blog/*` branches first, then merge to `main`

### Windows File Locking
Occasional `EPERM` rename errors on `.astro/data-store.json` during rapid saves are a Windows file-locking issue, not a data loss. The blog file is still written successfully.

---

## Files Changed Today

| File | Purpose |
|------|---------|
| `keystatic.config.ts` | Added `description` field, kept `kind: 'local'` |
| `astro.config.mjs` | Conditional Keystatic/Cloudflare adapter |
| `package.json` | Added `blog:publish` script, `patch-package` |
| `scripts/blog-publish.mjs` | Branch automation script |
| `patches/@keystatic+astro+5.1.0.patch` | Astro v6 compatibility |
| `node_modules/@keystatic/core/dist/keystatic-core-api-generic.worker.js` | Patched to use real local filesystem handler |
| `src/content/blog/returning-to-the-page-returning-to-him.mdoc` | Added `cover` image |

---

## What's Still Uncommitted

```bash
git add keystatic.config.ts package.json scripts/ patches/ src/content/blog/returning-to-the-page-returning-to-him.mdoc
git commit -m "feat: working local Keystatic with blog branch automation + description/cover fields"
git push
```

---

## Known Limitations

| Limitation | Workaround |
|------------|------------|
| No Keystatic auth in local mode | Local dev only — no GitHub OAuth needed |
| No Cloudflare Worker route for `/keystatic*` | Use local dev to write blogs, push via `blog:publish` |
| `kind: 'local'` doesn't work in production Worker | Production serves static HTML only from `main` |
| Windows file lock errors on rapid saves | Ignore — file is still saved |