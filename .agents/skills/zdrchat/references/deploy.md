# Deployment Reference

## ZDR Chat App (this project)

| Domain | URL | Deploy trigger |
|--------|-----|----------------|
| Production | https://app.zdr.chat | Push to `main` branch |
| Preview | `https://<branch>.zdr-chat.pages.dev` | Push to any other branch |

**Mechanism**: Cloudflare Pages Git integration — the Cloudflare GitHub App detects pushes and auto-deploys.

**Do not**:
- Run `wrangler deploy` or `wrangler pages deploy`
- Set up GitHub Actions workflows
- Push to a `staging` branch (it doesn't exist)
- Modify Cloudflare Pages settings via dashboard (done once, not per-deploy)

**Build settings** (configured in Cloudflare Pages dashboard, not in repo):
- Build command: `npm run build`
- Build output: `dist/`
- Node version: latest LTS

## ZDR Chat Landing Page

| Domain | URL | Project location |
|--------|-----|------------------|
| Production | https://zdr.chat | `~/code/zdrchat-landing` |

- Built with **Astro**, deployed to Cloudflare Pages
- Same Git-based deploy flow: push `main` → production
- Build command: `npm run build` → output directory configured in Astro

## Rollback

If a production deploy breaks:
1. Go to Cloudflare Pages dashboard → zdrchat project → **Deployments** tab
2. Find the last working deployment
3. Click the three dots → **Rollback to this deployment**
4. No code changes needed — this is a dashboard operation only

## Environment

Since the app is **100% client-side** with no backend:
- There are no environment variables, secrets, or wrangler bindings
- The API key is user-provided at runtime
- The app requires no special Cloudflare features (no Workers, no KV, no D1 on the server side)