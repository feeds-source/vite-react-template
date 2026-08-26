# React + Vite + Hono + Cloudflare Workers + D1 + Auth + OAuth

Full-stack notes app with **D1**, **email/password auth**, and **GitHub + Google OAuth**.

## Live on Cloudflare

**App:** [https://vite-react-template.unruly-bounce.workers.dev](https://vite-react-template.unruly-bounce.workers.dev)

This is a **temporary preview account** so the site is public immediately. **Claim it within 60 minutes** or Cloudflare deletes the account and the URL goes away:

**[Claim this deployment](https://dash.cloudflare.com/claim-preview?claimToken=GsXRRi8uIRdDljTuGYgQjOrUT0X7ZZnK5x9x9qoZl68)**

1. Open the claim link, sign in (or create a Cloudflare account), and finish the prompts.
2. After claiming, add **one** GitHub Actions secret on this repo (**Settings → Secrets and variables → Actions**):
   - `CLOUDFLARE_API_TOKEN` — [Create token](https://dash.cloudflare.com/profile/api-tokens) using **Edit Cloudflare Workers**, and include **D1 Edit**
3. Optional: `CLOUDFLARE_ACCOUNT_ID` only if that token can access more than one account. Otherwise Wrangler uses the token's account (and creates `vite-react-db` there if needed).
4. Re-run **Actions → Deploy to Cloudflare**, or push to `main`.

D1 database `vite-react-db` is created and migrations are applied. Set OAuth worker secrets after claiming if you want GitHub/Google sign-in in production.

## Automated deploys

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`, every PR into `main`, and on **workflow_dispatch**.

| Event | What happens |
|--------|----------------|
| Push to `main` / Run workflow | `npm ci` → ensure D1 → `npm run build` → D1 migrations (`--remote`) → `wrangler deploy` |
| Pull request | Same build, then `wrangler versions upload` (preview URL, not production) |

Uses `cloudflare/wrangler-action@v4` with Wrangler **4.126.0**. GitHub Environments `production` and `preview` exist (no protection rules). Until `CLOUDFLARE_API_TOKEN` is set, deploy steps are skipped with a warning so the workflow stays valid.

If you also connect **Workers Builds** in the Cloudflare dashboard, pick **either** that **or** this Actions workflow — not both — or every push will deploy twice.

Do **not** enable GitHub Actions “secrets in `if:`” checks; GitHub rejects that (`Unrecognized named-value: 'secrets'`), which is why the first deploy workflow file failed to start.

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
