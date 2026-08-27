import type { MiddlewareHandler } from "hono";

export type AuthUser = {
	id: number;
	email: string;
	role: string;
};

export type AppEnv = {
	Bindings: Env;
	Variables: {
		user: AuthUser;
	};
};

const SESSION_TTL_DAYS = 30;

function bytesToHex(bytes: Uint8Array): string {
	return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
	const matches = hex.match(/.{1,2}/g);
	if (!matches) return new Uint8Array();
	return new Uint8Array(matches.map((b) => parseInt(b, 16)));
}

/** PBKDF2-SHA256 password hash. Format: pbkdf2$iterations$saltHex$hashHex */
export async function hashPassword(password: string): Promise<string> {
	const iterations = 100_000;
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derived = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt, iterations, hash: "SHA-256" },
		keyMaterial,
		256,
	);
	return `pbkdf2$${iterations}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(derived))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split("$");
	if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
	const iterations = Number(parts[1]);
	const salt = hexToBytes(parts[2]);
	const expected = parts[3];
	if (!Number.isFinite(iterations) || salt.length === 0) return false;

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const derived = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt, iterations, hash: "SHA-256" },
		keyMaterial,
		256,
	);
	const actual = bytesToHex(new Uint8Array(derived));
	if (actual.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < actual.length; i++) {
		diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return diff === 0;
}

export function generateToken(): string {
	return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function sessionExpiry(): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + SESSION_TTL_DAYS);
	return d.toISOString().replace("T", " ").slice(0, 19);
}

function extractBearer(header: string | undefined): string | null {
	if (!header) return null;
	const m = /^Bearer\s+(.+)$/i.exec(header.trim());
	return m?.[1]?.trim() || null;
}

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const token = extractBearer(c.req.header("Authorization"));
	if (!token) {
		return c.json({ error: "Unauthorized", message: "Missing Bearer token" }, 401);
	}

	const row = await c.env.DB.prepare(
		`SELECT s.token, s.expires_at, u.id AS user_id, u.email, COALESCE(u.role, 'customer') AS role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`,
	)
		.bind(token)
		.first<{ token: string; expires_at: string; user_id: number; email: string; role: string }>();

	if (!row) {
		return c.json({ error: "Unauthorized", message: "Invalid session" }, 401);
	}

	if (new Date(row.expires_at + "Z") < new Date()) {
		await c.env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
		return c.json({ error: "Unauthorized", message: "Session expired" }, 401);
	}

	c.set("user", { id: row.user_id, email: row.email, role: row.role || "customer" });
	await next();
};

export const optionalAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const token = extractBearer(c.req.header("Authorization"));
	if (token) {
		const row = await c.env.DB.prepare(
			`SELECT s.expires_at, u.id AS user_id, u.email, COALESCE(u.role, 'customer') AS role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
		)
			.bind(token)
			.first<{ expires_at: string; user_id: number; email: string; role: string }>();

		if (row && new Date(row.expires_at + "Z") >= new Date()) {
			c.set("user", { id: row.user_id, email: row.email, role: row.role || "customer" });
		}
	}
	await next();
};

export function resolveRole(env: Env, user: AuthUser): string {
	const listed = (env.ADMIN_EMAILS || "")
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (listed.includes(user.email.toLowerCase())) return "admin";
	return "customer";
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
	const user = c.get("user");
	if (!user || resolveRole(c.env, user) !== "admin") {
		return c.json({ error: "Forbidden", message: "Admin only" }, 403);
	}
	c.set("user", { ...user, role: "admin" });
	await next();
};

export async function createSession(db: D1Database, userId: number): Promise<string> {
	const token = generateToken();
	const expiresAt = sessionExpiry();
	await db
		.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
		.bind(token, userId, expiresAt)
		.run();
	return token;
}

export async function destroySession(db: D1Database, token: string): Promise<void> {
	await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}
