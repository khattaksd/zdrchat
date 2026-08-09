# Architecture Reference (accurate as of current source)

## State management — Svelte 5 runes

All shared state uses plain Svelte 5 **rune objects** (`$state`) exported from `.svelte.ts` modules — **not** `svelte/store` `writable()`.

- `store/chat.svelte.ts` — `chat`: `conversations`, `activeConversationId`, `messages`, `isStreaming`, `streamingContent`, `streamingReasoning`, `error`.
- `store/settings.svelte.ts` — `settings`: `apiKey`, `defaultModel`, `theme`, `accentColor`, `zdrOnly`, `noTraining`, `models`, `popularModelIds`, `popularModelAsOf`, `isInitialized`.
- `store/status.svelte.ts` — `status`: `currentModel`, `sessionTokensIn/Out`, `sessionCost`, `connectionStatus`, `creditBalance`, `isOnline`.

Components read/write these directly (e.g. `chat.messages = [...]`). There is no store factory, no subscriptions.

## Chat flow — lives in `App.svelte`

- `sendMessage()` — persists the user message via `addMessage()`, then calls `streamResponse()`; on a successful first turn it sets the conversation title.
- `streamResponse(convId)` — rebuilds the full message history from Dexie, prepends the conversation `systemPrompt` if set, then iterates `client.streamCompletion(...)`. Each chunk appends to `chat.streamingContent` and (when present) `chat.streamingReasoning` (DeepSeek R1-style reasoning). On `chunk.done` it accumulates `status.sessionTokensIn/Out` and `sessionCost` from `chunk.usage`. On success it persists the assistant message with tokens/cost.
- `resend()` — re-streams the last assistant reply against existing history (no duplicate user message).
- No `AbortController` today — streaming runs to completion or fails. Failures surface on `chat.error`; `ZDR_ENFORCED:` messages are stripped for display (OpenRouter rejects non-ZDR models when privacy toggles are on).

## OpenRouter client — `lib/api/openrouter.ts`

`OpenRouterClient` wraps `@openrouter/sdk` (configured with referer `zdr.chat`, title, category). Exposes:
- `fetchModels()` — live model list (cached in-memory unless `force`).
- `fetchCredits()`, `fetchKeyInfo()` — balance / key metadata.
- `fetchZdrEndpoints()` — Set of model IDs from `/endpoints/zdr`.
- `fetchPopularModels()` — top ~30 models aggregated from daily rankings.
- `streamCompletion({model, messages, zdrOnly, noTraining})` — async generator yielding `{content, reasoning?, done, usage?}`; passes `provider.zdr` / `data_collection: deny` per request when the flags are set.

## Model pipeline

Live list → `dedup.ts` (`deduplicateModels` keeps best variant per family, drops `~latest` aliases, sorts free-last) → grouping (`flagship`/`fast`/`specialized`/`all`) → popular ranking for the picker defaults. Nothing is hardcoded; prices come from the API (`types.ts` `Model.pricing` is parsed to a number).

## Persistence — `lib/db/dexie.ts`

Database `ZDRChatDB`, single version 1. Stores:
- `conversations` keyed by `id`, indexed by `updatedAt`.
- `messages` keyed by `id`, indexed by `conversationId` and `[conversationId+createdAt]`.
- `attachments` keyed by `id` (blob storage; schema present, not yet exercised in UI).
- `settings` keyed by `key` (apiKey, theme, defaultModel, zdrOnly, noTraining, density, accent).

Helpers: `createConversation`, `deleteConversation` (transactional cascade), `addMessage` (updates conversation `updatedAt`), `getConversationMessages`, `getSetting`/`setSetting`, plus `uid()` (randomUUID) and a monotonic `now()` clock for stable ordering.

Schema changes must stay backward-compatible (add fields with defaults; never drop or rename).

## Markdown rendering — `lib/markdown.ts`

`renderMarkdown(src)` → `marked.parse` (gfm + breaks) with a code renderer using highlight.js, then `DOMPurify.sanitize` against a strict allowlist. Post-hook opens links `target=_blank rel=noopener noreferrer`. Safe to call on partial/streaming chunks.
