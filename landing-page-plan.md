# ZDR Chat Landing Page — Build Plan

## Overview

Build the public-facing landing page for **ZDR Chat** (`zdr.chat`) — a serene, modern, privacy-first site with blog, docs, and heavy SEO/AI optimization. Separate from the PWA repo.

**Repo:** `khattaksd/zdrchat-landing` (separate from `zdrchat` PWA repo)
**Stack:** Astro (static, deployed to Cloudflare Pages)
**Domain:** `zdr.chat` → Cloudflare Pages `zdrchat` project

---

## Color Palette (Emerald + Charcoal)

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary bg | `#0F172A` | `slate-900` | Hero, footer, dark sections |
| Surface | `#F8FAFC` | `slate-50` | Card backgrounds, content areas |
| Accent | `#10B981` | `emerald-500` | Buttons, links, highlights |
| Accent dark | `#059669` | `emerald-600` | Button hover |
| Text primary | `#1E293B` | `slate-800` | Body text on light bg |
| Text on dark | `#E2E8F0` | `slate-200` | Body text on dark bg |
| Heading on dark | `#F1F5F9` | `slate-100` | Headings on dark bg |
| Muted | `#64748B` | `slate-500` | Secondary text |
| Border | `#E2E8F0` | `slate-200` | Dividers, card borders |

**Vibe:** Serene, trustworthy, modern. Not playful, not corporate — friendly and calm, like a well-designed privacy tool.

---

## Route Structure

```
/               → Landing page (hero, features, how it works, CTA)
/blog/          → Blog listing (cards, paginated)
/blog/[slug]    → Blog post (MDX, readable, with TOC)
/docs/          → Docs overview (category cards)
/docs/[slug]    → Doc page (sidebar nav, MDX)
/privacy/       → Privacy & data handling page
/404            → Custom 404
```

---

## Content Outline

### Landing Page (`/`)

**Hero:**
```
Headline: Your Private AI. Your Keys. Zero Servers.
Subline: ZDR Chat is a serverless, BYOK chat app powered by OpenRouter.
           No accounts. No logs. No backend. Your data never leaves your browser.
CTA:      [Launch ZDR Chat →]  →  app.zdr.chat
Tagline:  🔒 300+ models • BYOK • Browser-local
```

**Feature Cards (4):**
```
🔐  Bring Your Own Key
    Paste your OpenRouter API key. It's stored in your browser only.
    Never sent anywhere except directly to OpenRouter.

🧠  300+ Models — One Interface
    All OpenRouter models in one place. Smartest, fastest, free, code, vision —
    neatly bucketed so you always pick the right one.

🏠  Zero Servers
    No backend. No accounts. No sign-up. The entire app runs in your browser
    as a static PWA. Deployed to Cloudflare Pages — that's it.

💾  Zero Data Retention
    Every message, every token, every setting stays in your browser's IndexedDB.
    Close the tab — it's gone from the world.
```

**How It Works (3 steps):**
```
1. 🔑 Paste your OpenRouter key
2. 🎯 Pick a model from the browsable picker
3. 💬 Start chatting — encrypted, local, private
```

**Privacy Pledge:**
```
ZDR (Zero Data Retention) means exactly that.

Your conversation history lives in your browser's IndexedDB.
Your API key is stored locally.
We run no servers, maintain no databases, log nothing.

Configure privacy enforcement at the OpenRouter account level,
and every request is ZDR-guaranteed at the network layer.
```

**Footer:**
```
ZDR Chat · OpenRouter Privacy Settings · GitHub · Docs · Blog
Made for the privacy-conscious. Not affiliated with OpenRouter.
```

### Blog Posts (3 starters)

**Post 1: "What is ZDR Chat?"**
- Intro to the app
- Problem: most AI chat apps send your data to their servers
- Solution: browser-local, BYOK, zero servers
- How ZDR enforcement works at OpenRouter level
- Link to app

**Post 2: "Zero Data Retention — What It Actually Means"**
- Explain the 3 layers: account → guardrail → request
- Why per-request toggles are misleading
- How to configure ZDR in OpenRouter settings
- What data stays where

**Post 3: "Why Bring Your Own Key?"**
- Privacy benefits of BYOK
- No vendor lock-in
- Full control over which models you use
- Cost transparency (pay OpenRouter directly)
- How the app never sees your key (stored locally)

### Docs Pages (4 starters)

**Getting Started:**
- Quick setup guide
- How to get an OpenRouter key
- How to paste it in the app
- Picking your first model

**Privacy & Security:**
- Data flow diagram (text)
- What's stored in IndexedDB
- What's sent to OpenRouter
- How to clear your data
- OpenRouter privacy settings walkthrough

**Features:**
- Model picker (buckets, ZDR filter, sort controls)
- Streaming responses
- Theme system (6 themes)
- Density modes (tight/cozy/sparse)
- Conversation management (sidebar, search, history)

**FAQ:**
- Is this really zero server?
- Do you see my conversations?
- What happens if I clear browser data?
- Can I use it offline?
- Is the PWA installable?
- How is this different from ChatGPT/Claude web?

---

## SEO & AI Optimization Checklist

- [ ] Semantic HTML (`<article>`, `<nav>`, `<section>`, proper `<h1>`-`<h6>` hierarchy)
- [ ] Each page has unique `<title>` and `<meta name="description">`
- [ ] OpenGraph + Twitter Card meta tags for social sharing
- [ ] JSON-LD structured data (Organization, WebSite, BlogPosting, Article)
- [ ] Sitemap.xml (Astro sitemap integration)
- [ ] RSS feed for blog (Astro RSS integration)
- [ ] Canonical URLs on every page
- [ ] Robots.txt
- [ ] Breadcrumb structured data on blog/docs
- [ ] Proper `lang` attribute
- [ ] Fast Core Web Vitals (Astro's zero-JS default helps)
- [ ] Lazy loading images, proper alt text
- [ ] Responsive design (mobile-first)
- [ ] Accessible (contrast ratios, focus states, ARIA where needed)

---

## Project Structure

```
zdrchat-landing/
├── public/
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── FeatureCard.astro
│   │   ├── HowItWorks.astro
│   │   ├── PrivacyPledge.astro
│   │   ├── CTAButton.astro
│   │   ├── BlogCard.astro
│   │   ├── DocSidebar.astro
│   │   └── SEO.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro    (nav, footer, global SEO)
│   │   ├── BlogLayout.astro     (blog post layout)
│   │   └── DocLayout.astro      (docs with sidebar)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── docs/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── privacy.astro
│   │   └── 404.astro
│   ├── content/
│   │   ├── blog/
│   │   │   ├── what-is-zdr-chat.md
│   │   │   ├── zero-data-retention-explained.md
│   │   │   └── why-bring-your-own-key.md
│   │   └── docs/
│   │       ├── getting-started.md
│   │       ├── privacy-and-security.md
│   │       ├── features.md
│   │       └── faq.md
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

---

## Tech Specs

**Framework:** Astro 5.x (latest)
**CSS:** Tailwind CSS v4 (via Astro integration)
**Content:** Astro Content Collections (MDX for blog/docs)
**SEO:** `@astrojs/sitemap` + manual OpenGraph/JSON-LD
**RSS:** `@astrojs/rss` for blog feed
**Deployment:** Cloudflare Pages (connected to GitHub repo)
**Analytics:** None (zero tracking — consistent with the app's philosophy)

---

## Cloudflare Pages Setup

**Project name:** `zdrchat` (already reserved)
**Build command:** `npm run build`
**Build output:** `dist/`
**Custom domain:** `zdr.chat` (add in Cloudflare dashboard after first deploy)

---

## Implementation Order

1. Scaffold Astro project with Tailwind, Content Collections, sitemap, RSS
2. Set up base layout (Header, Footer, global styles, SEO component)
3. Build landing page sections (Hero, Features, How It Works, Privacy Pledge, CTA)
4. Build blog listing + post layout, write 3 starter posts
5. Build docs overview + doc layout with sidebar, write 4 starter docs
6. Build privacy page
7. Add all SEO metadata (JSON-LD, OpenGraph, sitemap, RSS)
8. Custom 404 page
9. First deploy to `zdrchat.pages.dev`
10. Add custom domain `zdr.chat` in Cloudflare dashboard

---

## Handoff

This plan is designed to be picked up in a fresh session. Start by:

```bash
mkdir -p ~/code && cd ~/code
git init zdrchat-landing && cd zdrchat-landing
# Scaffold Astro + Tailwind + Content Collections
# Build in order above
# Push to github.com/khattaksd/zdrchat-landing
# Connect to Cloudflare Pages project `zdrchat`
# Add custom domain `zdr.chat`
```