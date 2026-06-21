# ZDR Chat 🔒

**Private AI chat. Zero Data Retention. Zero servers.**

ZDR Chat is a fully private, serverless, BYOK chat PWA that talks to [OpenRouter.ai](https://openrouter.ai) directly from your browser. No accounts, no backend, no tracking — just paste your API key and go.

👉 **Live at [app.zdr.chat](https://app.zdr.chat)**

## Why ZDR Chat?

| Problem | Solution |
|---------|----------|
| Your data gets saved on someone else's server | **Zero servers** — everything stays in your browser |
| Every chat app wants your email, phone, or Google account | **No accounts** — just an API key |
| AI providers train on your conversations | **Zero Data Retention** — enforce ZDR at the OpenRouter account level |
| You need to trust someone else's infrastructure | **No backend** — the app is a static HTML file |
| Subscription fees for one AI model | **BYOK** — bring your own key, pay OpenRouter directly |

ZDR Chat is designed for privacy-conscious users who want the power of frontier AI models without surrendering their data or signing up for yet another service.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Svelte 5** | ~18KB gzipped total — smallest modern framework |
| Build | **Vite 6** + **TypeScript** | Fast dev, type-safe |
| Styling | **Tailwind CSS v4** + **CSS custom properties** | 6 themes, 3 density modes |
| State | **Svelte writable stores** | Simple, no deps |
| Storage | **Dexie.js (IndexedDB)** | Persistent conversations, settings, messages |
| API | **@openrouter/sdk** | Official SDK, auto-generated from OpenAPI spec |
| PWA | **vite-plugin-pwa (Workbox)** | Offline support, installable |
| Hosting | **Cloudflare Pages** | Global CDN, free tier |

## Features

- **No backend, no servers, no accounts** — purely client-side
- **BYOK** — bring your own OpenRouter API key
- **6 themes** — Dark, Light, Sepia, Nord, Catppuccin, Tokyo Night
- **3 density modes** — Tight, Cozy, Sparse (for readability)
- **Streaming chat** — real-time responses
- **Model picker** — tabbed browsing by category, ZDR filter, sort by size/price/name
- **Session tracking** — token counters, cost, credit balance
- **Conversation history** — searchable sidebar with smooth slide animation
- **Privacy first** — no analytics, no telemetry, no tracking
- **ZDR enforcement detection** — catches policy errors and guides users
- **PWA** — installable on desktop and mobile, works offline

## Quick Start

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys) — create a free account and copy your API key
2. Open [app.zdr.chat](https://app.zdr.chat)
3. Paste your key and start chatting
4. That's it. Your key stays in your browser. Nothing is sent anywhere except to OpenRouter.

## Data Sovereignty

ZDR Chat does not store, log, or transmit any user data outside your browser. All data is stored locally in IndexedDB — conversations, messages, settings, and your API key. The only network requests are directly to OpenRouter's API.

**Zero Data Retention (ZDR)** can be enforced at your OpenRouter account level:
1. Go to [openrouter.ai/settings/privacy](https://openrouter.ai/settings/privacy)
2. Enable "Zero Data Retention"
3. The app will automatically filter to only show ZDR-compliant models

## Development

```bash
git clone https://github.com/yourusername/zdrchat.git
cd zdrchat
npm install
npx vite --host
```

Build for production:
```bash
npx vite build
# Output in dist/
```

## Deployment

ZDR Chat is designed to be deployed as a static site on Cloudflare Pages:

- **Root domain**: `zdr.chat` — landing page
- **App**: `app.zdr.chat` — the PWA

```bash
npx wrangler pages deploy dist/ --project-name zdrchat
```

## License

MIT