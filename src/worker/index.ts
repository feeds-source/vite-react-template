import { Hono } from "hono";
import { cors } from "hono/cors";
import {
	type AppEnv,
	createSession,
	destroySession,
	hashPassword,
	requireAuth,
	verifyPassword,
} from "./auth";

type Note = {
	id: number;
	title: string;
	content: string;
	created_at: string;
	updated_at: string;
	user_id: number | null;
};

const app = new Hono<AppEnv>();

app.use("/api/*", cors());

// Health
app.get("/api/", (c) => c.json({ name: "Cloudflare", d1: true, auth: true }));

// ─── Auth routes (public) ───────────────────────────────────────────

app.post("/api/auth/register", async (c) => {
	const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null);
	const email = body?.email?.trim().toLowerCase();
	const password = body?.password;

	if (!email || !password) {
		return c.json({ error: "email and password are required" }, 400);
	}
	if (!/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)) {
		return c.json({ error: "invalid email" }, 400);
	}
	if (password.length < 8) {
		return c.json({ error: "password must be at least 8 characters" }, 400);
	}

	const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?")
		.bind(email)
		.first();
	if (existing) {
		return c.json({ error: "email already registered" }, 409);
	}

	const passwordHash = await hashPassword(password);
	const user = await c.env.DB.prepare(
		"INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email",
	)
		.bind(email, passwordHash)
		.first<{ id: number; email: string }>();

	if (!user) {
		return c.json({ error: "failed to create user" }, 500);
	}

	const token = await createSession(c.env.DB, user.id);
	return c.json({ user: { id: user.id, email: user.email }, token }, 201);
});

app.post("/api/auth/login", async (c) => {
	const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null);
	const email = body?.email?.trim().toLowerCase();
	const password = body?.password;

	if (!email || !password) {
		return c.json({ error: "email and password are required" }, 400);
	}

	const user = await c.env.DB.prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
		.bind(email)
		.first<{ id: number; email: string; password_hash: string }>();

	if (!user || !(await verifyPassword(password, user.password_hash))) {
		return c.json({ error: "invalid email or password" }, 401);
	}

	const token = await createSession(c.env.DB, user.id);
	return c.json({ user: { id: user.id, email: user.email }, token });
});

app.post("/api/auth/logout", requireAuth, async (c) => {
	const header = c.req.header("Authorization") ?? "";
	const token = header.replace(/^Bearer\s+/i, "").trim();
	if (token) {
		await destroySession(c.env.DB, token);
	}
	return c.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (c) => {
	return c.json({ user: c.get("user") });
});

// ─── Notes (all require auth, scoped to user) ───────────────────────

app.get("/api/notes", requireAuth, async (c) => {
	const user = c.get("user");
	const { results } = await c.env.DB.prepare(
		"SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC",
	)
		.bind(user.id)
		.all<Note>();

	return c.json({ notes: results ?? [] });
});

app.get("/api/notes/:id", requireAuth, async (c) => {
	const user = c.get("user");
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) {
		return c.json({ error: "Invalid id" }, 400);
	}

	const note = await c.env.DB.prepare(
		"SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?",
	)
		.bind(id, user.id)
		.first<Note>();

	if (!note) {
		return c.json({ error: "Note not found" }, 404);
	}

	return c.json({ note });
});

app.post("/api/notes", requireAuth, async (c) => {
	const user = c.get("user");
	const body = await c.req.json<{ title?: string; content?: string }>().catch(() => null);
	const title = body?.title?.trim();
	const content = body?.content?.trim() ?? "";

	if (!title) {
		return c.json({ error: "title is required" }, 400);
	}

	const result = await c.env.DB.prepare(
		"INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?) RETURNING id, title, content, created_at, updated_at",
	)
		.bind(title, content, user.id)
		.first<Note>();

	return c.json({ note: result }, 201);
});

app.put("/api/notes/:id", requireAuth, async (c) => {
	const user = c.get("user");
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) {
		return c.json({ error: "Invalid id" }, 400);
	}

	const body = await c.req.json<{ title?: string; content?: string }>().catch(() => null);
	const title = body?.title?.trim();
	const content = body?.content?.trim();

	if (title === undefined && content === undefined) {
		return c.json({ error: "Provide title and/or content to update" }, 400);
	}

	const sets: string[] = [];
	const values: (string | number)[] = [];

	if (title !== undefined) {
		sets.push("title = ?");
		values.push(title);
	}
	if (content !== undefined) {
		sets.push("content = ?");
		values.push(content);
	}
	sets.push("updated_at = datetime('now')");
	values.push(id, user.id);

	const result = await c.env.DB.prepare(
		`UPDATE notes SET ${sets.join(", ")} WHERE id = ? AND user_id = ? RETURNING id, title, content, created_at, updated_at`,
	)
		.bind(...values)
		.first<Note>();

	if (!result) {
		return c.json({ error: "Note not found" }, 404);
	}

	return c.json({ note: result });
});

app.delete("/api/notes/:id", requireAuth, async (c) => {
	const user = c.get("user");
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) {
		return c.json({ error: "Invalid id" }, 400);
	}

	const result = await c.env.DB.prepare(
		"DELETE FROM notes WHERE id = ? AND user_id = ? RETURNING id",
	)
		.bind(id, user.id)
		.first<{ id: number }>();

	if (!result) {
		return c.json({ error: "Note not found" }, 404);
	}

	return c.json({ ok: true, id: result.id });
});

export default app;
