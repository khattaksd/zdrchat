# Architecture Reference

## Key Files — Deep Dive

### `src/lib/store/chat.ts` — The most complex file
- Contains conversation CRUD, message streaming, abort logic
- Uses **Svelte writable stores** (not runes — stores work better for cross-component shared state)
- Streaming: `fetch()` with `ReadableStream` from OpenRouter SSE endpoint
- **AbortController** pattern: each streaming message gets its own controller, stored in a `Map`
- Key exports: `conversations`, `currentConversationId`, `streamingMessage`, `sendMessage()`, `abortStream()`

### `src/lib/store/settings.ts` — User preferences
- Persisted to `localStorage` via Dexie
- API key stored in **IndexedDB only** — never in localStorage or sessionStorage
- Manages: theme, density mode, default model, system prompt

### `src/lib/store/status.ts` — Observability
- Tracks token counters (prompt/completion/total per session)
- Session cost (USD, calculated from OpenRouter model pricing)
- Credit balance (if user has OpenRouter credits)

### `src/lib/api/openrouter.ts` — Network layer
- Direct browser-to-OpenRouter calls using `@openrouter/sdk`
- No server proxy — API key sent directly from browser via `Authorization` header
- Streaming via SSE: `POST https://openrouter.ai/api/v1/chat/completions` with `stream: true`
- Handles: model selection, temperature, system prompt injection, error recovery

### `src/lib/api/types.ts` — Model catalog
- `MODEL_BUCKETS` constant: categories (Featured, Free, Fast, Large, etc.)
- Each model entry: id, name, provider, context length, pricing, capabilities
- Used by `ModelPicker.svelte` to render tabs and model cards

### `src/lib/db/dexie.ts` — Persistence layer
- Dexie.js wraps IndexedDB with a promise-based API
- **Stores**: `conversations` (id, title, created, updated), `messages` (id, conversationId, role, content, timestamp, tokens), `settings` (key, value)
- **Schema upgrades**: must be backward-compatible — add new fields with defaults, never drop
- Used by chat store to persist on every message

### `src/App.svelte` — Main shell
- Layout: sidebar | chat area | panels (settings, model picker)
- Theme/density application via `data-theme` and `data-density` attributes on `<html>`
- Keyboard shortcuts, welcome screen, conversation routing

### `src/components/ModelPicker.svelte` — Tabbed model browser
- Groups models by category from `MODEL_BUCKETS`
- Each tab renders a searchable/filterable grid or list
- Click to select model (persisted to settings store)

### `src/components/SettingsPanel.svelte` — Settings overlay
- Theme picker, density toggle, API key input (MaskedInput)
- Default model selector, system prompt editor
- All settings persisted via settings store → Dexie

### `src/components/MaskedInput.svelte` — Sensitive input
- CSS mask for API keys (shows partial characters, hides rest)
- Uses `font-family: monospace` with a character-width mask
- No JavaScript-based masking — pure CSS approach