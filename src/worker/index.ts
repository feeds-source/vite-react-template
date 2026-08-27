import { Hono } from "hono";
import { cors } from "hono/cors";
import {
	type AppEnv,
	createSession,
	destroySession,
	generateToken,
	hashPassword,
	requireAdmin,
	requireAuth,
	resolveRole,
	verifyPassword,
} from "./auth";
import { buildAuthorizeUrl, handleOAuthCallback, type OAuthProvider } from "./oauth";
import {
	confirmOrder,
	createOrder,
	dispatchOrder,
	getMyOrder,
	listAdminOrders,
	listMyOrders,
} from "./orders";

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

async function sha256Hex(value: string): Promise<string> {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

app.get("/api/", (c) =>
	c.json({
		name: "Cloudflare",
		d1: true,
		auth: true,
		oauth: {
			github: Boolean(c.env.GITHUB_CLIENT_ID),
			google: Boolean(c.env.GOOGLE_CLIENT_ID),
		},
	}),
);

app.post("/api/auth/register", async (c) => {
	const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null);
	const email = body?.email?.trim().toLowerCase();
	const password = body?.password;

	if (!email || !password) return c.json({ error: "email and password are required" }, 400);
	if (!/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)) return c.json({ error: "invalid email" }, 400);
	if (password.length < 8) return c.json({ error: "password must be at least 8 characters" }, 400);

	const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
	if (existing) return c.json({ error: "email already registered" }, 409);

	const passwordHash = await hashPassword(password);
	const user = await c.env.DB.prepare(
		"INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email",
	)
		.bind(email, passwordHash)
		.first<{ id: number; email: string }>();

	if (!user) return c.json({ error: "failed to create user" }, 500);
	const token = await createSession(c.env.DB, user.id);
	return c.json({ user: { id: user.id, email: user.email }, token }, 201);
});

app.post("/api/auth/login", async (c) => {
	const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null);
	const email = body?.email?.trim().toLowerCase();
	const password = body?.password;

	if (!email || !password) return c.json({ error: "email and password are required" }, 400);

	const user = await c.env.DB.prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
		.bind(email)
		.first<{ id: number; email: string; password_hash: string | null }>();

	if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
		return c.json({ error: "invalid email or password" }, 401);
	}

	const token = await createSession(c.env.DB, user.id);
	return c.json({ user: { id: user.id, email: user.email }, token });
});

app.post("/api/auth/forgot", async (c) => {
	const body = await c.req.json<{ email?: string }>().catch(() => null);
	const email = body?.email?.trim().toLowerCase();
	if (!email) return c.json({ error: "email is required" }, 400);

	const user = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
	if (!user) return c.json({ ok: true });

	const raw = generateToken();
	const tokenHash = await sha256Hex(raw);
	const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
	await c.env.DB.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE user_id = ? AND used_at IS NULL")
		.bind(user.id)
		.run();
	await c.env.DB.prepare("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)")
		.bind(user.id, tokenHash, expires)
		.run();

	return c.json({ ok: true, resetToken: raw });
});

app.post("/api/auth/reset", async (c) => {
	const body = await c.req.json<{ token?: string; password?: string }>().catch(() => null);
	const raw = body?.token?.trim();
	const password = body?.password;
	if (!raw || !password) return c.json({ error: "token and password are required" }, 400);
	if (password.length < 8) return c.json({ error: "password must be at least 8 characters" }, 400);

	const tokenHash = await sha256Hex(raw);
	const row = await c.env.DB.prepare(
		`SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?`,
	)
		.bind(tokenHash)
		.first<{ id: number; user_id: number; expires_at: string; used_at: string | null }>();

	if (!row || row.used_at) return c.json({ error: "invalid or expired reset code" }, 400);
	if (new Date(row.expires_at + "Z") < new Date()) return c.json({ error: "invalid or expired reset code" }, 400);

	const passwordHash = await hashPassword(password);
	await c.env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, row.user_id).run();
	await c.env.DB.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE id = ?").bind(row.id).run();
	await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.user_id).run();

	const user = await c.env.DB.prepare("SELECT id, email FROM users WHERE id = ?")
		.bind(row.user_id)
		.first<{ id: number; email: string }>();
	if (!user) return c.json({ error: "user not found" }, 404);

	const token = await createSession(c.env.DB, user.id);
	return c.json({ user, token });
});

app.post("/api/auth/logout", requireAuth, async (c) => {
	const header = c.req.header("Authorization") ?? "";
	const token = header.replace(/^Bearer\s+/i, "").trim();
	if (token) await destroySession(c.env.DB, token);
	return c.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (c) => {
	const user = c.get("user");
	return c.json({ user: { ...user, role: resolveRole(c.env, user) } });
});

app.post("/api/orders", requireAuth, (c) => createOrder(c));
app.get("/api/orders", requireAuth, (c) => listMyOrders(c));
app.get("/api/orders/:id", requireAuth, (c) => getMyOrder(c));

app.get("/api/admin/orders", requireAuth, requireAdmin, (c) => listAdminOrders(c));
app.post("/api/admin/orders/:id/confirm", requireAuth, requireAdmin, (c) => confirmOrder(c));
app.post("/api/admin/orders/:id/dispatch", requireAuth, requireAdmin, (c) => dispatchOrder(c));

const OAUTH_PROVIDERS = new Set<OAuthProvider>(["github", "google"]);

app.get("/api/auth/oauth/:provider", async (c) => {
	const provider = c.req.param("provider") as OAuthProvider;
	if (!OAUTH_PROVIDERS.has(provider)) return c.json({ error: "Unsupported provider" }, 404);
	return buildAuthorizeUrl(c, provider);
});

app.get("/api/auth/oauth/:provider/callback", async (c) => {
	const provider = c.req.param("provider") as OAuthProvider;
	if (!OAUTH_PROVIDERS.has(provider)) return c.json({ error: "Unsupported provider" }, 404);
	return handleOAuthCallback(c, provider);
});

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
	if (!Number.isFinite(id)) return c.json({ error: "Invalid id" }, 400);
	const note = await c.env.DB.prepare(
		"SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?",
	)
		.bind(id, user.id)
		.first<Note>();
	if (!note) return c.json({ error: "Note not found" }, 404);
	return c.json({ note });
});

app.post("/api/notes", requireAuth, async (c) => {
	const user = c.get("user");
	const body = await c.req.json<{ title?: string; content?: string }>().catch(() => null);
	const title = body?.title?.trim();
	const content = body?.content?.trim() ?? "";
	if (!title) return c.json({ error: "title is required" }, 400);
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
	if (!Number.isFinite(id)) return c.json({ error: "Invalid id" }, 400);
	const body = await c.req.json<{ title?: string; content?: string }>().catch(() => null);
	const title = body?.title?.trim();
	const content = body?.content?.trim();
	if (title === undefined && content === undefined) return c.json({ error: "Provide title and/or content to update" }, 400);
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
	if (!result) return c.json({ error: "Note not found" }, 404);
	return c.json({ note: result });
});

app.delete("/api/notes/:id", requireAuth, async (c) => {
	const user = c.get("user");
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) return c.json({ error: "Invalid id" }, 400);
	const result = await c.env.DB.prepare("DELETE FROM notes WHERE id = ? AND user_id = ? RETURNING id")
		.bind(id, user.id)
		.first<{ id: number }>();
	if (!result) return c.json({ error: "Note not found" }, 404);
	return c.json({ ok: true, id: result.id });
});

export default app;
