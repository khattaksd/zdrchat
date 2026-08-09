# ZDR Chat — Agent Guide

Private AI chat PWA at **app.zdr.chat** (landing: zdr.chat). Svelte 5 (runes) + Vite + Tailwind v4 + Dexie/IndexedDB + `@openrouter/sdk`, talking to OpenRouter directly from the browser. **100% client-side** — no backend, no accounts, no analytics, no build-time secrets (BYOK at runtime).

## Commands

| Task        | Command            |
|-------------|--------------------|
| Dev server  | `npm run dev`      |
| Type-check  | `npm run check`    |
| Build       | `npm run build`    |
| Preview     | `npm run preview`  |

## Deploy (Cloudflare Pages, Git integration)

Push to GitHub → Cloudflare Pages auto-deploys. **`main` → production** (app.zdr.chat); any other branch → preview URL. **Never run `wrangler`.** No GitHub Actions (removed by design). Cloudflare is the DNS *and* the Pages host. No env vars/secrets — users supply keys at runtime.

## Git workflow

- Work on a **feature branch from `main`**: `git checkout main && git pull`, then `git checkout -b <branch>`, merge via PR.
- **No staging branch.** No direct commits to `main`. No manual deploy.

## Invariants (do not break)

- **Zero servers / zero data retention** — all data stays in the browser (IndexedDB/localStorage). Never add a backend, proxy, or telemetry.
- **State is Svelte 5 runes** (`$state`) — stores live in `.svelte.ts` files (e.g. `chat.svelte.ts`). They are **not** svelte/store `writable()` stores.
- **API key persisted in IndexedDB only** — never localStorage/sessionStorage (except optional session choice). Never log or echo the key.
- **Keep the PWA** (`vite-plugin-pwa` + Workbox) intact; don't hand-write service workers.

## File map (`src/`)

| Path | Role |
|------|------|
| `App.svelte` | Shell: init, theming/density, keyboard shortcuts, conversation routing, **streaming loop** (`sendMessage`/`streamResponse`) |
| `lib/api/openrouter.ts` | `OpenRouterClient`: models, credits, key info, ZDR endpoints, popular models, SSE `streamCompletion` (yields content + reasoning + usage) |
| `lib/api/types.ts` | `Model` type |
| `lib/api/dedup.ts` | Model dedup by family; grouping (`flagship`/`fast`/`specialized`/`all`); popular-model ranking |
| `lib/db/dexie.ts` | Dexie schema (`conversations`, `messages`, `attachments`, `settings`) + `uid()`/`now()` + CRUD helpers |
| `lib/markdown.ts` | marked + DOMPurify + highlight.js renderer → safe `{@html}` |
| `lib/store/chat.svelte.ts` | Rune state: conversations, activeConversationId, messages, isStreaming, streamingContent, streamingReasoning, error |
| `lib/store/settings.svelte.ts` | Rune state: apiKey, defaultModel, theme, accentColor, zdrOnly, noTraining, models, popularModelIds, isInitialized |
| `lib/store/status.svelte.ts` | Rune state: currentModel, session tokens/cost, connectionStatus, creditBalance, isOnline |
| `lib/components/*.svelte` | ChatArea, ConversationsPanel, ModelPicker, SettingsPanel, MaskedInput, Sidebar, StatusBar, WelcomeOverlay |
| `app.css` | Themes via `[data-theme]` (dark default + light/sepia/nord/catppuccin/tokyo-night) + densities `[data-density]` (tight/cozy/sparse) |

Note: the model catalog is **fetched live** from OpenRouter and deduped/grouped by `dedup.ts` — models are never hardcoded.

## Deep dives — load on demand

- `docs/architecture.md` — store/streaming patterns, Dexie schema, error handling
- `docs/operations.md` — how model grouping, themes, densities, PWA, shortcuts work
- `docs/deploy.md` — Cloudflare Pages deploy & rollback detail

## Adjacent project

Landing page (zdr.chat, Astro, Cloudflare Pages) lives in `~/code/zdrchat-landing`.
