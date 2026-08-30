# Gospel, Nature, and Grace

A contemplative journal exploring the intersection of spiritual truth and the natural world, built with Astro, Tailwind CSS, and Keystatic.

## 🎯 Project Overview

Gospel, Nature, and Grace is a personal blog focused on spiritual reflections, biblical insights, and the beauty of God's creation. The site features a clean, minimalist design with dark/light theme support, optimized performance, and seamless content management.

## 🛠️ Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Astro | 6.3.7 | Static site generation with island architecture |
| **Styling** | Tailwind CSS | 4.3.0 | Utility-first CSS framework |
| **CMS** | Keystatic | Latest | Markdown-based content management |
| **Deployment** | Cloudflare Pages | - | Hosting and CDN |
| **Images** | Sharp | - | Image optimization |
| **Icons** | Material Symbols (subset) | - | Iconography (self-hosted WOFF2 ligature font) |
| **Fonts** | Google Fonts (self-hosted) | - | Typography (local WOFF2, no CDN) |

## 🚀 Setup

### Prerequisites
- Node.js 18+ (recommended LTS version)
- npm or pnpm
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/james-matoy/gospel-nature-grace.git
cd gospel-nature-grace

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Cloudflare configuration
```

## 🏗️ Architecture

### Key Features
- **Static Site Generation**: All pages are pre-rendered at build time for optimal performance
- **Island Architecture**: Interactive components are hydrated as needed (currently minimal JS)
  - [See Island Architecture Guide](docs/ISLAND_ARCHITECTURE_GUIDE.md) for implementation details
- **Content Collections**: Blog posts managed via Astro's content collections with Keystatic integration
- **Performance Optimized**: Lazy loading, eager loading for above-the-fold content, image optimization
  - [See Performance Audit Log](docs/PERFORMANCE_AUDIT_LOG.md) for optimization details
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: User-preference-based theming with localStorage persistence

### Performance Optimizations
- **Image Optimization**: All images use Astro's `<Image>` component with AVIF/WebP formats
- **Font Loading**: Self-hosted WOFF2 fonts preloaded with `crossorigin` + `fetchpriority="high"` (no Google CDN request chain; icon font uses `font-display: block` to prevent raw-ligature flashes)
- **Resource Prioritization**: `fetchpriority="high"` for LCP elements
- **Lazy Loading**: Below-the-fold images load as needed
- **Compression**: WebP images with quality optimization (55-70 range)

## 📁 Folder Structure

```text
/
├── public/                  # Static assets
│   ├── images/              # Optimized images (WebP format)
│   │   ├── blog/            # Blog post cover images
│   │   └── pages/           # Page-specific images
│   ├── fonts/               # Self-hosted fonts (Libre Caslon, Work Sans, Material Symbols subset)
│   └── favicon.png          # Site favicon
│
├── src/
│   ├── components/          # Reusable Astro components
│   │   ├── BlockQuote.astro
│   │   ├── ContactLinks.astro
│   │   ├── ImageCard.astro
│   │   ├── PageHero.astro
│   │   └── SectionDivider.astro
│   │
│   ├── content/             # Content collections
│   │   ├── blog/            # Blog posts (MD/MDoc format)
│   │   └── config.ts        # Content configuration
│   │
│   ├── layouts/             # Layout templates
│   │   └── BaseLayout.astro # Main site layout
│   │
│   ├── pages/               # Page routes
│   │   ├── about.astro      # About page
│   │   ├── blog/            # Blog routes
│   │   │   ├── [slug].astro # Individual blog post
│   │   │   └── index.astro  # Blog listing
│   │   ├── contact.astro    # Contact page
│   │   └── index.astro      # Home page
│   │
│   ├── styles/              # Global styles
│   │   └── global.css       # Tailwind CSS with custom theme
│   │
│   └── lib/                 # Utility functions
│
├── docs/                    # Project documentation
│   ├── PERFORMANCE_AUDIT_LOG.md # Performance optimization history
│   ├── ISLAND_ARCHITECTURE_GUIDE.md # Architecture decisions
│   └── *other-guides.md     # Additional documentation
│
├── scripts/                 # Automation scripts
│   ├── blog-publish.mjs     # Blog publishing helper
│   └── blog-publish.sh      # Shell version
│
├── .env.example             # Environment variable template
├── astro.config.mjs         # Astro configuration
├── keystatic.config.ts      # Keystatic CMS configuration
├── package.json             # Project dependencies
├── tailwind.config.cjs      # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── wrangler.toml            # Cloudflare Workers configuration
```

## 🏃‍♂️ Run Locally

```bash
# Start development server
npm run dev

# Start development server with full auto-cleanup
npm run dev:full-auto

# Build for production
npm run build

# Preview production build
npm run preview

# Check Astro project
npm run astro check

# Format code
npm run format
```

The development server runs on `http://localhost:4321` (or next available port). Hot module replacement is enabled for instant updates.

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Basic development server |
| `npm run dev:full-auto` | Development server with automatic Keystatic cleanup and optimization |
| `npm run dev:with-cleanup` | Development server with auto-cleanup |
| `npm run keystatic:auto` | Run Keystatic full auto-cleanup process |
| `npm run keystatic:cleanup` | Clean up empty folders |
| `npm run keystatic:delete` | Delete blog posts |
| `npm run keystatic:watch` | Watch for changes |
| `npm run keystatic:clear-cache` | Clear Astro cache |
| `npm run keystatic:auto-clean` | Auto-clean with basic settings |
| `npm run keystatic:auto-clean:verbose` | Auto-clean with verbose output |
| `npm run keystatic:rename-images` | Rename blog images |

## ☁️ Running Live in Cloudflare Pages

### Deployment
1. Connect your GitHub repository to Cloudflare Pages
2. Set the production branch to `main`
3. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: Add from `.env`

### Environment Variables
Required variables for Cloudflare deployment:
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
IMAGES_BUCKET=your_images_bucket
SESSION_KV=your_session_kv
```

### Production URL
After successful deployment, your site will be available at:
```
https://gospel-nature-grace.pages.dev/
```

## 🔧 Troubleshooting, Issues, and Fixes

### Common Issues & Solutions

#### 1. **Astro DevTools Warnings**
**Issue**: "Use the Image component" or "Unoptimized loading attribute"

**Solution**:
```astro
# Replace this:
<img src={image} alt="Description" />

# With this:
import { Image } from 'astro:assets';

<Image
  src={image}
  alt="Description"
  width={1000}
  height={562}
  format="avif;webp"
  loading="eager"  # Use "eager" for above-the-fold, "lazy" for below
/>
```

#### 2. **YAML Frontmatter Errors**
**Issue**: `YAMLException: unacceptable kind of mapping value`

**Solution**: Use double quotes for strings containing apostrophes:
```yaml
# Wrong:
description: 'God's work is amazing'

# Correct:
description: "God's work is amazing"
```

#### 3. **Missing Blog Cover Images**
**Issue**: Blog post shows alt text but no image

**Solution**:
1. Ensure both `cover.png` (source) and `cover.webp` (optimized) exist
2. Generate WebP version:
```bash
node -e "
const sharp=require('sharp');
sharp('cover.png')
  .resize(1200, 630, {fit: 'inside'})
  .webp({quality: 55})
  .toFile('cover.webp');
"
```

#### 4. **Cloudflare Build Failures**
**Issue**: `Could not resolve "../components/Component.astro"`

**Solution**: Ensure all imported components exist and are committed to Git.

#### 5. **Font Loading Issues**
**Issue**: FOIT (Flash of Invisible Text)

**Solution**: Fonts are self-hosted in `/fonts/*.woff2` and preloaded in `BaseLayout.astro`:
```astro
<link rel="preload" as="font" type="font/woff2" crossorigin
  href="/fonts/libre-caslon-text-normal-400.woff2" fetchpriority="high" />
```
Keep `crossorigin` on every font preload — fonts are always fetched in CORS
mode, and without it the preload is ignored and the font downloads twice. The
Material Symbols icon font uses `font-display: block` in `@font-face` so raw
icon names never flash before the glyphs load.

#### 6. **Icons Rendering as Raw Text (e.g. "search", "home")**
**Issue**: A Material Symbols icon name (ligature) displays as plain text instead of a glyph.

**Solution**: The name is missing from the icon-font subset. All icons render from the single ligature font at `public/fonts/material-symbols-subset.woff2`, so every icon name used in `src/` must exist as a ligature in it. Regenerate the subset for the full list of icons in use:
```bash
# 1. Collect every icon name used in src/ (span text, data-icon values, icon: config keys)
# 2. Request a subset for exactly those names, e.g.:
#    https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=arrow_forward,home,search,...&display=block
# 3. Download the .woff2 URL from the API response to public/fonts/material-symbols-subset.woff2
# 4. Verify glyphs render (hard refresh Ctrl+Shift+R to bypass the cached font)
```

### Performance Troubleshooting

**Slow LCP (Largest Contentful Paint)**:
- Add `fetchpriority="high"` to hero images
- Preload critical resources in `<head>`
- Ensure images have explicit `width` and `height` attributes
- Use `loading="eager"` for above-the-fold images

**High TBT (Total Blocking Time)**:
- Reduce JavaScript bundle size
- Defer non-critical scripts
- Use code splitting for large components

**Layout Shifts (CLS)**:
- Always specify image dimensions
- Reserve space for dynamic content
- Avoid inserting content above existing content

## 📚 Content Management

### Adding a New Blog Post
1. Create a new `.mdoc` file in `src/content/blog/`
2. Add frontmatter:
```yaml
---
title: "Your Post Title"
description: "SEO description under 130 characters"
date: YYYY-MM-DD
category: Reflection
cover: /images/blog/your-post/cover.webp
---
```
3. Write content in Markdown format
4. Add optimized images to `public/images/blog/your-post/`

### Blog Post Image Requirements
- **Format**: WebP (optimized) + PNG (source)
- **Dimensions**: 1200×630 pixels (16:9 aspect ratio)
- **Size**: Under 200KB for WebP version
- **Quality**: 55-60 for WebP compression

## 🔄 Git Workflow

### Branch Strategy
- `main`: Production-ready code (deploys to Cloudflare)
- `blog`: Blog content only (for content management)

### Publishing Workflow
```bash
# Work on blog content
git checkout blog
# Edit content, add images
git add src/content/blog/ public/images/blog/
git commit -m "chore(blog): add new post"
git push origin blog

# Merge to main for deployment
git checkout main
git merge blog
git push origin main
```

## 📖 Learning Resources

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Keystatic Documentation](https://keystatic.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)
- [Web Performance Guide](https://web.dev/learn-performance)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📜 License

© 2026 Gospel, Nature, and Grace. All rights reserved.