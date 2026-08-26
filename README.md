# React + Vite + Hono + Cloudflare Workers + D1 + Auth + OAuth

Full-stack notes app with **D1**, **email/password auth**, and **GitHub + Google OAuth**.

## Live on Cloudflare

**App:** [https://vite-react-template.limefashion52.workers.dev](https://vite-react-template.limefashion52.workers.dev)

GitHub Actions deploys this URL on every push to `main`. The storefront is live. **D1 is not bound yet** — the API token needs **Account → D1 Edit**. Recreate the token with that permission, update `CLOUDFLARE_API_TOKEN`, and re-run **Actions → Deploy to Cloudflare** to create `vite-react-db` and enable notes/auth.

Optional: [claim the temporary preview](https://dash.cloudflare.com/claim-preview?claimToken=GsXRRi8uIRdDljTuGYgQjOrUT0X7ZZnK5x9x9qoZl68) if you still want those resources merged in (expires about an hour after it was issued).

OAuth worker secrets (`GITHUB_CLIENT_ID`, etc.) are still unset.

## Automated deploys

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`, every PR into `main`, and on **workflow_dispatch**.

| Event | What happens |
|--------|----------------|
| Push to `main` / Run workflow | `npm ci` → ensure D1 → `npm run build` → D1 migrations (`--remote`) → `wrangler deploy` |
| Pull request | Same build, then `wrangler versions upload` (preview URL, not production) |

Uses `cloudflare/wrangler-action@v4` with Wrangler **4.126.0**. Secret: `CLOUDFLARE_API_TOKEN` (Workers Edit + **D1 Edit**). Optional: `CLOUDFLARE_ACCOUNT_ID` if the token can access more than one account.

If you also connect **Workers Builds** in the Cloudflare dashboard, pick **either** that **or** this Actions workflow — not both — or every push will deploy twice.

## Features

- Email/password register & login
- GitHub and Google OAuth
- Session tokens (Bearer) with `requireAuth` middleware
- Notes scoped per user
- Dependency auditing (`npm audit` / `npm audit fix`) in CI
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

4. Restart `npm run dev`. OAuth buttons appear when credentials are set.

### Production secrets

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put OAUTH_STATE_SECRET
```

`APP_URL` in `wrangler.json` is set to `https://vite-react-template.unruly-bounce.workers.dev`. Update OAuth app callback URLs to match:

- `https://vite-react-template.unruly-bounce.workers.dev/api/auth/oauth/github/callback`
- `https://vite-react-template.unruly-bounce.workers.dev/api/auth/oauth/google/callback`

```bash
npx wrangler d1 migrations apply vite-react-db --remote
npm run build && npm run deploy
```

## Security / npm audit

Lockfile is currently clean (**0** vulnerabilities) after upgrading `hono` to 4.13.5, `wrangler` to 4.126.0, and `@cloudflare/vite-plugin` to 1.54.0. Install does not fail on advisories (`.npmrc` `audit=false`); CI and the scripts below are the gate.

| Script | What it does |
|--------|----------------|
| `npm run audit` | Full tree; fails on **moderate+** (`audit-level=moderate`) |
| `npm run audit:prod` | Production deps only; fails on **high+** |
| `npm run audit:fix` | Apply compatible `npm audit fix` updates (never `--force`) |

**CI gate** — [`.github/workflows/npm-audit.yml`](.github/workflows/npm-audit.yml) runs both audit jobs on every PR, push to `main`, and weekly.

**Auto-fix PRs** — [`.github/workflows/npm-audit-fix.yml`](.github/workflows/npm-audit-fix.yml) runs `npm audit fix` every Monday, verifies `npm run build`, and opens/updates a `chore/npm-audit-fix` PR when the lockfile changes. Dispatch it anytime from **Actions → npm audit fix → Run workflow**.

`--force` is intentionally omitted: it can jump major versions. Use that locally only when you mean to take a breaking upgrade.

**Dependabot** — [`.github/dependabot.yml`](.github/dependabot.yml) opens weekly grouped PRs for npm (prod + dev, minor/patch) and GitHub Actions.

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
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── deploy.yml
│       ├── npm-audit.yml
│       └── npm-audit-fix.yml
├── .npmrc
├── migrations/
│   ├── 0001_init.sql
│   ├── 0002_auth.sql
│   └── 0003_oauth.sql
├── src/
│   ├── react-app/
│   └── worker/
│       ├── auth.ts      # sessions + requireAuth
│       ├── oauth.ts     # GitHub / Google flows
│       └── index.ts
├── .dev.vars.example
└── wrangler.json
```
