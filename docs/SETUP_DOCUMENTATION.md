# Personal Blog — Setup Documentation

> A comprehensive guide covering the complete setup of this Astro + Keystatic + Tailwind CSS blog project, including issues encountered, workarounds, and troubleshooting tips.

---

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Installing Dependencies](#2-installing-dependencies)
3. [Adding Astro Integrations](#3-adding-astro-integrations)
4. [Adding Keystatic CMS](#4-adding-keystatic-cms)
5. [Adding Tailwind CSS](#5-adding-tailwind-css)
6. [Content Collections Configuration](#6-content-collections-configuration)
7. [Creating Blog Pages](#7-creating-blog-pages)
8. [Keystatic versus Astro: Image Path Conflict](#8-keystatic-versus-astro-image-path-conflict)
9. [Running the Dev Server](#9-running-the-dev-server)
10. [Known Issues & Troubleshooting](#10-known-issues--troubleshooting)
11. [Quick Reference](#11-quick-reference)

---

## 1. Project Initialization

### Command

```bash
npx --yes create-astro@latest . --template minimal --typescript strict --install --no-git
```

### What this does

- Creates a new Astro project in the **current directory** (`.` — no subfolder)
- Uses the **minimal** template (no starter content)
- Configures **strict TypeScript**
- Installs dependencies automatically (`--install`)
- Skips git initialization (`--no-git`)

### ⚠️ Notes & Issues

| Issue | Details |
|-------|---------|
| **`npm create astro@latest` vs `npx`** | Running `npm create astro@latest . -- --template minimal` did NOT forward flags correctly. The `--template`, `--typescript`, `--install` flags were treated as literal arguments (displayed as "minimal" and "strict" being parsed as normal command line arguments). **Use `npx --yes create-astro@latest` directly instead.** |
| **Interactive prompts** | If flags don't work, the CLI will present interactive prompts. You must manually select options (minimal template, TypeScript yes, strict, install yes, no git). |
| **npm install timeout** | During `create-astro`, `npm install` may time out (especially on slower connections). If you see `Error: Timeout` followed by `Dependencies failed to install`, just run `npm install` manually afterward. |

---

## 2. Installing Dependencies

### Base dependencies

```bash
npm install
```

This is already handled if `--install` worked, but run it manually if the setup step timed out.

---

## 3. Adding Astro Integrations

### React

```bash
npx astro add react --yes
```

**What it does:**
- Installs `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom`
- Adds `react()` to `astro.config.mjs`
- Adds `jsx: "react-jsx"` and `jsxImportSource: "react"` to `tsconfig.json`

### Markdoc

```bash
npx astro add markdoc --yes
```

**What it does:**
- Installs `@astrojs/markdoc`
- Adds `markdoc()` to `astro.config.mjs`

---

## 4. Adding Keystatic CMS

### Command

```bash
npm install @keystatic/core @keystatic/astro --legacy-peer-deps
```

### ⚠️ Critical Issue: Peer Dependency Conflict

| Issue | Details |
|-------|---------|
| **The Problem** | `@keystatic/astro@5.0.6` declares `peer astro@"2 \|\| 3 \|\| 4 \|\| 5"`, but we installed Astro `^6.3.7` (v6). |
| **The Fix** | Use `--legacy-peer-deps` to bypass the peer dependency check. Keystatic works fine with Astro v6 despite the warning. |
| **⚠️ Warning** | Every subsequent `npm install` will also need `--legacy-peer-deps`. If you forget, you'll get `ERESOLVE unable to resolve dependency tree` errors. |

### Keystatic Config File (`keystatic.config.ts`)

**Location:** Project root (`/keystatic.config.ts`)

```ts
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    blog: collection({
      label: 'Blog',
      path: 'src/content/blog/*',
      entryLayout: 'content',
      format: {
        contentField: 'content',
      },
      slugField: 'title',
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
        }),
        date: fields.date({
          label: 'Publication date',
        }),
        cover: fields.image({
          label: 'Cover image',
          directory: 'public/images/blog',
          publicPath: '/images/blog/',
        }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/blog',
              publicPath: '/images/blog/',
            },
          },
        }),
      },
    }),
  },
});
```

### ⚠️ Import Path Issue

| Issue | Details |
|-------|---------|
| **Wrong import** | Initially tried `import { config, fields, collection } from '@keystatic/core/astro'` — this subpath does NOT exist in the `@keystatic/core` package exports. |
| **Correct import** | Use `import { config, fields, collection } from '@keystatic/core'` — all three are top-level exports from the core package. |
| **`@keystatic/astro` import** | The `@keystatic/astro` package exports the **integration** function (added to `astro.config.mjs`), not the config utilities. |

### Adding Keystatic to Astro Config

```js
import keystatic from '@keystatic/astro';

export default defineConfig({
  integrations: [react(), markdoc(), keystatic()],
  vite: {
    optimizeDeps: {
      exclude: ['@keystatic/astro'],  // Required to resolve virtual modules
    },
    ssr: {
      noExternal: ['@keystatic/astro'],  // Required for SSR compatibility
    },
  },
});
```

### ⚠️ Vite Configuration Required

Without the `optimizeDeps.exclude` and `ssr.noExternal` for `@keystatic/astro`, the dev server throws:

```
X [ERROR] Could not resolve "virtual:keystatic-config"
```

This is because Keystatic uses Vite virtual modules that need to be excluded from dependency optimization.

---

## 5. Adding Tailwind CSS

### Command

```bash
npm install @tailwindcss/vite@^4 tailwindcss@^4 --legacy-peer-deps
```

**Note:** The `--legacy-peer-deps` flag is required here because `@keystatic/astro` still has its peer dependency conflict with Astro v6.

### ⚠️ `npx astro add tailwind` Failed

The `astro add` CLI command for Tailwind failed with:
```
Error installing dependencies. The command `npm i @tailwindcss/vite@^4.3.0 tailwindcss@^4.3.0` exited with code 1
```

**Root cause:** Same peer dependency conflict — `astro add` doesn't use `--legacy-peer-deps`.

**Solution:** Install manually with `--legacy-peer-deps`, then manually configure:

### Tailwind v4 Configuration

**1. `astro.config.mjs`** — Add the Vite plugin:
```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**2. Global CSS file** (`src/styles/global.css`):
```css
@import "tailwindcss";
```

**3. Import CSS** in your page layouts:
```astro
import '../../styles/global.css';
```

---

## 6. Content Collections Configuration

### File Location

Astro v6 requires the content config at the **project root**: `src/content.config.ts`

### ⚠️ Legacy Location Error

| Issue | Details |
|-------|---------|
| **The Problem** | Astro v6 removed support for `src/content/config.ts`. If you put the config there, you get: `[LegacyContentConfigError] Found legacy content config file in "src/content/config.ts". Please move this file to "src/content.config.ts"` |
| **The Fix** | Move the file to `src/content.config.ts` (project root level, inside the `src/` directory). |

### Working Config

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: 'src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    cover: z.string().optional(),
  }),
});

export const collections = { blog };
```

### ⚠️ Schema: `image()` vs `z.string()`

| Approach | Details |
|----------|---------|
| **Attempted first:** `schema: ({ image }) => z.object({ cover: image() })` | Uses Astro's native image helper. **Problem:** Keystatic stores image paths as relative strings (e.g., `/images/blog/nice/cover.png`), but `image()` expects a local file import. They are incompatible. |
| **Working solution:** `schema: z.object({ cover: z.string().optional() })` | Treats the cover as a plain string path. This works because Keystatic writes the publicPath directly into the frontmatter. |

---

## 7. Creating Blog Pages

### Directory Structure

```
src/pages/blog/
  index.astro       (blog listing page)
  [slug].astro      (individual post page)
```

### Blog Listing (`src/pages/blog/index.astro`)

```astro
---
import { getCollection } from 'astro:content';
import '../../styles/global.css';

const posts = await getCollection('blog');
posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
<html lang="en">
  ...
  {posts.map((post) => (
    <a href={`/blog/${post.id}`}>
      {post.data.cover && <img src={post.data.cover} alt="" />}
      <h2>{post.data.title}</h2>
      <time>{post.data.date.toLocaleDateString('en-US', ...)}</time>
    </a>
  ))}
</html>
```

### Individual Post (`src/pages/blog/[slug].astro`)

```astro
---
import { getCollection, render } from 'astro:content';
import '../../styles/global.css';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<html lang="en">
  ...
  {post.data.cover && <img src={post.data.cover} alt="" />}
  <Content />
</html>
```

### ⚠️ Import Path for CSS

When a page is in a **subdirectory** (e.g., `src/pages/blog/index.astro`), the CSS import path changes:

| File | Import Path |
|------|-------------|
| `src/pages/index.astro` | `import '../styles/global.css'` |
| `src/pages/blog/index.astro` | `import '../../styles/global.css'` |
| `src/pages/blog/[slug].astro` | `import '../../styles/global.css'` |

Using the wrong relative path causes: `Could not import '../styles/global.css'`

---

## 8. Keystatic versus Astro: Image Path Conflict

### The Core Problem

Keystatic CMS stores images **locally** and writes **relative paths** into your Markdoc frontmatter. Astro processes these paths differently depending on where images live.

### Path Evolution

| Attempt | Keystatic Config | Frontmatter Output | Result |
|---------|-----------------|--------------------|--------|
| **1st attempt** | `directory: 'src/content/blog'` + `publicPath: '../../content/blog/'` | `cover: ../../content/blog/nice/cover.png` | ❌ **404** — browsers request `/content/blog/nice/cover.png` which Astro doesn't serve |
| **2nd attempt (working)** | `directory: 'public/images/blog'` + `publicPath: '/images/blog/'` | `cover: /images/blog/nice/cover.png` | ✅ **200** — `public/` files are served statically by Astro |

### Why the First Attempt Failed

Keystatic's `publicPath` is meant for remote deployments (like GitHub Pages or a CDN). For local development:
- `publicPath: '../../content/blog/'` tells Keystatic to write `../../content/blog/nice/cover.png` into the frontmatter
- The browser resolves this to `/content/blog/nice/cover.png`
- But `src/content/` is NOT a publicly served directory — only `public/` is

### ✅ Working Solution

Both the `cover` image field AND the `content` markdoc image options must use:
```ts
directory: 'public/images/blog',    // where files are stored on disk
publicPath: '/images/blog/',         // the URL path the browser uses
```

### Manual Migration

If you already have images in `src/content/blog/`, move them:
```bash
# Create directory
mkdir -p public/images/blog/nice

# Copy image
cp src/content/blog/nice/cover.png public/images/blog/nice/cover.png

# Update frontmatter
# Change: cover: ../../content/blog/nice/cover.png
# To:     cover: /images/blog/nice/cover.png
```

---

## 9. Running the Dev Server

### Command

```bash
npm run dev
```

### What to expect

```
> personal-blog@0.0.1 dev
> astro dev

[vite] connected.
 astro  v6.3.7 ready in ~7 seconds
 ┃ Local    http://127.0.0.1:4321/
```

### URLs

| Page | URL | Description |
|------|-----|-------------|
| Home | http://127.0.0.1:4321/ | Default homepage |
| Blog listing | http://127.0.0.1:4321/blog | Card grid of all posts |
| Individual post | http://127.0.0.1:4321/blog/nice | Single post with Content rendering |
| Keystatic admin | http://127.0.0.1:4321/keystatic | Visual CMS editor |

### ⚠️ Quick Server Crash on Config Change

The dev server auto-restarts when config files change. If it crashes with:
```
Failed to load url astro:server-app.js
```
Just restart manually: press `Ctrl+C` then run `npm run dev` again.

---

## 10. Known Issues & Troubleshooting

### 10.1 `--legacy-peer-deps` Required for All npm Installs

**Error:**
```
npm error ERESOLVE unable to resolve dependency tree
npm error peer astro@"2 || 3 || 4 || 5" from @keystatic/astro@5.0.6
```

**Fix:** Always use `--legacy-peer-deps` when running `npm install` or `npm add`:
```bash
npm install <package> --legacy-peer-deps
```

### 10.2 Image Not Showing (Broken Icon)

**Symptom:** You see a small broken image icon instead of your photo.

**Causes & fixes:**
1. **Browser cache** — Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to force refresh
2. **Wrong image path** — Check the frontmatter in your `.mdoc` file. It should start with `/images/blog/...`
3. **Image not in `public/`** — Verify the file is in `public/images/blog/` (not `src/content/blog/`)
4. **Verify directly** — Open http://127.0.0.1:4321/images/blog/nice/cover.png in your browser to test if the file is served

### 10.3 "The collection 'blog' does not exist or is empty"

**Symptom:** The blog page loads but says "No posts yet."

**Causes:**
1. **No `.mdoc` files** — Create files in `src/content/blog/`
2. **Wrong config location** — Ensure config is at `src/content.config.ts` (NOT `src/content/config.ts`)
3. **Schema mismatch** — The frontmatter fields in your `.mdoc` file must match the schema exactly

### 10.4 `virtual:keystatic-config` Error

**Error:**
```
X [ERROR] Could not resolve "virtual:keystatic-config"
```

**Fix:** Add to `astro.config.mjs`:
```js
vite: {
  optimizeDeps: {
    exclude: ['@keystatic/astro'],
  },
  ssr: {
    noExternal: ['@keystatic/astro'],
  },
}
```

### 10.5 Production Build Fails

**Error:**
```
Cannot use server-rendered pages without an adapter.
```

**Cause:** Keystatic injects server-rendered API routes. Static builds need a server adapter.

**Fix:** Install an adapter for deployment:
```bash
npx astro add node --yes   # for Node.js deployment
# or
npx astro add vercel       # for Vercel
# or
npx astro add netlify      # for Netlify
```

The dev server works fine without an adapter.

### 10.6 Multiple Node Processes

If you get port conflicts, kill all Node processes and restart:
```bash
# PowerShell
Get-Process -Name "node" | Stop-Process -Force

# Then restart
npm run dev
```

### 10.7 Icons Rendering as Raw Text (e.g. "search", "home")

**Symptom:** A Material Symbols icon name shows as plain text instead of a glyph.

**Cause:** The icon name is not in the font subset. All icons use the single ligature font `public/fonts/material-symbols-subset.woff2`; if an icon name added to a template was not included when the subset was generated, it renders as its literal name (e.g. "search", "home") instead of a glyph.

**Fix:** Regenerate the subset with every icon name used in `src/`:
1. Collect the icon names (any `<span class="material-symbols-outlined">…</span>` text, `data-icon` values, or `icon:` config keys).
2. Build the Google Fonts css2 URL with `icon_names=` listing all names, e.g.:
   `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=arrow_forward,home,search,…&display=block`
3. Download the `.woff2` referenced in the API response over `public/fonts/material-symbols-subset.woff2`.
4. Hard refresh (`Ctrl+Shift+R`) to bypass the cached font.

Full root-cause history: `docs/PERFORMANCE_AUDIT_LOG.md` §§ 12.1–12.3 and `README.md` troubleshooting item 6.

---

## 11. Quick Reference

### Complete File Structure

```
.c:/_Dev/.personal blog/
├── astro.config.mjs          # Astro configuration (integrations, Vite)
├── keystatic.config.ts       # Keystatic CMS configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── src/
│   ├── content.config.ts     # Astro content collections schema
│   ├── content/
│   │   └── blog/             # Blog posts (.mdoc files live here)
│   │       └── nice.mdoc     # Example post
│   ├── pages/
│   │   ├── index.astro       # Home page
│   │   └── blog/
│   │       ├── index.astro   # Blog listing (card grid)
│   │       └── [slug].astro  # Individual post page
│   └── styles/
│       └── global.css        # Tailwind CSS import
└── public/
    ├── fonts/                # Self-hosted fonts (WOFF2)
    └── images/
        └── blog/             # Images uploaded via Keystatic
            └── nice/
                └── cover.png # Example cover image
```

### Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (needs adapter) |
| `npm run preview` | Preview production build |
| `npm install <pkg> --legacy-peer-deps` | Install packages (always use this flag) |

### Dependencies (package.json)

```json
{
  "dependencies": {
    "astro": "^6.3.7",
    "@astrojs/react": "^5.0.5",
    "@astrojs/markdoc": "^1.0.5",
    "@keystatic/core": "^5.0.6",
    "@keystatic/astro": "^5.0.6",
    "@tailwindcss/vite": "^4.3.0",
    "tailwindcss": "^4.3.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "@types/react": "^19.2.15",
    "@types/react-dom": "^19.2.3"
  }
}
```

### How Blog Posts Work

1. Create an `.mdoc` file in `src/content/blog/`
2. Frontmatter format:
   ```mdoc
   ---
   title: Nice
   date: 2026-05-22
   cover: /images/blog/nice/cover.png
   ---
   Your Markdoc content here.
   ```
3. Images go in `public/images/blog/` (not `src/content/blog/`)
4. The blog listing at `/blog` picks up new posts automatically
5. Individual posts are at `/blog/<slug>` (slug is the filename without extension)

### Creating Posts (Two Ways)

**1. Via Keystatic Admin UI** (visual editor)
- Go to http://127.0.0.1:4321/keystatic
- Click "Blog" → "Create"
- Fill in the form fields
- Keystatic handles file creation and image uploads automatically

**2. Manually** (file creation)
- Create `src/content/blog/my-post.mdoc`
- Add frontmatter with title, date, cover path
- Add content in Markdoc syntax
- Copy images to `public/images/blog/`

---

*Last updated: Aug 2026*