# ZDR Chat — Architecture & Product Vision

> **Tagline:** *Private AI chat. No account. No tracking. Just paste your key and go.*
>
> A beautifully crafted, fully private chat app that puts everyday users in control of their own AI.
> Bring your own OpenRouter key. Everything stays on your device. Zero servers, zero accounts, zero tracking.

---

## 🎯 Product Vision

### Who this is for

**Non-technical people who value their privacy** — journalists, therapists, lawyers, students, writers,
anyone who wants a private AI assistant without signing up for yet another service, without their data
being used for training, without feeding the surveillance economy.

These users don't know what an "API key" is. They don't know what "BYOK" or "OpenRouter" means.
They just want to chat with an AI privately, on their own terms.

### What makes this different

| Competitor | Audience | Our advantage |
|------------|----------|---------------|
| **Pocket** | Developers who know APIs | Non-tech UX, beautiful UI, theming, status bar, privacy-first branding |
| **Vian AI Flow** | Developers who want privacy | OpenRouter native, model pricing display, credit dashboard, better UX |
| **OpenConvo** | Self-hosters with servers | Truly serverless (no server needed at all), PWA installable |
| **chatAir / sune** | Android power users | PWA cross-platform, no app store needed, same experience everywhere |
| **ChatGPT / Claude** | General public | **Privacy** — no account, no data collection, no subscription, full sovereignty |

### The ecosystem play

We are not just building a chat app — we are building a **consumer-friendly frontend for the OpenRouter ecosystem**.

Every user who signs up for an OpenRouter key through this app becomes part of OpenRouter's user base.
We benefit from OpenRouter's growth (more models, better pricing, more providers).
OpenRouter benefits from having a polished consumer entry point into their platform.

The app's homepage should direct users to OpenRouter to get a key — a natural funnel.
The app should display OpenRouter's credit balance, model pricing, and ZDR policy prominently.
This is a **symbiotic relationship**, not just an API wrapper.

> **A note on pricing:** Creating an OpenRouter account and generating an API key is **free**.
> There are **23 `:free` models** you can use at **$0 cost** — perfect for trying the app.
> Premium models (Claude Opus at $15/M input tokens, GPT-5 at $1.25/M, etc.) require
> adding credits to your OpenRouter account. The app shows you the cost before you send,
> and the status bar tracks your running total per session. No subscription, no surprises.

---

## 🧠 High-Level Concept

```
┌───────────────────────────────────────────────────────────────────┐
│                     ZDR Chat (in your browser)                  │
│                                                                   │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐ │
│  │ Onboarding   │ ──► │ Chat Interface  │ ──► │ Settings &      │ │
│  │ (API Key)    │     │ (Streaming,     │     │ Controls        │ │
│  │              │     │  Files, Markdown)│     │ (Models, Theme, │ │
│  └─────────────┘     └────────┬────────┘     │  Export, Memory) │ │
│                               │               └────────┬────────┘ │
│                               │                         │         │
│  ┌────────────────────────────▼─────────────────────────▼──────┐  │
│  │                   Store Layer (Zustand)                       │  │
│  └────────────────────────────┬──────────────────────────────────┘  │
│                               │                                     │
│  ┌────────────────────────────▼──────────────────────────────────┐  │
│  │                  Persistence Layer (IndexedDB + OPFS)           │  │
│  │  Conversations │ Messages │ Attachments │ Settings │ Memory ░░│  │
│  └────────────────────────────────────────────────────────────────┘  │
│                               │                                     │
│                               ▼                                     │
│                    ┌──────────────────────┐                         │
│                    │   OpenRouter API      │                         │
│                    │   (Browser direct)    │                         │
│                    └──────────┬───────────┘                         │
│                               │                                     │
│                               ▼                                     │
│                    340+ models across providers                      │
│                    (Anthropic, OpenAI, Google, Meta, Mistral...)    │
└───────────────────────────────────────────────────────────────────┘
        ▲                                            │
        │   🔒 Everything stays in your browser     │  ZDR policy
        │   (except the API call to OpenRouter)      │  (no retention)
        └────────────────────────────────────────────┘
```

### Core Principles

1. **Zero servers.** No backend. No auth. No accounts. No database. Just static files served from a CDN.
2. **Zero data retention.** OpenRouter's ZDR policy means even the proxy doesn't store conversations. Your data stays in your browser, period.
3. **Zero tracking.** No analytics. No telemetry. No third-party requests beyond OpenRouter's API.
4. **Maximum privacy UX.** The privacy promise is visible everywhere — the header has a green lock, the onboarding explains data flow, the settings show exactly what's stored and where.
5. **Maximum beauty.** Every pixel is deliberate. Animations, transitions, typography, spacing — the app should feel like a native macOS or iOS app, not a web page.

---

## 🏆 Competitive Landscape

### Direct competitors (same category)

| App | Stars | Stack | Truly serverless? | PWA? | OpenRouter? | For non-tech users? | UI polish |
|-----|-------|-------|-------------------|------|-------------|---------------------|-----------|
| **Pocket** | ★1 | React 19, Dexie, Vite | ✅ Yes | ✅ Basic SW | ✅ Full | ❌ Developer-oriented | ⚠️ Functional |
| **Vian AI Flow** | ★1 | JavaScript, vanilla PWA | ✅ Yes | ✅ Yes | ❌ No | ❌ Developer-oriented | ⚠️ Functional |
| **OpenConvo** | ★0 | Next.js | ❌ Needs server | ❌ No | ✅ Full | ❌ Developer-oriented | ⚠️ Functional |
| **Polyglot Studio** | ★0 | Next.js | ❌ Needs server | ❌ No | ✅ Full | ❌ Developer-oriented | ⚠️ Functional |
| **Lumous-AI** | ★1 | React, backend | ❌ Needs server | ❌ No | ✅ Full | ❌ Developer-oriented | ⚠️ Functional |
| **Idolon** | ★2 | Vanilla JS | ✅ Yes | ✅ Yes | ✅ Partial | ❌ Roleplay-focused | ⚠️ OK |
| **PlumeAI** | ★4 | TypeScript | ❌ Self-hosted | ❌ No | ✅ Partial | ❌ Developer-oriented | ⚠️ OK |
| **chatAir** | ★813 | Kotlin (Android) | ✅ Native app | ❌ No | ❌ No | ✅ General audience | ✅ Polished |
| **sune** | ★38 | Flutter | ✅ Native app | ❌ No | ✅ Yes | ⚠️ Tech-friendly | ✅ Polished |

### The gap we fill

No app in this space targets **non-technical privacy-conscious users** with a **truly beautiful, polished PWA** that is **OpenRouter-native**. Pocket comes closest but assumes developer literacy.

### Our differentiators

| What | How | Why it matters |
|------|-----|----------------|
| **Non-technical onboarding** | Step-by-step key setup with screenshots, friendly model names ("Smartest", "Fastest", "Free") | Grandma can use it |
| **Beautiful UI** | Gradients, glassmorphism, smooth animations, tight spacing, typography system | Feels premium, builds trust |
| **Status bar** | Persistent bottom bar: model, tokens ↑↓, cost, connection health, credit balance | Transparency, control |
| **Theming system** | 6+ built-in themes + custom accent color | Personalization |
| **PWA update banner** | Graceful "Update available → Restart" that saves state | Professional UX |
| **File intelligence** | Not just images — PDF, .docx, .xlsx extracted client-side | Real productivity |
| **Privacy-first UX** | Green lock always visible, plain-language privacy explanations | Trust for non-technical users |
| **OpenRouter ecosystem** | Credit dashboard, model pricing display, free model routing | Funnel for OpenRouter growth |
| **Svelte 5** | ~1.5KB gzip framework, buttery smooth on mobile | Performance matters for PWA |

---

## 📦 Storage Architecture

| Storage | Capacity | What It Stores | Persistence |
|---------|----------|---------------|-------------|
| **IndexedDB** (via Dexie.js) | ~50% of free disk | Conversations, messages, settings, small file blobs | ✅ Survives close |
| **OPFS** (Origin Private File System) | Same as disk | Large uploaded files (raw blobs: PDFs, images, docs) | ✅ Survives close |
| **sessionStorage** | 5–10 MB | API key (user chooses: "Remember for this session" or "Don't save") | ✗ Cleared on tab close |
| **localStorage** | 5–10 MB | Theme preference, last selected model, onboarding completion flag | ✅ Survives close |

### Data Model (Dexie Schema)

```typescript
// Version 1 (MVP)
interface Conversation {
  id: string;              // nanoID
  title: string;           // auto-generated from first message
  modelId: string;         // e.g. "anthropic/claude-sonnet-4"
  systemPrompt?: string;   // optional per-chat system prompt
  createdAt: number;       // monotonic timestamp
  updatedAt: number;       // monotonic timestamp
}

interface Message {
  id: string;
  conversationId: string;  // FK
  role: 'user' | 'assistant' | 'system';
  content: string;         // markdown text
  createdAt: number;
  attachmentIds?: string[];
  tokensIn?: number;
  tokensOut?: number;
  modelId?: string;
  costUsd?: number;
}

interface Attachment {
  id: string;
  conversationId: string;
  name: string;
  mime: string;
  size: number;
  blob: Blob;              // stored directly in IndexedDB for v1
  hash: string;            // SHA-256 for dedup
  kind: 'image' | 'pdf' | 'text' | 'other';
  createdAt: number;
}

interface Setting {
  key: string;
  value: unknown;
}

// Version 2 (polish)
//   Conversation: +tags[], tokenCount, cost, pinned
//   Message: +editHistory[]?, +parentId (for branching)

// Version 3 (advanced)
//   Attachment: blob → OPFS path (migrate from IndexedDB to OPFS)
//   +Memory/Recall tables (cross-session context)
```

### File Storage Strategy (v1 → v3)

| Phase | Storage Strategy | Rationale |
|-------|-----------------|-----------|
| **v1** | Store files as Blobs in IndexedDB via Dexie | Universal browser support, no OPFS complexity, files ≤50MB work fine |
| **v2** | Add OPFS for files >50MB. Keep IndexedDB for metadata + small files. | Better performance, avoid IndexedDB bloat |
| **v3** | Full OPFS integration + thumbnail cache + automated cleanup manager | Quota monitoring, lazy thumbnail generation, user-visible storage dashboard |

---

## 🌐 Network Architecture

```
┌─────────────────────────────────┐
│         Your Browser            │
│                                 │
│  ZDR Chat                   │
│    │                            │
│    ├── GET /api/v1/models ──► OpenRouter ◄──► Providers (Anthropic, etc.)
│    │   (340+ models w/ pricing) │
│    │                            │
│    ├── POST /api/v1/chat/ ──►  │   → stream: true (SSE)
│    │   completions              │   → multmodal (text + images)
│    │                            │   → provider routing
│    │                            │
│    ├── GET /api/v1/auth/ ──►   │   → credit balance
│    │   credits                  │   → key metadata
│    │                            │
│    └── GET /api/v1/rate_limit ──► │   → rate limit status
│                                 │
│  No cookies. No tracking.       │  ZDR: OpenRouter does NOT store
│  No analytics. No CDN deps.     │  your prompts or completions.
│  No third-party requests.       │
└─────────────────────────────────┘
```

### What we send to OpenRouter

```json
// POST /api/v1/chat/completions
// Headers: Authorization: Bearer <user-key>
//          HTTP-Referer: <our-app-url>
//          X-Content-Type-Options: nosniff

{
  "model": "anthropic/claude-sonnet-4",
  "stream": true,
  "messages": [
    { "role": "system", "content": "You are a helpful assistant..." },
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Analyze this image" },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }
      ]
    }
  ]
}
```

### What OpenRouter gives back (SSE stream)

```
data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","choices":[{"delta":{"content":" world"}}]}

data: [DONE]
```

Final chunk includes `usage` with token counts.

---

## 🧩 Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Svelte 5 (runes) | ~1.5KB gzip — smallest of any major framework. Compile-time reactivity. Minimal boilerplate. |
| **Build tool** | Vite 6 | Fastest HMR in the business. First-class PWA plugin support. |
| **PWA** | vite-plugin-pwa (Workbox) | Auto-generates service worker, manifest, precache manifest. Update strategy with `onNeedRefresh`. |
| **Styling** | Tailwind CSS v4 + CSS custom properties | Utility-first, zero-runtime, auto-purging. Custom properties enable infinite theming. |
| **State** | Zustand | ~1KB, framework-agnostic, works beautifully with Svelte via `$store` subscription. |
| **Database** | Dexie.js | Clean Promise-based wrapper over IndexedDB. Built-in versioned migrations. |
| **Router** | svelte-spa-router (hash-based) | No server needed. Hash routing works everywhere including static hosting. |
| **Markdown** | marked + rehype-highlight | Render AI responses with syntax-highlighted code blocks. |
| **Icons** | Lucide | Clean, consistent, tree-shakeable SVG icons. |
| **Streaming** | Fetch API + ReadableStream | Native browser APIs. No third-party SSE library needed. |
| **PDF parsing** | pdf.js (Mozilla) | De facto standard. Extracts text client-side. |
| **DOCX parsing** | mammoth.js | Converts .docx to clean text/markdown in the browser. |
| **XLSX parsing** | SheetJS (xlsx) | Reads Excel files and converts to formatted tables. |

---

## 🎨 UI / UX Design Philosophy

### Target user persona

**Name:** Maya, 34, journalist  
**Technical skill:** Can use email, Google Docs, install apps on her phone  
**Privacy concerns:** High — she covers sensitive topics and doesn't want her data tracked  
**Needs:** A private AI assistant to help draft articles, analyze documents, brainstorm ideas  
**Pain points:** Doesn't want another account, doesn't trust big tech with her data, found ChatGPT useful but doesn't want them training on her work

### Onboarding flow (critical — this is the make-or-break moment)

```
Screen 1: "Welcome to your private AI"
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   🔒                                                     │
│                                                         │
│   Welcome to your private AI assistant                   │
│                                                         │
│   No account. No tracking. Everything stays on           │
│   this device.                                           │
│                                                         │
│   [Get Started →]                                       │
│                                                         │
│   "Your conversations are yours alone. We don't          │
│    have a server to store them on."                      │
│                                                         │
└─────────────────────────────────────────────────────────┘

Screen 2: "Get your key (it's free)"
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Step 1: Get your private key                          │
│                                                         │
│   We use OpenRouter — they let you use AI models         │
│   without signing up for each one.                      │
│                                                         │
│   🆓 Creating an account is free.                        │
│   🆓 23 models are completely free to use ($0).          │
│   💳 Premium models cost pennies per conversation.       │
│                                                         │
│   1. Click the button below to open a new tab            │
│   2. Create a free account                               │
│   3. Click "Create Key" and copy the long code           │
│                                                         │
│   [Open openrouter.ai/keys →]  📋                        │
│                                                         │
└─────────────────────────────────────────────────────────┘

Screen 3: "Paste your key"
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Step 2: Paste your key here                           │
│                                                         │
│   [▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸▸]           │
│                                                         │
│   🔒 Your key stays on this device. Never sent anywhere  │
│   except directly to OpenRouter when you chat.           │
│                                                         │
│   [I'll paste it later]            [Connect →]          │
│                                                         │
└─────────────────────────────────────────────────────────┘

Screen 4: "Pick your AI"
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Pick your AI                                           │
│                                                         │
│   ┌──────────────────┐  ┌──────────────────┐           │
│   │ 🌟 Smartest      │  │ ⚡ Fastest        │           │
│   │ Claude Opus      │  │ GPT-4o Mini      │           │
│   │ Best for complex  │  │ Best for everyday │           │
│   │ thinking (paid)   │  │ quick answers (paid)         │
│   └──────────────────┘  └──────────────────┘           │
│                                                         │
│   ┌──────────────────┐  ┌──────────────────┐           │
│   │ 💰 Free          │  │ 🎨 Creative      │           │
│   │ Llama 3 / Qwen   │  │ Gemini 2.5 Pro   │           │
│   │ **$0 per message**│  │ Great for writing │           │
│   │ (rate limited)    │  │ (paid)            │           │
│   └──────────────────┘  └──────────────────┘           │
│                                                         │
│   [Show all 340+ models...]  (for power users)          │
│                                                         │
└─────────────────────────────────────────────────────────┘

Screen 5: "Chat"
┌──────────────────────────────────────────────────────────┐
│ 🔒 Private Chat       🌟 Smartest          ⚙️  🫨  🌙   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   Welcome! I'm your private AI assistant.                 │
│                                                          │
│   Everything you type here stays in your browser.         │
│   No one else can see it — not even us.                  │
│                                                          │
│   What would you like to explore today?                  │
│                                                          │
│──────────────────────────────────────────────────────────│
│  📎 Attach files                              Send ▶     │
│  [Type your message...]                                  │
├──────────────────────────────────────────────────────────┤
│ 💬 Smartest  │  ↑ 0 ↓ 0  │  $0.00 session  │ 🟢 live    │
└──────────────────────────────────────────────────────────┘
```

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ 🔒 Private Chat       🌟 Smartest          ⚙️  🫨  🌙   │  ← Header
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│  📋      │  Chat messages                                │
│          │  • Streaming typewriter effect                │
│  History │  • Markdown + syntax-highlighted code blocks  │
│  Sidebar │  • Inline images (drag to resize)             │
│          │  • File previews (PDF rendered inline)        │
│  🔍      │  • "Thinking..." shimmer animation            │
│  Search  │  • Smooth fade-in for new messages            │
│          │                                               │
│  📁      ├───────────────────────────────────────────────┤
│  Settings │  📎 [Attach]  [Type a message...]     [Send] │  ← Input
│  Panel   │                                               │
│          │  ^ Drag & drop files here                      │
├──────────┴───────────────────────────────────────────────┤
│ 💬 Smartest (Claude Opus) │ ↑ 1,245 ↓ 3,421 │ ~$0.08    │  ← Status
│ 🟢 live • 340 models • Balance: $12.34                 │
└──────────────────────────────────────────────────────────┘
```

### Key UI Elements

| Element | Description |
|---------|-------------|
| **Header bar** | Green lock/shield icon (always visible — the privacy promise). Model selector with friendly name + technical name. Quick actions: settings, command palette, theme toggle. |
| **Sidebar** | Conversation history list. Searchable. Collapsible on mobile (slide-over drawer). Shows date groups, model used for each conversation. |
| **Chat area** | Clean message bubbles. AI responses stream with typewriter cursor animation. Code blocks have copy, fold, language label. Images render inline. Files show as expandable cards. |
| **Input area** | Multi-line textarea with auto-resize. Send on Enter (Shift+Enter for newline). Attachment bar shows uploaded files as chips. Drag & drop zone. Send button disabled when empty or streaming. |
| **Status bar** | Persistent bottom bar. Left: model name (clickable to switch). Center: tokens up/down for current session, running cost. Right: connection health indicator, credit balance. |
| **Settings panel** | Slide-over from right. Sections: API Key, Models, Theme, Memory, Data Management, About. Clean forms, no jargon. |
| **Update banner** | Subtle fixed-position toast when new version is available: "✨ Update available — saves your chat and restarts" with [Update] [Later] buttons. |
| **Command palette** | `Cmd+K` or `Ctrl+K`. Searchable list: switch model, toggle theme, new chat, search history, export data, settings. |
| **Empty state** | Beautiful illustration + short text. "Your private AI awaits. Start typing or upload a document." |

### Theming

- Powered by CSS custom properties. One theme = one set of ~30 variables.
- Built-in themes: **Light** (clean white/gray), **Dark** (deep black/charcoal), **Sepia** (warm paper tones), **Nord** (frosty blue-gray), **Catppuccin Mocha** (warm brown/pink), **Tokyo Night** (deep blue/purple).
- User can pick an **accent color** (hue picker) that applies across all themes.
- Theme + accent persist in IndexedDB.

### Animations & Micro-interactions

| Element | Animation |
|---------|-----------|
| Message appearance | Fade-in + subtle slide-up (200ms, eased) |
| Streaming text | Smooth typewriter cursor — not a raw text dump |
| Status bar updates | Token counter increments with a subtle number tick animation |
| Sidebar open/close | Slide with spring physics |
| Model switching | Crossfade |
| File upload | Upload progress bar + success checkmark |
| Theme switch | Instant (CSS variables swap) |
| Online/offline | Status dot eases between green/yellow/red with a pulse |
| Send button | Press effect + slight scale |

---

## 📁 File Upload & Processing Pipeline

### Supported file types and processing

```
User drops file
      │
      ├── Image (jpg, png, gif, webp, svg, heic)
      │     → Resize: Canvas API (max 2048px longest edge)
      │     → Compress: JPEG 85% quality (browser-native)
      │     → Convert HEIC to JPEG (libheif-wasm or skip for v1)
      │     → Attach as multimodal content block to current model
      │     → If model doesn't support images: warn and suggest a vision model
      │
      ├── Text / Code (txt, md, csv, json, js, py, rs, html, css, yaml, toml, xml, sql, sh)
      │     → Read as UTF-8 text
      │     → Inject into message: "📎 filename.ext\n\n```{language}\n{content}\n```"
      │     → Automatically detect language from extension
      │
      ├── PDF
      │     → Extract text with pdf.js (Mozilla)
      │     → Mark pages: "📎 filename.pdf\n\n--- Page 1/12 ---\n{text}"
      │     → Truncate if exceeds ~80% of context window (warn user)
      │
      ├── Word (.docx)
      │     → Extract text with mammoth.js
      │     → Preserve heading hierarchy, lists, bold/italic where possible
      │     → Inject as structured text
      │
      ├── Excel (.xlsx, .xls)
      │     → Extract with SheetJS
      │     → Format as markdown table per sheet
      │     → Inject: "📎 data.xlsx — Sheet 1\n\n| Col A | Col B |\n| ..."
      │
      ├── PowerPoint (.pptx)
      │     → Extract text from slides (mammoth.js can't do this — use pptx.js or extract text manually)
      │     → Inject: "📎 deck.pptx — Slide 1\n\n{slide text}"
      │     → Note: v2 feature
      │
      └── Other / unsupported (.zip, .mp3, .mp4, .exe, etc.)
            → Show inline message:
              "This file type can't be processed yet.
               Try copying the content and pasting it instead."
            → Still store the file in IndexedDB/OPFS for reference
```

### Upload UX

```
User drags file → File appears as chip in attachment bar:
  ┌──────────────────────────────────────────────────┐
  │ 📎 report.pdf (2.4 MB)  📊 data.xlsx (45 KB)     │
  │                                         [Send]   │
  │ [Type a message about these files...]            │
  └──────────────────────────────────────────────────┘
  → Process files in background (extract text, resize images)
  → Show processing status per file: "📎 report.pdf ✓ Extracted 12 pages"
  → On send: inject extracted content as context + user message
```

---

## 🔐 Privacy & Security

### The privacy promise (displayed prominently)

> **"Your conversations live in this browser only. Even we can't see them."**

This is not a footer footnote. It's in the header, the onboarding, the settings — always visible.

### API Key Handling

| Storage option | UX label | Persists? |
|---------------|----------|-----------|
| **In-memory** | "Only while this tab is open" | ❌ Lost on tab close |
| **sessionStorage** | "Remember for this session" | ❌ Lost when browser closes |
| **IndexedDB** (never by default) | "Save on this device (use caution)" | ✅ Survives restart, but user must opt in |

- Default: in-memory only. User must explicitly choose to persist.
- Clear warning if they choose to persist: "Anyone with access to this device could use this key."
- One-click "Clear key" button in settings.
- Key is never sent anywhere except in the `Authorization` header to OpenRouter.

### No tracking guarantee

- **Zero analytics.** No Google Analytics, no Plausible, no Fathom, no self-hosted counters. Nothing.
- **No telemetry.** The app never phones home. No version check, no feature flag polling.
- **No CDN dependencies that track.** All assets are self-hosted or loaded from the service worker cache.
- **No error reporting.** Sentry, Rollbar, etc. are not included. Errors stay in the browser console.

### OpenRouter ZDR (Zero Data Retention)

OpenRouter explicitly states they do not store prompts, completions, or API keys beyond the time needed to relay the request. This is a core part of the privacy story and should be prominently featured in the app.

> **However, not all providers routed through OpenRouter agree to ZDR.** See the
> [Data Sovereignty & Provider Policy Guidance](#-data-sovereignty--provider-policy-guidance)
> section for a full breakdown of provider policies, privacy badges, and user-facing controls.

---

## 🚀 PWA & Self-Updating

### Service Worker Strategy

- Generated and managed by `vite-plugin-pwa` (Workbox).
- **Precache:** App shell (index.html, JS, CSS, icons, fonts).
- **Runtime cache:** Never cache API responses. Network-only for all OpenRouter endpoints.
- **Navigation precache:** SPA fallback for all routes.

### Update Strategy: Prompt and Graceful

```
1. User is using v1 of the app (old service worker active)
2. New version deployed (v2) with updated assets
3. On next page load or tab focus:
   a. Browser downloads new service worker in background
   b. New SW installs but doesn't activate (waits)
   c. `onNeedRefresh` callback fires in the app
4. App shows a subtle banner:
   ┌──────────────────────────────────────────────────┐
   │  ✨ Update available — saves your chat           │
   │  and restarts                    [Update] [Later] │
   └──────────────────────────────────────────────────┘
5. User clicks "Update":
   a. Current conversation state is flushed to IndexedDB
   b. App posts message to SW: skipWaiting()
   c. SW activates, claims clients
   d. Page reloads — user is on v2 with all data intact
```

### Offline Behavior

| Scenario | Behavior |
|----------|----------|
| App shell loaded, user opens app | Works. All cached assets served from SW. |
| User browses chat history | Works. Conversations loaded from IndexedDB. |
| User tries to send a message | Detected as offline. Show inline: "You're offline. Messages will send when you reconnect." |
| User was streaming and loses connection | Stream cuts. Show error: "Connection lost. The AI's response was cut short. You can retry." |
| User comes back online | App detects via `navigator.onLine` + `window.online` event. Status bar updates from red to green. |

---

## 🔌 OpenRouter API Surface — What We Leverage

OpenRouter provides a rich OpenAI-compatible API with extras. Here's exactly what we use and what we build ourselves:

### ✅ We use from OpenRouter (don't reinvent)

| Endpoint / Feature | What it gives us | How we use it |
|-------------------|------------------|---------------|
| `GET /api/v1/models` | 340+ models with id, name, description, pricing, context_length, architecture, top_provider | Dynamic model picker. Never hardcode model lists. Always up to date. |
| `POST /api/v1/chat/completions` | Streaming SSE, multimodal, provider routing, prompt caching, reasoning effort | The core chat engine. Our main API call. |
| `openrouter/free` model | Routes to whichever free models are available ($0 cost) | Free tier for users who want to try without spending |
| `openrouter/auto` | Routes to best available provider with auto-failover | Reliability without complexity |
| `GET /api/v1/auth/credits` | Credit balance: total, used, free, payg | Show user their remaining balance in status bar |
| `GET /api/v1/auth/key` | Key metadata: label, usage, limits | Display "Key: work-laptop • 45% of monthly cap used" |
| `GET /api/v1/rate_limit` | Rate limit status per model | Show "12 requests remaining this minute" |
| Provider routing headers | `openrouter/provider`, `openrouter/transports` | Power users can specify provider preferences |
| Anthropic prompt caching | `cache_control: ephemeral` in message | ~90% cost reduction on repeated system prompts |
| BYOK integrations | Users link their OpenAI/Anthropic/Google keys at OpenRouter | Users bring their existing accounts |

### 🔨 We build ourselves

| Need | Implementation | Complexity |
|------|---------------|------------|
| **Streaming client** | `fetch()` + `ReadableStream` to read SSE chunks | ~80 lines |
| **Model categorization** | Group 340 models into friendly buckets: Smartest, Fast, Creative, Free, Code, Vision | ~50 lines of classification logic |
| **Token counting** | Client-side estimate via `tiktoken`-like approach or use OpenRouter's `usage` response | ~30 lines |
| **Cost calculation** | `usage.prompt_tokens × model.pricing.prompt + usage.completion_tokens × model.pricing.completion` | ~20 lines |
| **Credit display** | Format `credits` response into human-readable "Balance: $12.34" | ~20 lines |
| **File extraction** | Client-side libraries for PDF, DOCX, XLSX | Wrapper per type |
| **Storage layer** | Dexie schema + OPFS integration | The deepest build |
| **PWA + SW** | vite-plugin-pwa config + update banner component | Config + one component |

**Key insight:** The hardest parts (provider routing, model hosting, billing aggregation, failover) are all handled by OpenRouter. Our app is a **thin, beautiful client** on top — which is exactly the right ratio of effort to value.

---

## 🛡️ Data Sovereignty & Provider Policy Guidance

This is a critical responsibility for our app. **Not all models and providers on OpenRouter agree to the same data policies.** Some retain your data, some train on it, and some do neither. Our app must guide users transparently.

### How OpenRouter Manages Data Policies

OpenRouter works with each provider to understand their data policies and structures them per-endpoint. They keep a live, programmatic list of ZDR-compliant endpoints at:

> **`GET https://openrouter.ai/api/v1/endpoints/zdr`**

This endpoint returns **635+ ZDR-compliant endpoints** (as of June 2026) — any model routed through one of these endpoints has a **Zero Data Retention** policy, meaning the provider does NOT store your prompts or completions after processing.

If OpenRouter cannot ascertain a clear policy for an endpoint, they take a **conservative stance** and assume the endpoint both retains and trains on data.

### OpenRouter's Own Policy (ZDR by Default)

| What | Policy |
|------|--------|
| **Prompt & response content** | ❌ **NOT stored** unless you explicitly opt in |
| **Metadata** (tokens, latency, model used, timestamp) | ✅ Stored for reporting, ranking, and usage logs |
| **Private Input/Output Logging** | 🔲 **Opt-in only.** Makes prompts visible in your logs for debugging. Off by default. |
| **OpenRouter Use of Data** | 🔲 **Opt-in only.** Allows OpenRouter to use data to improve the product. You get a 1% discount. Off by default. |
| **Anonymous categorization** | Samples a small number of prompts anonymously for ranking. Never associated with your account. |

### Provider Data Policy Matrix

Different providers have different policies for **data retention** (storing your data) and **training** (using your data to improve their models). Here's a summary of major providers available through OpenRouter:

| Provider | ZDR (No Retention) | No Training | Notes |
|----------|-------------------|-------------|-------|
| **Anthropic** (Claude) | ✅ Yes (API) | ✅ Yes | Explicitly does not train on API calls. ZDR via API endpoints. |
| **OpenAI** (GPT) | ⚠️ 30-day retention | ✅ Yes | Retains data for 30 days for abuse monitoring. Does NOT train on API data (since March 2023). |
| **Google** (Gemini via Vertex) | ✅ Yes | ✅ Yes | Vertex AI has ZDR. Google does not train on Vertex API calls. |
| **Google** (Gemini via AI Studio) | ⚠️ Varies | ⚠️ May train | AI Studio consumer tier may use data for improvement. Check endpoint. |
| **Meta** (Llama via providers) | ✅ Depends on provider | ✅ Depends | Meta itself doesn't train, but the hosting provider's policy applies. |
| **Mistral** | ✅ Yes | ✅ Yes | Does not train on API data. ZDR policy. |
| **Cohere** | ✅ Yes | ✅ Yes | Does not train on API data. |
| **DeepSeek** | ⚠️ Unclear | ⚠️ May train | Data retention and training policies are less transparent. OpenRouter marks these conservatively. |
| **Amazon Bedrock** | ✅ Yes | ✅ Yes | ZDR. No training on API data. |
| **DeepInfra** | ✅ Yes | ✅ Yes | Third-party host. ZDR, no training. |
| **Together AI** | ✅ Yes | ✅ Yes | Third-party host. ZDR, no training. |
| **Groq** | ✅ Yes | ✅ Yes | ZDR, no training. |
| **Novita** | ✅ Yes | ✅ Yes | ZDR, no training. |
| **Venice** | ✅ Yes | ✅ Yes | Privacy-focused provider. ZDR, no training. |

> **Important:** This is a simplified guide. Actual policies can vary per endpoint. The definitive source is OpenRouter's per-endpoint data at `/api/v1/endpoints/zdr` and each provider's terms of service.

### Sovereign AI (EU In-Region Routing)

OpenRouter offers **EU in-region routing** for enterprise customers. When enabled, your prompts and completions are processed **entirely within the European Union** — they never leave the EU at any point in the request lifecycle. This satisfies GDPR and EU AI Act requirements for data residency.

- Use the base URL `https://eu.openrouter.ai/api/v1` for EU-only routing
- Browse EU-eligible models at [openrouter.ai/models?region=eu](https://openrouter.ai/models?region=eu)
- Enterprise feature — contact OpenRouter to enable

### How Our App Surfaces This to Users

Non-technical users don't know what "ZDR" means or which providers train on data. We make it simple:

#### 1. Privacy Badge Per Model

Each model bucket and individual model shows a privacy badge:

```
🌟 Smartest
  Claude Opus 4        🔒 ZDR   🚫 No training   💰 $15/M tokens
  GPT-5                ⚠️ 30d retention  🚫 No training  💰 $1.25/M tokens
  Gemini 2.5 Pro (AI Studio)  ⚠️ May train  💰 $1.25/M tokens  ← Warning!
  Gemini 2.5 Pro (Vertex)     🔒 ZDR   🚫 No training  💰 $2.50/M tokens
```

#### 2. Privacy Toggles in Settings

Simple toggles: **"Only use models that don't store my data"** and **"Only use models that don't train on my data"** — when enabled, the app only routes to endpoints from the `/api/v1/endpoints/zdr` list and passes `data_collection: "deny"` to OpenRouter.

```
┌──────────────────────────────────────────────────┐
│ 🔒 Privacy Settings                              │
│                                                  │
│ [✅] Only use models that don't store my data    │
│      (Zero Data Retention)                       │
│                                                  │
│ [✅] Only use models that don't train on my data │
│      (No training)                               │
│                                                  │
│ Current model: Claude Opus 4                     │
│   🔒 ZDR: Yes    🚫 Training: No                 │
│   Data stays in EU: Yes (via Vertex)             │
└──────────────────────────────────────────────────┘
```

#### 3. Conversation-Level Indicator

The header always shows the privacy status of the current model:

```
🔒 ZDR  |  🚫 No training  |  🌍 EU region
```

If a user switches to a model that trains on data or retains it, a clear warning appears:

```
⚠️ This model may store or train on your conversations.
   Check the privacy badge above for details.
   [Switch to a private model]  [I understand, continue]
```

#### 4. Privacy-First Default Bucket

The **Free** (💰) and **Smartest** (🌟) model buckets default to showing only ZDR-compliant endpoints. Users must explicitly opt into non-ZDR models. This aligns with OpenRouter's own conservative stance — if a policy is unclear, we assume the worst.

### OpenRouter API Controls We Surface

| Control | OpenRouter Mechanism | Our UX |
|---------|---------------------|--------|
| **ZDR enforcement** | `provider.zdr: true` in request body | "Only use privacy-protected models" toggle |
| **Data collection deny** | `provider.data_collection: "deny"` in request body | "Only use models that don't train" toggle |
| **Per-model-group ZDR** | Account-level settings (Anthropic, OpenAI, Google, other) | Auto-enforced when global toggle is on |
| **Per-request ZDR** | `provider.zdr: true` per API call | Always set when user has privacy mode enabled |
| **EU routing** | `https://eu.openrouter.ai` base URL | Enterprise feature, shown in advanced settings |

### Privacy Warning: Frontier Models

Some of the most capable models (frontier models from major providers) have **different data policies depending on which endpoint they're accessed through**:

| Model | Via | ZDR? | Trains? |
|-------|-----|------|--------|
| Claude Opus 4 | Anthropic API | ✅ | ✅ No |
| Claude Opus 4 | Amazon Bedrock | ✅ | ✅ No |
| Claude Opus 4 | Google Vertex | ✅ | ✅ No |
| GPT-5 | OpenAI API | ⚠️ 30d retention | ✅ No |
| GPT-5 | Azure (via OpenRouter) | ✅ ZDR | ✅ No |
| Gemini 2.5 Pro | Google Vertex AI | ✅ | ✅ No |
| Gemini 2.5 Pro | Google AI Studio | ⚠️ Unclear | ⚠️ May train |

OpenRouter's routing layer may serve the same model through different providers depending on availability, latency, and pricing. Our app will surface **which provider** is handling each request so users can make informed choices.

### What We Persist Locally

We store the user's **privacy preferences** (ZDR toggle, training toggle) in IndexedDB so they persist across sessions. These preferences are applied to every API call. We never override a user's privacy choice for cost or speed reasons.

---

## 📐 Model Categorization (Friendly Names for Non-Tech Users)

OpenRouter returns 340+ models with IDs like `anthropic/claude-sonnet-4-20250514`. We group them into **five friendly buckets**:

| Bucket | Friendly Name | Selection Logic | Example models | Pricing |
|--------|---------------|----------------|----------------|---------|
| **Smartest** | 🌟 Smartest | Top ~5 most capable models | Claude Opus 4, GPT-5, Gemini 2.5 Pro | Paid (~$3–$75/M tokens) |
| **Fast** | ⚡ Fastest | Quick-response, everyday chat | GPT-4o Mini, Claude Haiku, Gemini 2.0 Flash | Paid (~$0.15–$2/M tokens) |
| **Creative** | 🎨 Creative | Writing, brainstorming | Claude Sonnet 4, Mistral Large, Gemini 2.5 Pro | Mixed (paid or free) |
| **Free** | 💰 Free | All `:free` models — **$0 cost** | 23 models via openrouter/free | **$0 — always free** |
| **Code** | 💻 Code | Programming tasks | DeepSeek V3, Qwen 2.5 Coder, Claude Opus 4 | Tiers vary |
| **Vision** | 👁️ Vision | Image-capable models | All multimodal from Smartest/Fast buckets | Matches source bucket |

Users see friendly names by default. Power users can toggle to "Show all 340+ models" and pick by ID.

---

## 🗺️ Implementation Roadmap

### Phase 0 — Foundation (Week 1)
- [ ] Scaffold: Svelte 5 + Vite + TypeScript + Tailwind v4
- [ ] vite-plugin-pwa setup (manifest, SW generation, offline fallback)
- [ ] Dexie schema + migrations (v1: conversations, messages, settings)
- [ ] OpenRouter API client (models list, streaming completions, credits)
- [ ] Zustand stores (chat, settings, status)

### Phase 1 — Core Chat (Week 2)
- [ ] Key onboarding flow (3 screens: Welcome → Get Key → Paste Key)
- [ ] Basic chat UI (send message, stream response, render markdown)
- [ ] Model selector (friendly buckets + advanced mode)
- [ ] Message persistence (IndexedDB read/write)
- [ ] Status bar (model name, token counter, connection health)
- [ ] Dark/Light theme toggle

### Phase 2 — Privacy Controls (Week 3)
- [ ] Privacy badge per model (ZDR status, training policy, data retention)
- [ ] Privacy toggles in settings (ZDR only, no training, both)
- [ ] Conversation-level privacy indicator in header bar
- [ ] Warning dialog when switching to a non-privacy model
- [ ] Model picker filters (show only ZDR-compliant models)
- [ ] Active model privacy info in status bar
- [ ] Privacy preferences persisted in IndexedDB
- [ ] Integration with OpenRouter's `provider.zdr` and `data_collection` API parameters
- [ ] Fetch and cache the ZDR endpoints list from `/api/v1/endpoints/zdr`
- [ ] All 6 themes (Light, Dark, Sepia, Nord, Catppuccin, Tokyo Night)
- [ ] Accent color picker
- [ ] Animations (message entrance, streaming cursor, status bar ticks)
- [ ] Responsive mobile layout (sidebar drawer, compact header)
- [ ] PWA update banner (graceful update flow)
- [ ] Command palette (Cmd+K)
- [ ] Keyboard shortcuts

### Phase 3 — Polish & Beauty (Week 4)
- [ ] Image upload + multimodal content blocks
- [ ] Text file upload (read + inject)
- [ ] PDF extraction (pdf.js)
- [ ] DOCX extraction (mammoth.js)
- [ ] XLSX extraction (SheetJS)
- [ ] Attachment UI (chip bar, processing status, preview)
- [ ] Conversation history search

### Phase 4 — Files & Power (Week 5)
- [ ] Export conversations (JSON, Markdown, HTML)
- [ ] Import conversations from backup
- [ ] Storage quota monitor (settings: "Managing 45 MB of data")
- [ ] Clear all data button (with confirmation)
- [ ] Privacy dashboard (what's stored, where, how to delete)
- [ ] API key management (show/edit/clear, session vs persistent)
- [ ] System prompt editor

### Phase 5 — Advanced (Week 6+)
- [ ] OPFS for large file storage
- [ ] Conversation branching (parentId)
- [ ] Token budget alerts
- [ ] Context window indicator
- [ ] Multi-model comparison
- [ ] WASM image optimization (squoosh)
- [ ] iOS PWA compatibility testing + fixes
- [ ] Chrome PWA install prompt optimization

---

## 🧪 Known Challenges & Mitigations

| Challenge | Severity | Mitigation |
|-----------|----------|------------|
| **Non-tech users don't know what an API key is** | 🔴 Critical | Step-by-step onboarding with screenshots. "Copy this long code" language. Open in new tab button. |
| **Users may unknowingly use a model that trains on their data** | 🔴 Critical | Privacy badge per model, ZDR toggle, warning dialogs on model switch, privacy-first default buckets. See [Data Sovereignty section](#-data-sovereignty--provider-policy-guidance). |
| **Safari IndexedDB limit (~1GB)** | 🟡 Medium | Detect quota via StorageManager. Warn user. Offer OPFS overflow in v2. |
| **API key security (user persists key)** | 🟡 Medium | Default: in-memory only. Clear warning before persisting. One-click clear. |
| **OpenRouter rate limits (429)** | 🟡 Medium | Handle gracefully. Show "Rate limited — retrying in X seconds." Automatic backoff. |
| **Context window overflow** | 🟡 Medium | Approximate token count client-side. Warn before exceeding model's limit. Offer to summarize old messages. |
| **iOS PWA quirks** | 🟡 Medium | Test on real device. No push notifications, limited storage, some CSS quirks. Accept and document. |
| **Large file uploads (>50MB)** | 🟢 Low | Cap at 50MB for v1 (IndexedDB limit). OPFS in v2 removes this limit. |
| **Non-tech user loses their API key** | 🟢 Low | They can always create a new one at OpenRouter. It's a key, not an account. |

---

## 📁 Project Structure

```
zdrchat/
├── public/
│   ├── icons/                  # PWA icons (512, 192, 72, maskable)
│   ├── screenshots/            # Onboarding screenshots (openrouter.ai/key steps)
│   └── favicon.svg
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── openrouter.ts       # Full OpenRouter client
│   │   │   ├── models.ts           # Model categorization (friendly buckets)
│   │   │   └── types.ts            # TypeScript types for all API responses
│   │   ├── db/
│   │   │   └── dexie.ts            # Dexie schema + migrations
│   │   ├── store/
│   │   │   ├── chat.ts             # Zustand — active conversation + messages
│   │   │   ├── settings.ts         # Zustand — theme, api key, preferences
│   │   │   └── status.ts           # Zustand — status bar state
│   │   ├── processing/
│   │   │   ├── files.ts            # File type detection + extraction pipeline
│   │   │   ├── images.ts           # Image resize/compress (Canvas API)
│   │   │   ├── pdf.ts              # PDF text extraction wrapper
│   │   │   ├── docx.ts             # DOCX text extraction wrapper
│   │   │   └── xlsx.ts             # XLSX text extraction wrapper
│   │   ├── utils/
│   │   │   ├── tokens.ts           # Token counting (approximate)
│   │   │   ├── cost.ts             # Cost calculation from model pricing
│   │   │   ├── crypto.ts           # SHA-256 hashing for file dedup
│   │   │   └── format.ts           # Formatting helpers (dates, numbers, etc.)
│   │   └── components/
│   │       ├── WelcomeFlow.svelte      # Onboarding screen sequence
│   │       ├── ChatView.svelte         # Main chat area (messages + input)
│   │       ├── ChatBubble.svelte       # Individual message (user + assistant)
│   │       ├── StreamingText.svelte    # Typewriter streaming text component
│   │       ├── MarkdownRenderer.svelte # Markdown + code highlighting
│   │       ├── ChatInput.svelte        # Textarea + attachment bar + send
│   │       ├── AttachmentBar.svelte    # File chips with processing status
│   │       ├── Sidebar.svelte          # Conversation history
│   │       ├── StatusBar.svelte        # Bottom bar: model, tokens, cost, health
│   │       ├── HeaderBar.svelte        # Top bar: lock, model picker, actions
│   │       ├── ModelPicker.svelte      # Friendly buckets + advanced list
│   │       ├── SettingsPanel.svelte    # Full settings (slide-over)
│   │       ├── CommandPalette.svelte   # Cmd+K quick actions
│   │       └── UpdateBanner.svelte     # PWA update notification
│   ├── themes/
│   │   ├── light.css
│   │   ├── dark.css
│   │   ├── sepia.css
│   │   ├── nord.css
│   │   ├── catppuccin.css
│   │   └── tokyo-night.css
│   ├── app.css                        # Global styles + CSS custom properties
│   ├── app.svelte                     # Root component — router + layout
│   └── main.ts                        # Entry point
├── index.html
├── vite.config.ts
├── svelte.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 📐 Key Technical Decisions Summary

| Decision | Choice | Reason |
|----------|--------|--------|
| **Framework** | Svelte 5 | Smallest bundle of any major framework (~1.5KB gzip). Compile-time reactivity. Best PWA performance. |
| **No backend** | Ever | The entire value proposition is zero-server privacy. No excuses. |
| **Styling** | Tailwind v4 + CSS variables | Zero-runtime CSS. Custom properties enable infinite themes. Tiny production output. |
| **Database** | Dexie.js | Only sane way to use IndexedDB. Versioned migrations, clean queries, small footprint. |
| **State** | Zustand | ~1KB. Framework-agnostic. Works with Svelte's reactive stores or directly. |
| **Router** | Hash-based SPA | No server config. Works on any static host. No 404 handling needed. |
| **API transport** | Fetch + ReadableStream | No SSE library needed. Native browser API. Full control over streaming. |
| **File storage (v1)** | IndexedDB Blobs via Dexie | Universal browser support. Skip OPFS complexity for launch. |
| **File processing** | Client-side libraries only | pdf.js, mammoth.js, SheetJS all work in the browser. No server needed. |
| **Model list** | Live from OpenRouter API | Never hardcoded. Always reflects latest models and pricing. |
| **PWA strategy** | Prompt-based update | Save state before reload. Never disrupt active conversations. |
| **Key storage default** | In-memory only | User must opt into persistence. Privacy-first by default. |
| **Analytics** | None | No tracking. No telemetry. No phone-home. Hard requirement. |

---

## 📖 OpenRouter Documentation Reference

OpenRouter has excellent documentation with some handy features for developers:

| Pattern | URL | Use Case |
|---------|-----|----------|
| **Clean Markdown** | Append `.md` to any page URL | Read docs in raw Markdown (great for grep, diffs, code review) |
| **Section Index** | Append `/llms.txt` to any section URL | Get a structured index of all pages in a section |
| **MCP Server** | `https://openrouter.ai/docs/_mcp/server` | Integrate docs into Claude Code, Cursor, or other MCP-compatible tools |
| **API Spec** | `https://openrouter.ai/docs/api-reference` | Full REST API reference for OpenRouter endpoints |

**Examples:**

- ZDR docs in Markdown: `https://openrouter.ai/docs/guides/features/zdr.md`
- ZDR section index: `https://openrouter.ai/docs/guides/features/zdr/llms.txt`
- MCP integration: `https://openrouter.ai/docs/_mcp/server`
- All LLMs.txt: `https://openrouter.ai/llms.txt` (full documentation index)

This pattern works for **any page** on OpenRouter's documentation site — useful for automated checks, AI context injection, or offline reading.

---

> *"A private AI chat app where the only data leaving your browser is the prompt to OpenRouter — and even they don't keep it. Beautiful, simple, and yours."*

---

## Ethics & Economics

### Not Affiliated

ZDR Chat is **not affiliated with OpenRouter.ai**. We have no commercial relationship — no referral fees, no commissions, no revenue sharing. The app is an independent, open-source frontend.

### No Monetization

The app is a static PWA on Cloudflare's free tier. Hosting costs ~$0/month. We have no servers, no database, no analytics. There are no plans to introduce ads, subscriptions, or paid tiers.

### Why We Built This

Privacy-first AI should be the default, not a premium feature. We wanted a tool we could trust, and we believe everyone deserves the same.

### Cost Philosophy

- **No subscription** — add $1–$10 to your OpenRouter account and it lasts as long as you use it
- **Pay OpenRouter directly** — we never touch your money
- **Cost tracking built in** — the status bar shows session cost and remaining credit
- **Free models available** — try the app without spending a cent
- **Agentic coding note** — large context windows burn tokens faster; the status bar helps you stay aware