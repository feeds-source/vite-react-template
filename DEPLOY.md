# Deploy Femme / Silk Moments

Stack: **Vite + React** storefront + **Hono Worker** API on **Cloudflare Workers**, shipped by **GitHub Actions**.

| Environment | URL |
|-------------|-----|
| Production Worker | https://vite-react-template.limefashion52.workers.dev |
| Custom domain | https://www.silkmoments.com |
| Repo | https://github.com/feeds-source/vite-react-template |
| Workflow | [Deploy to Cloudflare](https://github.com/feeds-source/vite-react-template/actions/workflows/deploy.yml) |
| D1 only | [Apply D1 migrations](https://github.com/feeds-source/vite-react-template/actions/workflows/d1-migrate.yml) |

Cloudflare account ID: `1e611220afd75688b509ba299e98bde7`  
Worker name: `vite-react-template`  
D1 database: `vite-react-db` (`0e2f9300-7343-4825-9e90-cb525bcba172`)

---

## 1. One-time GitHub setup

Repo → **Settings → Secrets and variables → Actions**

| Name | Required | Purpose |
|------|----------|---------|
| `CLOUDFLARE_API_TOKEN` | Yes | **Workers Scripts Edit** + **Account → D1 → Edit** |
| `D1_DATABASE_ID` | Recommended | `0e2f9300-7343-4825-9e90-cb525bcba172` |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Defaults to `1e611220afd75688b509ba299e98bde7` |

Create the token: **My Profile → API Tokens → Create Token → Edit Cloudflare Workers**, then add **Account → D1 → Edit**.

Do **not** enable Cloudflare **Workers Builds** on the same repo while this workflow is on.

---

## 2. Production deploy

Merge to `main` or **Actions → Deploy to Cloudflare → Run workflow**.

Order: `npm ci` → pin D1 in `wrangler.json` → `npm run build` → **`wrangler d1 migrations apply vite-react-db --remote`** → `wrangler deploy`.

Hard-refresh https://www.silkmoments.com/?v=now after the run is green.

---

## 3. Custom domain

Workers → `vite-react-template` → **Domains & Routes** → add `www.silkmoments.com`.

```text
www   CNAME   vite-react-template.limefashion52.workers.dev   Proxied
```

SSL/TLS: **Full (strict)**. Purge cache if the HTML is stale.

---

## 4. Laptop deploy

```bash
npm ci
npx wrangler login
npm run db:migrate:remote
npm run build && npm run deploy
```

Local:

```bash
npm run db:migrate
npm run dev
```

---

## 5. D1 migrations

Files live in [`migrations/`](migrations/README.md). Wrangler tracks them in the remote `d1_migrations` table.

| File | Schema |
|------|--------|
| `0001_init.sql` | `notes` |
| `0002_auth.sql` | `users`, `sessions`, `notes.user_id` |
| `0003_oauth.sql` | `oauth_accounts` |

```bash
npm run db:status:remote     # which files are applied
npm run db:migrate:remote    # apply pending files
```

Or **Actions → Apply D1 migrations → Run workflow** (does not republish the Worker).

Add a new file as `migrations/0004_....sql`. Never rename or edit an already-applied file; add a new numbered file instead.

If apply fails with “database not found”, set GitHub secret `D1_DATABASE_ID` to `0e2f9300-7343-4825-9e90-cb525bcba172` and confirm the token has **D1 Edit**.

---

## 6. Production Worker secrets (OAuth)

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put OAUTH_STATE_SECRET
```

Callbacks:

- `https://www.silkmoments.com/api/auth/oauth/github/callback`
- `https://www.silkmoments.com/api/auth/oauth/google/callback`

---

## 7. Check a deploy

1. Actions run is **success** (including **Apply D1 migrations**).
2. New `/assets/index-….js` hash in the HTML.
3. `/api/` responds on the Worker.
