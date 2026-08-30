# Cloudflare D1 migrations

Binding in `wrangler.json`:

- name: `vite-react-db`
- binding: `DB`
- id: `0e2f9300-7343-4825-9e90-cb525bcba172`
- folder: this directory

Wrangler records applied files in the remote `d1_migrations` table. Already-applied files are skipped.

| File | What it creates |
|------|-----------------|
| `0001_init.sql` | `notes` |
| `0002_auth.sql` | `users`, `sessions`, `notes.user_id` |
| `0003_oauth.sql` | `oauth_accounts` |

## Local

```bash
npm run db:migrate
npm run db:status
```

## Production

```bash
npx wrangler login
npm run db:status:remote
npm run db:migrate:remote
```

Or GitHub → **Actions → Apply D1 migrations → Run workflow**.

Every production deploy also runs `d1 migrations apply vite-react-db --remote` before `wrangler deploy`.

## New migration

1. Add `migrations/0004_your_change.sql` (next number, never rename old files).
2. Apply locally, then merge to `main` (CI applies remote) or run `npm run db:migrate:remote`.
