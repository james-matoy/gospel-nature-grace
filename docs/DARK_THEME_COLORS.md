# Dark Theme Color Implementation

## Overview

This document records the issues, fixes, and decisions made when implementing the dark theme color scheme across the Gospel, Nature, and Grace blog.

## color.md Specification

The source of truth for dark theme colors. Mapping of element → light value → dark value:

| Element | Light Value | Dark Value |
|---|---|---|
| Category label (REALIZATION) | `#434743` | `#BBA286` |
| Meta text (· dot, "1 min read", dates) | `#434743` | `#A4A8A3` |
| Title / headings | `#334537` | `#8CAB8E` |
| Body paragraph text | `#434843` | `#A2A9A2` |
| "Back to Reflections" link | `#434843` | `#92AF94` |
| Copyright text | `rgba(15,15,15,0.7)` | inherited |
| Icons (nature, auto_stories, water_drop) | `#616D5F` | inherited |

---

## Issues Encountered

### Issue 1: Dark mode colors not applying

**Symptom**: After updating `dark:` color classes in blog post page, the dark theme colors still showed the old scheme when toggling dark mode.

**Root Cause**: Tailwind v4 defaults `dark:` variant to `@media (prefers-color-scheme: dark)` — a media query based on the OS/browser preference. The site uses a class-based dark mode toggle (`<html class="dark">`), so the media query never matched when the user clicked the theme toggle button.

**Fix**: Added one line to `src/styles/global.css`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

This tells Tailwind to trigger `dark:` variants based on the `.dark` class on the `<html>` element (or any parent), matching the existing toggle implementation in `BaseLayout.astro`:

```javascript
html.classList.toggle('dark');
```

**File**: `src/styles/global.css`
**Line**: 2 (after `@import "tailwindcss";`)
**Status**: ✅ Fixed

---

### Issue 2: Footer background stays white in dark mode

**Symptom**: When toggling to dark theme, the footer background remained `#ffffff` while the blog body turned dark (`#1a1c1e`).

**Root Cause**: The footer used `bg-surface dark:bg-background`. Both `--color-surface` and `--color-background` are defined as `#f9f9fc` in the `@theme` block — so the dark mode variant was the same light color.

**Fix**: Changed `dark:bg-background` → `dark:bg-on-background` in the footer element.

```diff
- class="... bg-surface dark:bg-background ..."
+ class="... bg-surface dark:bg-on-background ..."
```

`--color-on-background` = `#1a1c1e` — matching the body background in dark mode.

**File**: `src/layouts/BaseLayout.astro`
**Element**: `<footer>` (line ~88)
**Status**: ✅ Fixed

---

## Light Mode vs Dark Mode Color Strategy

### Light mode: UNCHANGED

All light mode colors remain exactly as they were originally. The `color.md` spec only changed dark theme values, so:

- Body background: `#f9f9fc` (unchanged)
- Primary text: `#334537` (unchanged)
- Secondary text: `#715a3e` (unchanged)
- On-surface text: `#434843` (unchanged)
- Outline text: `#737872` (unchanged)
- Table cells: `#ffffff` background (unchanged)

### Dark mode: UPDATED via inline Tailwind classes

Instead of creating 9 new CSS custom properties (which was the first approach but added unnecessary variables), dark theme colors are applied directly as inline hex values in `dark:` classes:

| CSS class (light) | → | Dark class (new) |
|---|---|---|
| `text-secondary` (category) | → | `dark:text-[#bba286]` |
| `text-outline` (meta, dates) | → | `dark:text-[#a4a8a3]` |
| `text-primary` (titles) | → | `dark:text-[#8cab8e]` |
| `text-on-surface-variant` (body) | → | `dark:text-[#a2a9a2]` |
| Old `text-primary-fixed-dim` | → | `dark:text-[#8cab8e]` |
| Old `text-secondary-fixed-dim` (category) | → | `dark:text-[#bba286]` |
| Old `text-inverse-on-surface` (body) | → | `dark:text-[#a2a9a2]` |

---

## Files Modified

| File | Changes |
|---|---|
| `src/styles/global.css` | +1 line: `@custom-variant dark` directive |
| `src/layouts/BaseLayout.astro` | Footer bg fix + 10 dark:` text color updates |
| `src/pages/index.astro` | 9 dark:` color updates (hero, button, spotlight, quote) |
| `src/pages/about.astro` | 8 dark:` color updates (bio, blockquote, mosaic) |
| `src/pages/blog/index.astro` | 14 dark:` color updates (filters, cards, dates) |
| `src/pages/blog/[slug].astro` | 9 dark:` color updates (post header, body, navigation) |

**Total**: 6 files changed, 70 insertions(+), 69 deletions(-)

---

## Decision Log

| Decision | Rationale |
|---|---|
| Use `@custom-variant dark` instead of CSS variables | Simpler, direct hex values match color.md exactly without indirection. Less CSS bloat. |
| Only change `dark:` classes, never light mode | User explicitly requested: "dont touch anything that is not of my task. revert the color of light mode and footer back" |
| Use inline `dark:text-[#hex]` over new CSS variables | No need to add 9 variables when Tailwind arbitrary values work fine. Keeps the CSS theme block clean. |
| Footer bg uses `dark:bg-on-background` not `dark:bg-background` | `--color-background` is `#f9f9fc` — same as surface — so it never visibly changed in dark mode. `--color-on-background` is `#1a1c1e` which matches the body. |

---

## Dark Theme Color Map (Final)

```
Category labels ............ #BBA286
Meta / dates / secondary ... #A4A8A3
Titles / headings .......... #8CAB8E
Body paragraphs ............ #A2A9A2
"Back to Reflections" ...... #92AF94
Copyright .................. inherited (rgba opacity in light)
Icons ...................... inherited (outline in dark)
Background (footer/body) ... #1A1C1E
```

---

## Testing Checklist

- [x] Footer background turns dark in dark mode
- [x] Blog post body dark text matches color.md values
- [x] Home page hero and spotlight dark colors match
- [x] About page dark colors match
- [x] Blog listing page dark colors match
- [x] Mobile bottom nav dark colors match
- [x] Light mode completely unchanged
- [x] Dark mode toggle works via `.dark` class (not OS media query)