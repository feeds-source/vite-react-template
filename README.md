# React + Vite + Hono + Cloudflare Workers + D1 + Auth + OAuth

Full-stack notes app with **D1**, **email/password auth**, and **GitHub + Google OAuth**.

## Features

- Email/password register & login
- GitHub and Google OAuth
- Session tokens (Bearer) with `requireAuth` middleware
- Notes scoped per user

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

Set `APP_URL` in `wrangler.json` `vars` to your production origin (e.g. `https://your-worker.workers.dev`).

Update OAuth app callback URLs to match production.

```bash
npx wrangler d1 migrations apply vite-react-db --remote
npm run build && npm run deploy
```

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
