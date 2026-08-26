# React + Vite + Hono + Cloudflare Workers + D1

Full-stack template with **Cloudflare D1** (SQLite) integrated.

- **Frontend**: React 19 + Vite
- **Backend**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1 (`notes` table)

## Features

- CRUD API for notes (`/api/notes`)
- React UI to create, list, and delete notes
- Local D1 via Wrangler + migrations

## Quick start

```bash
npm install
```

### 1. Create the D1 database (one-time, for production)

```bash
npx wrangler d1 create vite-react-db
```

Copy the returned `database_id` into `wrangler.json` → `d1_databases[0].database_id`.

> For **local dev**, Wrangler uses a local SQLite file automatically. The placeholder `database_id` is fine until you deploy.

### 2. Apply migrations

Local:

```bash
npx wrangler d1 migrations apply vite-react-db --local
```

Remote (production):

```bash
npx wrangler d1 migrations apply vite-react-db --remote
```

### 3. Generate types (optional but recommended)

```bash
npm run cf-typegen
```

This updates `worker-configuration.d.ts` so `c.env.DB` is typed.

### 4. Develop

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Deploy

```bash
npm run build && npm run deploy
```

Make sure migrations are applied remotely before or after the first deploy.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/` | Health check |
| `GET` | `/api/notes` | List notes |
| `GET` | `/api/notes/:id` | Get one note |
| `POST` | `/api/notes` | Create note `{ title, content? }` |
| `PUT` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |

## Project structure

```
├── migrations/
│   └── 0001_init.sql      # D1 schema
├── src/
│   ├── react-app/         # React UI
│   └── worker/
│       └── index.ts       # Hono + D1 API
├── wrangler.json          # Workers + D1 binding
└── package.json
```

## Useful commands

| Command | Action |
|---------|--------|
| `npm run dev` | Local dev (Vite + Workers + local D1) |
| `npm run build` | Production build |
| `npm run deploy` | Deploy Worker |
| `npm run cf-typegen` | Regenerate Worker/D1 types |
| `npx wrangler d1 migrations apply vite-react-db --local` | Apply migrations locally |
