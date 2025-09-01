# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Crumpled Paper" is JP's personal blog built with Astro. It's a static site generator focused on technical content, featuring blog posts about software development, firmware, and Python applications.

## Development Commands

All commands are run from the root of the project:

- `npm install` - Install dependencies
- `npm run dev` - Start development server at localhost:4321
- `npm run build` - Build production site to ./dist/
- `npm run preview` - Preview build locally
- `npm run astro` - Run Astro CLI commands

## Architecture

### Content System
- **Blog posts** are stored in `src/content/` with date-prefixed directories (e.g., `2024-03-16-portable-python-app-1/`)
- Each post directory contains a `post.md` file with frontmatter (title, author, date, icon, preview)
- **Draft posts** are stored in `src/content/drafts/` and are obfuscated in production with SHA-256 hashes
- **Content discovery** is handled by `src/utils/get-posts.ts` using Astro's `import.meta.glob()` pattern

### Page Structure
- **Dynamic routing** via `src/pages/[post].astro` handles individual blog post pages
- **Static pages**: `index.astro` (homepage), `about.astro`, `credits.astro`
- **Path aliases** defined in tsconfig.json:
  - `@components/*` → `src/components/*.astro`
  - `@layouts/*` → `src/components/layouts/*.astro`
  - `@data/*` → `src/data/*.ts`

### Data Layer
- **Post processing** in `src/data/post.ts` handles:
  - Draft vs published post filtering
  - URL slug generation (obfuscated for drafts)
  - Timestamp conversion and sorting
  - RSS feed generation
- Posts are typed with the `Post` interface including title, author, slug, preview, timestamp, draft status, etc.

### Markdown Processing
The site uses extensive markdown processing via remark/rehype plugins:
- **Math rendering** with remark-math and rehype-katex
- **Mermaid diagrams** via custom plugin in `src/plugins/mermaid.ts`
- **Table of contents** generation with remark-toc
- **Custom directives** processed by `src/utils/rehype-aside.ts`
- **Auto-linking headings** with anchor links

### Styling
- Uses **Sass** for styling (sass-embedded dependency)
- **Prettier** configured with 4-space tabs, 100 character line width
- **VS Code** integration with Astro extension and format-on-save enabled

## Content Creation

To create new blog posts:
1. Create directory in `src/content/` with format `YYYY-MM-DD-post-title/`
2. Add `post.md` file with required frontmatter fields
3. For drafts, place in `src/content/drafts/` (visible in dev mode only)

## Site Configuration

- **Site URL**: https://www.crumpledpaper.tech
- **Sitemap generation** excludes draft pages
- **Development mode** shows draft posts with obfuscated URLs
- **Production mode** filters out drafts entirely