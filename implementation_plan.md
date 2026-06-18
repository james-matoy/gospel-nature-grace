# Implementation Plan

**Goal:** Successfully deploy Keystatic CMS on Cloudflare Pages production by fixing the `storage: local` incompatibility, resolving the `module is not defined` Workerd error, and updating the content schema to match UI expectations.

---

## Overview

The project has **two blocking issues** preventing Keystatic from working in production:

1. **`storage: { kind: 'local' }`** — Keystatic is configured to store content files on the local filesystem. Cloudflare Workers have no persistent filesystem — every request runs in an ephemeral sandbox. Even if the `module is not defined` error is fixed, Keystatic would crash because it cannot write `.mdoc` files to disk in a Worker environment. **The fix is to switch to `storage: { kind: 'github' }` mode**, which stores content via commits to the GitHub repository through the GitHub App that's already registered.

2. **`module is not defined`** — Cloudflare Workerd lacks the Node.js `module` global. Keystatic's dependency chain (specifically `superstruct` via `@keystatic/core`) references it. This crashes both the dev runner and production Worker. The fix is to deploy the Worker separately via `wrangler deploy` (Strategy A from DEPLOYMENT.md), which uses a different bundler pipeline that can polyfill this.

---

## Type Definitions

No new types needed. The content schema in `src/content.config.ts` needs `category`, `description`, and `body` fields added to match what the blog pages already reference.

---

## Files

### New Files to Create

None. No new files are needed.

### Existing Files to Modify

**1. `keystatic.config.ts`**
- Change `storage: { kind: 'local' }` to `storage: { kind: 'github' }`
- Add GitHub App credentials from environment variables
- This enables Keystatic to write content via GitHub API instead of local filesystem

**2. `src/content.config.ts`**
- Add `category: z.string().optional().default('Reflection')`
- Add `description: z.string().optional()`
- Add `body: z.string().optional()` (for reading time calculation fallback)
- These fields are already referenced by `blog/index.astro` and `blog/[slug].astro` but missing from schema

**3. `docs/DEPLOYMENT.md`**
- Update Section 3: Change Strategy A from "Recommended" to "Required (verified)"
- Add the GitHub storage configuration steps
- Document the Worker deployment + route trigger as the verified production path
- Remove Strategy B or move to appendix as deprecated

**4. `.env.example`**
- Already created. No changes needed.

### Files to Delete

None.

---

## Functions

### `keystatic.config.ts`

**Modified:** Change `storage` property object:
- Remove: `storage: { kind: 'local' }`
- Add: `storage: { kind: 'github', repo: 'james-matoy/gospel-nature-grace', branchPrefix: 'content' }`

The GitHub App credentials (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`) are already set as environment variables in Cloudflare Pages dashboard. No additional OAuth config needed.

### `src/content.config.ts`

**Modified:** Extend the `schema` object:
- Add `category: z.string().optional().default('Reflection')`
- Add `description: z.string().optional()`
- Add `body: z.string().optional()`

### `astro.config.mjs`

No changes needed — current config is correct for `output: 'server'` with the Cloudflare adapter.

---

## Dependencies

| Package | Version | Action |
|---------|---------|--------|
| `@keystatic/core` | ^0.5.50 (already installed) | No change needed — the GitHub storage mode is a built-in feature of `@keystatic/core`. No new package required. |

---

## Testing

| Test | Method | How to Verify |
|------|--------|---------------|
| Local build integrity | `npx astro build` | Build succeeds with no errors |
| Static page rendering | `npx astro dev` | All static routes return 200 with full styling |
| Keystatic GitHub storage | Local `npx astro dev` with `SKIP_KEYSTATIC=false` | Keystatic admin UI loads without filesystem errors |
| Worker deployment | `npx wrangler deploy dist/server/entry.mjs --name gospel-nature-grace-keystatic-worker` | Deploy succeeds, Worker shows as active in Cloudflare dashboard |
| Route trigger | Cloudflare Dashboard Triggers tab | `/keystatic` route pattern registered and active |
| Production `/keystatic` | Browse `https://gospel-nature-grace.pages.dev/keystatic` | Admin UI loads without 404 |
| Content CRUD | Login via GitHub OAuth, create/edit a blog post | Changes committed to GitHub repo via Keystatic API |

---

## Implementation Order

1. Update `keystatic.config.ts` — switch `storage: 'local'` → `storage: 'github'` with repo config
2. Update `src/content.config.ts` — add missing `category`, `description`, `body` fields to schema
3. Rebuild locally: `npx astro build` — confirm build succeeds
4. Update `docs/DEPLOYMENT.md` — document the verified production path with GitHub storage
5. Commit and push changes to GitHub (auto-triggers Pages deployment)
6. Deploy Worker separately: `npx wrangler deploy dist/server/entry.mjs --name gospel-nature-grace-keystatic-worker`
7. Configure route trigger in Cloudflare Dashboard: add `/keystatic*` route to the Worker
8. Verify production: browse `https://gospel-nature-grace.pages.dev/keystatic` — should load Keystatic admin UI