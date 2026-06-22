# Rules, Principles & Anti-Patterns

## Design Principles

1. **Zero servers, zero accounts** — no auth, no backend, no API proxies. The app must work with a simple `npx serve dist`.
2. **Zero data retention** — conversations, API keys, and settings never leave the browser. No telemetry, no analytics, no crash reporting.
3. **Offline-first** — Dexie.js gives offline access to all past conversations. New messages require connectivity (OpenRouter API).
4. **No build-time secrets** — Everything is user-provided at runtime. The repo contains zero secrets or tokens.
5. **Column layout** — Three columns at full width (sidebar | chat | panels), collapsing gracefully to mobile.

## Svelte 5 Conventions

- Use Svelte 5 **runes** (`$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- Use **callback props** instead of `createEventDispatcher`
- Use **snippets** (`{#snippet}` / `{@render}`) instead of `<slot>`
- Use `onclick` not `on:click`
- Prefer `$state` for component-local reactivity; **writable stores** for cross-component shared state (the chat, settings, and status stores are writable stores by design)

## Code Anti-Patterns

```diff
- ❌ Using Svelte 4 syntax (on:click, createEventDispatcher, slots, $$props)
+ ✅ Use Svelte 5 runes and callback props

- ❌ Storing API key in localStorage
+ ✅ Store in IndexedDB via Dexie

- ❌ Importing from $lib/server or using server-side modules
+ ✅ Everything runs in the browser — check your imports

- ❌ Running wrangler commands to deploy
+ ✅ Push to GitHub — Cloudflare Pages does the rest

- ❌ Using environment variables for configuration
+ ✅ Let users configure everything in the Settings panel

- ❌ Hand-writing service worker logic
+ ✅ Let vite-plugin-pwa / Workbox generate it from config

- ❌ Fetching from a custom backend or proxy
+ ✅ Talk directly to OpenRouter from the browser

- ❌ Adding npm packages that require Node.js server runtime
+ ✅ Only browser-compatible packages (check for DOM/Web API dependencies)
```

## Dexie / IndexedDB Rules

- Schema upgrades must be **backward-compatible**: add fields with defaults, never drop or rename
- Do not store large blobs in IndexedDB (keep messages under ~1MB each)
- Use Dexie's `bulkPut` / `bulkDelete` for batch operations
- Wrap database operations in try/catch — IndexedDB can throw in private browsing mode

## OpenRouter Integration Rules

- Always send `Authorization: Bearer <user-key>` header
- Always set `stream: true` for chat completions
- Handle `AbortController` properly — cancel in-flight requests when user starts a new message
- Calculate token costs client-side using model pricing from `types.ts`
- Surface errors gracefully — OpenRouter can return 402 (insufficient credits), 429 (rate limited), or 5xx