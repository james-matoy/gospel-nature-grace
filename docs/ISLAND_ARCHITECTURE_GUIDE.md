# Astro Island Architecture & React — Decision Guide

> *Created: 2026-06-29 — Updated: 2026-06-30*
> *Context: audit of gospel-nature-grace site with Astro DevTools showing "no island detected"*

---

## What is an "Island" in Astro?

An **island** is an interactive UI component written in a framework (React, Svelte, Vue, etc.) and rendered inside an `.astro` file with a `client:*` directive:

```astro
---
import SearchWidget from '../components/SearchWidget.tsx';
---
<!-- This is an island — React hydrates it on the client -->
<SearchWidget client:load />
```

The island's JavaScript is **lazy-loaded** — only the interactive component ships to the browser. Everything else is zero-JS static HTML.

### The client:* directives

| Directive | When it loads | Use case |
|-----------|---------------|----------|
| `client:load` | Immediately on page load | Critical interactive UI (nav menu, search bar) |
| `client:idle` | After the page is fully loaded | Non-critical interactivity |
| `client:visible` | When the element scrolls into view | Below-the-fold widgets |
| `client:media="(max-width: 768px)"` | When media query matches | Responsive features only needed on mobile |
| `client:only="react"` | Skip SSR, render only on client | Components that can't run on the server |

---

## Current state of this site

This site has **no islands** — and that's correct.

| Component | Implementation | Should be an island? | Why |
|-----------|---------------|---------------------|-----|
| Dark mode toggle | Inline `<script>` in `BaseLayout.astro` | No | Simple DOM toggle, no framework needed |
| Sticky header shadow | Inline `<script>` in `BaseLayout.astro` | No | Pure scroll event listener |
| Scroll reveal animations | Inline `<script>` in `BaseLayout.astro` | No | Standard `IntersectionObserver` |
| Every `.astro` component in `src/components/` | Static Astro (pure HTML) | No | No client-side state needed |

**React has been removed as a dependency** — `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom` were removed from `package.json` and `@astrojs/react` was removed from `astro.config.mjs`.

The project builds and runs cleanly with zero React code.

---

## When to use an island (React component)

### ✅ Do use React when you need:

**1. Client-side state & reactivity**
- An interactive form (with validation, field dependencies)
- A live search bar that filters results as the user types
- A shopping cart with add/remove/quantity logic
- A real-time counter, timer, or progress indicator

**2. Complex UI that's a pain in vanilla JS**
- An interactive calendar/date picker
- A rich text editor (TipTap, ProseMirror)
- A drag-and-drop board (like Trello)
- Data visualization (D3, Chart.js with React bindings)

**3. Integration with a non-Astro ecosystem**
- A component that relies on React context/state management
- A third-party React widget (e.g., comments via Giscus/Cusdis with a React wrapper)

### ❌ Don't use React when:

- All you need is a CSS class toggle → use an inline `<script>` block
- The interactivity is a simple click handler → use an inline `<script>` block
- You only need a scroll listener or `IntersectionObserver` → use an inline `<script>` block
- The component renders once and never changes → keep it as static `.astro`

---

## The vanilla‑JS sweet spot: inline `<script>` blocks

For simple interactivity, an inline `<script>` inside `.astro` is **better** than a React island:

| Metric | React island | Inline `<script>` |
|--------|-------------|-------------------|
| Bytes shipped | ~50 KB (React runtime) + component JS | ~0.5–2 KB |
| Time to interactive | Waits for hydration | Runs immediately |
| Bundle splitting | You must configure | Already part of the HTML |
| Dev complexity | JSX, hooks, imports | Plain JS |

**Example — a dark mode toggle as a React island would be terrible.** The React runtime alone is ~50x larger than the entire toggle script. The inline `<script>` approach this site uses is the right choice.

---

## When to add React back

If you later need any of these, re-add `@astrojs/react` and the React packages:

- A **comment system** with upvotes, replies, edit history
- A **Keystatic live preview** (if you want to show CMS edits in real time)
- An **interactive diagram** or **flowchart** with drag-to-edit
- A **search index** with faceted filtering
- Any third-party widget library that only ships React bindings

The decision rule is simple:

> *Could this feature be built in 10 lines of vanilla JS? If yes, don't use React. If it needs state management, complex DOM, or a library that only has React bindings, use an island.*

---

## Checking for islands yourself

Run the dev server and open Astro DevTools (press `ctrl+shift+i` or click the Astro icon in the browser toolbar):

```
npm run dev
```

- **DevTools header → Islands tab** — lists every island and its `client:` directive
- **No islands listed** = zero JavaScript from framework components (theme toggle and scroll effects are vanilla `<script>` blocks, not islands — they won't show up here)

To confirm no React code is bundled, check the build output:

```
npm run build
# Look at dist/ — you should see zero .js chunks for framework components
```

---

## Tailwind CSS v4 — why there's no `tailwind.config.mjs`

This project uses **Tailwind CSS v4** (installed via `@tailwindcss/vite`), which **does not use a config file**. All configuration is done in CSS via the `@theme` directive.

### Tailwind v3 vs v4

| Aspect | Tailwind v3 (old) | Tailwind v4 (this project) |
|--------|-------------------|---------------------------|
| Configuration file | `tailwind.config.js` / `tailwind.config.mjs` | **None** — config lives in CSS |
| Theme customization | `theme: { extend: { colors: { ... } } }` | `@theme { --color-primary: ... }` in `global.css` |
| Build integration | PostCSS plugin (`postcss.config.js`) | `@tailwindcss/vite` plugin in `astro.config.mjs` |
| Content scanning | `content: ["./src/**/*.{astro,html}"]` | **Automatic** — `@import "tailwindcss"` detects everything |
| Dark mode | `darkMode: "class"` | `@custom-variant dark (&:where(.dark, .dark *))` |

### Where the theme is defined

All theme values — colors, fonts, spacing, typography — are in **`src/styles/global.css`** (lines 4–99) using the `@theme` block:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary: #334537;
  --color-on-primary: #ffffff;
  --font-headline-md: "Libre Caslon Text", serif;
  --text-headline-md: 32px;
  --spacing-section-gap: 128px;
  /* ... everything else */
}
```

### If you see something about a missing config file

1. **Tailwind v3 tutorials/docs** will mention `tailwind.config.js` — ignore them, this project is on v4.
2. **The project builds correctly** without one — verified by `npm run build` succeeding.
3. **No file was deleted** — git history confirms `tailwind.config.mjs` never existed in this repo.

### Adding custom styles

In Tailwind v4, everything is done in CSS:

```css
/* Instead of tailwind.config.js theme.extend */
@theme {
  --color-brand: #ff6600;
}

/* Instead of @apply in v3 */
.my-class {
  @apply flex items-center gap-4;
}

/* Custom variants */
@custom-variant hover (&:hover);
```

---

## Summary

| Question | Answer |
|----------|--------|
| Does this site have islands? | No |
| Should it? | No |
| Is React needed? | No (removed) |
| Where is tailwind.config.mjs? | Doesn't exist — Tailwind v4 uses CSS-based config |
| When would you add React? | When adding a feature with real client-side state (search, comments, interactive diagrams) |
| What's the recommended approach for simple interactivity? | Inline `<script>` blocks in `.astro` files — lighter, faster, no hydration cost |