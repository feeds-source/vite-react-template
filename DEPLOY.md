# Deploy Femme / Silk Moments

Stack: **Vite + React** storefront + **Hono Worker** API on **Cloudflare Workers**, shipped by **GitHub Actions**.

| Environment | URL |
|-------------|-----|
| Production Worker | https://vite-react-template.limefashion52.workers.dev |
| Custom domain | https://www.silkmoments.com |
| Repo | https://github.com/feeds-source/vite-react-template |
| Workflow | [Deploy to Cloudflare](https://github.com/feeds-source/vite-react-template/actions/workflows/deploy.yml) |

Cloudflare account ID: `1e611220afd75688b509ba299e98bde7`  
Worker name: `vite-react-template`  
D1 database: `vite-react-db`

---

## 1. One-time GitHub setup

Repo → **Settings → Secrets and variables → Actions**

| Name | Required | Purpose |
|------|----------|---------|
| `CLOUDFLARE_API_TOKEN` | Yes | Token with **Workers Scripts Edit** and **D1 Edit** |
| `D1_DATABASE_ID` | For auth/notes | UUID of `vite-react-db` from Cloudflare → Workers → D1 |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Defaults to `1e611220afd75688b509ba299e98bde7` |

Create the API token: Cloudflare dashboard → **My Profile → API Tokens → Create Token** → use **Edit Cloudflare Workers** and add **Account → D1 → Edit**.

Do **not** enable Cloudflare **Workers Builds** on the same repo while this workflow is on. Two pipelines would deploy twice per push.

---

## 2. Production deploy (usual path)

1. Commit on a branch and open a PR into `main` (optional preview via `wrangler versions upload`).
2. Merge to `main`.
3. Actions runs **Deploy to Cloudflare → Production**:
   - `npm ci`
   - ensure D1 binding
   - `npm run build`
   - `wrangler d1 migrations apply vite-react-db --remote` (if D1 is bound)
   - `wrangler deploy`
4. Wait until the run is green (~40–60 seconds).
5. Hard-refresh the live site (cached HTML can lag):  
   https://www.silkmoments.com/?v=now  
   or Ctrl+Shift+R / Cmd+Shift+R.

### Run deploy without a new commit

Actions → **Deploy to Cloudflare** → **Run workflow** → branch `main`.  
Optional input: `d1_database_id` if the secret is missing.

---

## 3. Custom domain (www.silkmoments.com)

1. Cloudflare dashboard → **Workers & Pages** → `vite-react-template` → **Settings → Domains & Routes**.
2. Add `www.silkmoments.com` and `silkmoments.com` (or a redirect from apex → www).
3. DNS on the same Cloudflare zone:

```text
www   CNAME   vite-react-template.limefashion52.workers.dev   Proxied
@     CNAME   vite-react-template.limefashion52.workers.dev   Proxied
```

Or use a Worker custom domain (Cloudflare writes the record for you).

4. SSL/TLS mode: **Full (strict)**.
5. If the site looks old after a deploy, purge cache:  
   **Caching → Configuration → Purge Everything**, then hard-refresh.

If DNS “does not resolve” on a local ISP, try `1.1.1.1` or a private window. The Worker URL should still load.

---

## 4. Deploy from your laptop

```bash
git clone https://github.com/feeds-source/vite-react-template.git
cd vite-react-template
npm ci
npx wrangler login
npx wrangler d1 migrations apply vite-react-db --remote
npm run build
npm run deploy
```

`npm run deploy` is `wrangler deploy` and publishes the same Worker as Actions.

Local app (no production publish):

```bash
npx wrangler d1 migrations apply vite-react-db --local
npm run dev
```

---

## 5. Production Worker secrets (OAuth)

Only needed if Sign in with GitHub/Google should work on the live domain.

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put OAUTH_STATE_SECRET
```

OAuth app callback URLs:

- `https://www.silkmoments.com/api/auth/oauth/github/callback`
- `https://www.silkmoments.com/api/auth/oauth/google/callback`
- also add the `workers.dev` twins if you test on that host

`APP_URL` in `wrangler.json` is `https://vite-react-template.limefashion52.workers.dev`. Point it at `https://www.silkmoments.com` if OAuth redirects should stay on the custom domain.

---

## 6. Check a deploy

1. Actions run is **success**.
2. HTML lists a new hashed bundle, e.g. `/assets/index-….js`.
3. Homepage shows current theme copy (ticker, hero, collections).
4. `/api/` responds on the Worker.

If the UI is stale: hard-refresh, then purge Cloudflare cache. Do not assume a failed DNS lookup means the Worker is down — open the `workers.dev` URL first.
