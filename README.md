# React + Vite + Hono + Cloudflare Workers + D1 + Auth

Full-stack notes app with **Cloudflare D1** and **session-based authentication**.

- **Frontend**: React 19 + Vite
- **Backend**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1
- **Auth**: Email/password + Bearer session tokens (PBKDF2 hashing via Web Crypto)

## Features

- Register / login / logout
- `requireAuth` middleware on protected routes
- Notes scoped per user
- Local D1 via Wrangler migrations

## Quick start

```bash
npm install
```

### 1. Create the D1 database (production)

```bash
npx wrangler d1 create vite-react-db
```

Copy the returned `database_id` into `wrangler.json` → `d1_databases[0].database_id`.

### 2. Apply migrations

```bash
# Local
npx wrangler d1 migrations apply vite-react-db --local

# Remote
npx wrangler d1 migrations apply vite-react-db --remote
```

### 3. Generate types (recommended)

```bash
npm run cf-typegen
```

### 4. Develop

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Deploy

```bash
npm run build && npm run deploy
```

## Auth API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | `{ email, password }` → `{ user, token }` |
| `POST` | `/api/auth/login` | No | `{ email, password }` → `{ user, token }` |
| `POST` | `/api/auth/logout` | Yes | Invalidate session |
| `GET` | `/api/auth/me` | Yes | Current user |

Send the token as:

```
Authorization: Bearer <token>
```

## Notes API (all require auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notes` | List your notes |
| `GET` | `/api/notes/:id` | Get one note |
| `POST` | `/api/notes` | Create note |
| `PUT` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |

## Auth middleware

Defined in `src/worker/auth.ts`:

- **`requireAuth`** — returns `401` if missing/invalid/expired Bearer token; sets `c.get("user")`
- **`optionalAuth`** — sets user when token is valid, otherwise continues
- Passwords hashed with **PBKDF2-SHA256** (100k iterations) via Web Crypto (no extra deps)
- Sessions stored in D1 (`sessions` table), 30-day TTL

## Project structure

```
├── migrations/
│   ├── 0001_init.sql       # notes table
│   └── 0002_auth.sql       # users, sessions, notes.user_id
├── src/
│   ├── react-app/          # Login UI + notes UI
│   └── worker/
│       ├── auth.ts         # hashing, sessions, middleware
│       └── index.ts        # Hono routes
└── wrangler.json
```
