# React + Vite + Hono + Cloudflare Workers + D1 + Auth + OAuth

Femme / Silk Moments storefront: Vite + React on a Hono Worker, with D1 auth and GitHub + Google OAuth.

**Deploy guide:** [DEPLOY.md](DEPLOY.md)

## Live on Cloudflare

| | |
|--|--|
| Store | [https://www.silkmoments.com](https://www.silkmoments.com) |
| Worker | [https://vite-react-template.limefashion52.workers.dev](https://vite-react-template.limefashion52.workers.dev) |
| Deploy | [Actions → Deploy to Cloudflare](https://github.com/feeds-source/vite-react-template/actions/workflows/deploy.yml) |

Every push to `main` runs GitHub Actions → `wrangler deploy`.

To bind D1 (`vite-react-db`) for account/notes:

1. Cloudflare → **Workers & Pages** → **D1** → **vite-react-db** → copy **Database ID**
2. GitHub → **Settings → Secrets and variables → Actions**:
   - `CLOUDFLARE_API_TOKEN` — Workers Scripts **Edit** + **D1 Edit** on account `1e611220afd75688b509ba299e98bde7`
   - `D1_DATABASE_ID` — that UUID
3. Re-run **Actions → Deploy to Cloudflare**

Full steps (domain, cache, laptop deploy, OAuth): **[DEPLOY.md](DEPLOY.md)**.

OAuth worker secrets (`GITHUB_CLIENT_ID`, etc.) are still unset until you `wrangler secret put` them.

## Automated deploys

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`, every PR into `main`, and on **workflow_dispatch**.

| Event | What happens |
|--------|----------------|
| Push to `main` / Run workflow | `npm ci` → ensure D1 → `npm run build` → D1 migrations (`--remote`) → `wrangler deploy` |
| Pull request | Same build, then `wrangler versions upload` (preview, not production) |

Uses `cloudflare/wrangler-action@v4` with Wrangler **4.126.0**. Secret: `CLOUDFLARE_API_TOKEN`. Optional: `CLOUDFLARE_ACCOUNT_ID`.

If you also connect **Workers Builds** in the Cloudflare dashboard, pick **either** that **or** this Actions workflow — not both.

## Features

- Femme storefront (shop, bag, wishlist, currency, journal)
- Email/password register & login
- GitHub and Google OAuth
- Session tokens with `requireAuth`
- Notes scoped per user
- Auto-deploy to Cloudflare Workers

## Quick start

```bash
npm install
npx wrangler d1 migrations apply vite-react-db --local
npm run dev
```

### OAuth setup (optional)

1. Copy env example:

```bash
cp .dev.vars.example .dev.vars
```

2. **GitHub** → [Developer settings → OAuth Apps](https://github.com/settings/developers)

   - Homepage: `http://localhost:5173`
   - Callback: `http://localhost:5173/api/auth/oauth/github/callback`
   - Put Client ID / Secret in `.dev.vars`

3. **Google** → [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

   - Create OAuth 2.0 Client (Web)
   - Authorized redirect: `http://localhost:5173/api/auth/oauth/google/callback`
   - Put Client ID / Secret in `.dev.vars`

4. Restart `npm run dev`.

### Production secrets

See [DEPLOY.md](DEPLOY.md#5-production-worker-secrets-oauth).

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put OAUTH_STATE_SECRET
```

```bash
npx wrangler d1 migrations apply vite-react-db --remote
npm run build && npm run deploy
```

## Security / npm audit

Lockfile is currently clean after upgrading `hono` to 4.13.5, `wrangler` to 4.126.0, and `@cloudflare/vite-plugin` to 1.54.0.

| Script | What it does |
|--------|----------------|
| `npm run audit` | Full tree; fails on **moderate+** |
| `npm run audit:prod` | Production deps only; fails on **high+** |
| `npm run audit:fix` | Compatible `npm audit fix` (never `--force`) |

CI: [`.github/workflows/npm-audit.yml`](.github/workflows/npm-audit.yml). Auto-fix PRs: [`.github/workflows/npm-audit-fix.yml`](.github/workflows/npm-audit-fix.yml).

## Auth API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Email/password signup |
| `POST` | `/api/auth/login` | No | Email/password login |
| `POST` | `/api/auth/logout` | Yes | Invalidate session |
| `GET` | `/api/auth/me` | Yes | Current user |
| `GET` | `/api/auth/oauth/:provider` | No | Start OAuth (`github` \| `google`) |
| `GET` | `/api/auth/oauth/:provider/callback` | No | OAuth callback |

OAuth success redirects to `/?auth_token=...`. Errors to `/?auth_error=...`.

## Notes API

All require `Authorization: Bearer <token>` and are scoped to the current user.

## Project structure

```
├── .github/workflows/deploy.yml
├── DEPLOY.md
├── migrations/
├── src/react-app/
├── src/worker/
└── wrangler.json
```
