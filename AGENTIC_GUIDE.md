# Agentic Coding Guide — ZDR Chat

## Workflow

1. **Branch from main** — always start from `main`, never from `staging` or another feature branch
   ```bash
   git checkout main && git pull
   git checkout -b feat/your-feature-name
   ```

2. **Work and commit** — push your branch early, iterate

3. **Open a PR** — `feat/your-feature-name` → `main` on GitHub

4. **Merge and clean up** — merge via GitHub UI and check **"Delete source branch"** (enabled by default). The branch auto-deletes from GitHub.

5. **No staging branch** — the `staging` branch is not used. If it exists locally, delete it:
   ```bash
   git branch -D staging
   ```

## Deployment

- Cloudflare Pages deploys from **all branches**: `main` → production (`app.zdr.chat`), other branches → preview URLs
- No GitHub Actions workflows — Cloudflare Pages Git integration handles everything
- No manual `wrangler` commands for deploy

## Build

```bash
npm run build      # vite build → dist/
```

## Project Structure

- **Svelte 5** + **Vite 8** + **TypeScript**
- **Tailwind CSS v4** with CSS custom property theming (6 themes)
- **Dexie.js** (IndexedDB) for all persistence
- **`@openrouter/sdk`** for API calls — direct from browser, no backend
- **`vite-plugin-pwa`** (Workbox) for PWA/offline support

## Key Principles

- Everything runs client-side — no backend, no server
- No analytics, no tracking, no telemetry
- User data stays in the browser (IndexedDB + localStorage)
- The only network requests go directly to OpenRouter
