# React + Vite + Hono + Cloudflare Workers + D1 + Auth + OAuth

Full-stack notes app with **D1**, **email/password auth**, and **GitHub + Google OAuth**.

## Live on Cloudflare

**App:** [https://vite-react-template.unruly-bounce.workers.dev](https://vite-react-template.unruly-bounce.workers.dev)

This is a **temporary preview account** so the site is public immediately. **Claim it within 60 minutes** or Cloudflare deletes the account and the URL goes away:

**[Claim this deployment](https://dash.cloudflare.com/claim-preview?claimToken=GsXRRi8uIRdDljTuGYgQjOrUT0X7ZZnK5x9x9qoZl68)**

1. Open the claim link, sign in (or create a Cloudflare account), and finish the prompts.
2. After claiming, add these GitHub Actions secrets on the repo:
   - `CLOUDFLARE_API_TOKEN` — [Create token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with Workers + D1 edit
   - `CLOUDFLARE_ACCOUNT_ID` — `aedee6c75c522d80181feb43639ef0a6`
3. Later pushes to `main` deploy via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). You can also run **Actions → Deploy to Cloudflare → Run workflow**.

D1 database `vite-react-db` is created and migrations are applied. Set OAuth worker secrets after claiming if you want GitHub/Google sign-in in production.

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
