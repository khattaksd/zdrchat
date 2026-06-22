---
name: zdrchat
description: ZDR Chat app — Svelte 5 PWA for private AI chat. Use when working on the ZDR Chat app at app.zdr.chat. Covers git workflow, build, deploy, and project architecture.
---

# ZDR Chat — Agentic Workflow

## Git Workflow

**Branch from main, never from staging:**

```bash
git checkout main && git pull origin main
git checkout -b feat/your-feature-name
```

Work, commit, push. Then open a PR on GitHub (your branch → `main`). Merge via GitHub UI and check ✅ **"Delete source branch"** (auto-enabled). The branch auto-deletes from GitHub.

No `staging` branch is used. No GitHub Actions workflows. No manual `wrangler` commands.

## Build

```bash
npm run build      # vite build → dist/
```

## Deployment

Cloudflare Pages handles everything via Git integration:

- **Push to `main`** → deploys to production at **`app.zdr.chat`**
- **Push to any other branch** → deploys as a preview URL
- **No wrangler commands**, no GitHub Actions — the Cloudflare GitHub App detects pushes and deploys automatically

## Project Architecture

| Layer | Technology | Role |
|---|---|---|
| Framework | **Svelte 5** (runes: `$state`, `$derived`, `$props`, `$effect`) | UI components |
| Build | **Vite 8** + **TypeScript 6** | Dev server + production bundle |
| Styling | **Tailwind CSS v4** + CSS custom properties | 6 themes, 3 density modes |
| State | **Svelte writable stores** | Chat, Settings, Status stores |
| Storage | **Dexie.js** (IndexedDB via Dexie) | Conversations, messages, settings — all client-side |
| API | **`@openrouter/sdk`** | Direct browser-to-OpenRouter calls — no backend |
| PWA | **`vite-plugin-pwa`** (Workbox) | Offline support, installable |

## Key Files

```
src/
├── App.svelte              — Main app (welcome, chat, streaming, themes, density)
├── main.ts                 — Entry point (mounts App)
├── app.css                 — Global styles, theme CSS custom properties
├── lib/
│   ├── api/
│   │   ├── openrouter.ts   — OpenRouter streaming client
│   │   └── types.ts        — Model types, bucket definitions
│   ├── db/
│   │   └── dexie.ts        — IndexedDB schema + CRUD helpers
│   ├── store/
│   │   ├── chat.ts         — Conversations, messages, streaming state
│   │   ├── settings.ts     — API key, theme, default model, preferences
│   │   └── status.ts       — Token counters, session cost, credit balance
│   └── components/
│       ├── Sidebar.svelte       — Conversation list with search
│       ├── StatusBar.svelte     — Bottom bar: model, tokens, cost, credit
│       ├── ModelPicker.svelte   — Tabbed model browser by category
│       ├── SettingsPanel.svelte — Settings panel overlay
│       └── MaskedInput.svelte   — Text input with CSS mask for API keys
```

## Principles

- Everything runs client-side — **zero servers, zero accounts**
- **No analytics, no tracking, no telemetry**
- User data stays in the browser (IndexedDB + localStorage)
- The only network requests go directly to OpenRouter
- **Zero Data Retention** — conversations, keys, settings never leave the device

## Related Projects

- **Landing page**: `zdrchat-landing` — Astro site at `zdr.chat` deployed to Cloudflare Pages
- **App**: `zdrchat` — Svelte 5 PWA at `app.zdr.chat` (this project)