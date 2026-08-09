# Deployment (Cloudflare Pages)

## Mechanism

Cloudflare Pages **Git integration**: the Cloudflare GitHub App detects pushes to the repo and auto-deploys. No CI files in the repo, no manual commands.

| Environment | URL | Deploy trigger |
|-------------|-----|----------------|
| Production | https://app.zdr.chat | Push to `main` |
| Preview | `https://<branch>.…pages.dev` | Push to any other branch |

Cloudflare is both the **authoritative DNS** and the **Pages host**. There is no backend, so no env vars/secrets/wrangler bindings — the user's OpenRouter key is provided at runtime in the browser.

## Do NOT

- Run `wrangler deploy` or `wrangler pages deploy` — Pages auto-deploys from Git.
- Add GitHub Actions workflows (removed by design — Git integration replaces them).
- Push to a `staging` branch (doesn't exist).
- Change build settings per-deploy from the dashboard (done once).

## Build settings (configured once in the Pages dashboard, not in repo)

- Build command: `npm run build`
- Output directory: `dist/`
- Node: latest LTS
- **Build watch paths**: Include `*`, Exclude `*.md, docs/*`.

  Doc-only changes (`AGENTS.md`, `README.md`, `docs/**`) do **not** trigger deploys — they're excluded from build triggers (the two unlabeled inputs under *Settings → Build → Build watch paths*: top = include, bottom = exclude). Code changes still deploy. No negation syntax exists in this feature; it's purely include/exclude lists.

## Rollback

1. Cloudflare dashboard → Pages → project → **Deployments**.
2. Find the last working deployment → ⋮ → **Rollback to this deployment**.
3. Dashboard-only; no code change required.

## Rollout

`git checkout main && git pull`, merge your PR to `main` via GitHub, push. Pages deploys automatically.
