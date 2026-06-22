---
name: zdrchat
description: ZDR Chat app — Svelte 5 PWA for private AI chat at app.zdr.chat. Covers git workflow, build, deploy, architecture, and common operations.
license: MIT
metadata:
  project: zdrchat
  appUrl: https://app.zdr.chat
  landingUrl: https://zdr.chat
  stack:
    - Svelte 5 (runes)
    - Vite 8 + TypeScript 6
    - Tailwind CSS v4
    - Dexie.js (IndexedDB)
    - OpenRouter SDK (browser-direct)
    - vite-plugin-pwa (Workbox)
    - Cloudflare Pages (deploy)
triggers:
  - user mentions zdrchat, ZDR Chat, app.zdr.chat, or the project directory
  - user asks about building, deploying, or OpenRouter streaming in this project
---

# ZDR Chat — Agentic Workflow

## Decision Trees

### "I need to work on the code"
```
New feature / bug fix / cleanup / refactor / config change?
└── git checkout main (pull latest) → branch from main → PR to main
```

### "I need to build or dev"
| Task | Command | Note |
|------|---------|------|
| Dev server | `npm run dev` | Vite HMR at localhost:5173 |
| Build | `npm run build` | Outputs to `dist/` |
| Type-check | `npm run check` | svelte-check |
| Preview build | `npm run preview` | Serve `dist/` locally |

### "I need to deploy"
```
Push to GitHub
├── main branch → production (app.zdr.chat)
└── any other branch → preview URL
```
**Never run `wrangler deploy` manually** — Cloudflare Pages auto-deploys from Git.

## Critical Rules

- **Branch before changes** — always create a feature branch from `main` (not from another branch) before editing code. Cleanup, config fixes, and refactors are no exception. Use `git checkout main && git pull && git checkout -b my-branch`.
- **No staging branch** — branch from `main` only
- **No manual deploy** — Git push is the deploy mechanism
- **No server backend** — everything runs client-side
- **No analytics/tracking/telemetry** — zero data retention
- **No server-side storage** — IndexedDB + localStorage only
- **No build-time secrets** — no `.env`, no wrangler secrets; users provide keys at runtime
- **Don't remove PWA** — `vite-plugin-pwa` with Workbox is core

## Quick Architecture

```
src/
├── App.svelte, main.ts, app.css
└── lib/
    ├── api/openrouter.ts     — OpenRouter streaming (SSE from browser)
    ├── api/types.ts          — Model buckets, type definitions
    ├── db/dexie.ts           — IndexedDB schema (Dexie.js)
    ├── store/
    │   ├── chat.ts           — Conversations, messages, streaming state
    │   ├── settings.ts       — API key, theme, preferences
    │   └── status.ts         — Tokens, costs, credit balance
    └── components/
        ├── Sidebar.svelte, StatusBar.svelte, ModelPicker.svelte
        ├── SettingsPanel.svelte, MaskedInput.svelte
```

## Reference Files

| File | When to load |
|------|-------------|
| [references/rules.md](references/rules.md) | User asks about project rules, principles, or anti-patterns |
| [references/operations.md](references/operations.md) | User asks how to add a model, theme, or change PWA/Workbox config |
| [references/architecture.md](references/architecture.md) | Deep dive on key files — store patterns, streaming, Dexie schema |
| [references/deploy.md](references/deploy.md) | Deployment questions (this project or the landing page) |

## Adjacent Project

Landing page at **zdr.chat** (Astro site) lives in `~/code/zdrchat-landing`.