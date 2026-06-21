# OpenChat PWA 🔒

> **Private AI chat. No account. No tracking. Just paste your key and go.**

A beautifully crafted, serverless chat PWA that puts **everyday users** in control of their own AI.
Bring your own OpenRouter key. Everything stays in your browser. Zero servers, zero accounts, zero tracking.

---

## 🌟 Why this exists

Most AI chat apps either:
- **Collect your data** (ChatGPT, Claude, Gemini — they train on your conversations)
- **Require a subscription** ($20/month whether you use it or not)
- **Assume you're a developer** ("BYOK", "API key", "provider routing" — jargon everywhere)

We built something different.

**OpenChat is for people who value their privacy but aren't techies.**
Journalists. Therapists. Lawyers. Students. Writers. Anyone who wants a private AI assistant
without signing up for another service, without their data being mined, without paying for features they don't use.

---

## ✨ Features

| Feature | What it does |
|---------|--------------|
| 🔒 **100% private** | No accounts, no servers, no tracking. Your data stays in your browser. |
| 🗝️ **Bring your own key** | Create a free OpenRouter account, get an API key, paste it in. Use 23 free models at $0 cost, or add credits for premium models (Claude Opus, GPT-5, etc.). You pay only for what you use — no subscription. |
| 📱 **PWA — installs like an app** | Add to your home screen. Works offline (browsing history). No app store needed. |
| 🌈 **Beautiful, themeable UI** | 6 built-in themes (Light, Dark, Sepia, Nord, Catppuccin, Tokyo Night) + custom accent colors. |
| 💬 **340+ AI models** | From Claude Opus to GPT-5 to Gemini. Pick your AI, switch anytime. |
| 💰 **Cost tracking** | Status bar shows tokens used, session cost, credit balance. No surprises. |
| 📎 **File uploads** | Upload images, PDFs, Word docs, Excel files — we extract the text and send it with your message. |
| 🎯 **Friendly model picker** | "Smartest" / "Fastest" / "Free" / "Creative" — no model IDs to memorize. |
| ⚡ **Real-time streaming** | Responses appear as they're generated. Smooth typewriter animation. |
| 📤 **Export anytime** | Download your conversations as Markdown, JSON, or HTML. You own your data. |
| 🔄 **Always up to date** | PWA updates gracefully — saves your chat before restarting. |

---

## 🙋 Frequently Asked Questions

### Is it really free?

The app is free. Creating an OpenRouter account and API key is free.
There are **23 free models** (like Llama 3, Nemotron, Qwen) you can use at **$0 cost**.
For premium models like Claude Opus or GPT-5, you add credits to your OpenRouter
account and pay per-use — typically **pennies per conversation**.

No subscription. No monthly fee. You only pay for what you actually use.

### Do I need a credit card?

For free models: **No.** You can start chatting without adding any payment method.
For premium models: **Yes.** You'll add credits to your OpenRouter account first.
The app shows you the cost before you send, so there are no surprises.

### Do models store or train on my data?

It depends on the model and provider. Some do, some don't.

Our app helps you choose wisely:

- **🔒 Privacy badge** — every model shows whether it has Zero Data Retention (ZDR)
  and whether the provider trains on your data
- **⚙️ Privacy toggles** — turn on "Only use models that don't store my data"
  and we enforce it for every request
- **⚠️ Warnings** — if you pick a model that may retain or train on your data,
  we show a clear warning before you chat

**Privacy-first by default:** The recommended model buckets only show you
trusted providers. You have to explicitly opt into models with weaker policies.

See [openrouter.ai/docs/guides/features/zdr](https://openrouter.ai/docs/guides/features/zdr)
for OpenRouter's official ZDR documentation.

### What happens to my data?

Everything stays in your browser. Conversations are stored in your device's
IndexedDB — the same storage your browser uses for offline data. The only data
that leaves your device is the message you send to OpenRouter, and their
Zero Data Retention policy means they don't store it either.

No servers. No accounts. No training on your data.

---

## 🧠 How it works

```
You type a message
       │
       ▼
OpenChat encrypts nothing (it's already local)
       │
       ▼
Message sent directly to OpenRouter API
       │
       ▼
OpenRouter routes to your chosen model (Claude, GPT, Gemini...)
       │
       ▼
Response streams back to your browser
       │
       ▼
Stored in IndexedDB on YOUR device — no one else's server
```

**That's it. Browser → OpenRouter → Model → Browser. Zero detours.**

OpenRouter's **Zero Data Retention (ZDR)** policy means they don't store your conversations either.
Your data is yours, always.

---

## 🏗️ Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Svelte 5** (~1.5KB gzip — the smallest major framework) |
| Build | **Vite 6** |
| PWA | **vite-plugin-pwa** (service worker + manifest) |
| Styling | **Tailwind CSS v4** + CSS custom properties |
| State | **Zustand** (~1KB) |
| Storage | **Dexie.js** (IndexedDB wrapper with migrations) |
| API | **OpenRouter** — 340+ models, streaming, multimodal |
| Icons | **Lucide** |

---

## 🎯 Target Audience

**Non-technical people who love their privacy.**

You don't need to know what an "API key" is. You don't need to know what "BYOK" means.
The onboarding walks you through every step with plain English and screenshots.

If you can install an app on your phone and paste a code, you can use OpenChat.

---

## 📖 Documentation

Full architecture and design decisions: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📄 License

MIT

---

*Built for privacy. Powered by OpenRouter. Yours always.*