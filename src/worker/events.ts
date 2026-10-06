import type { Context } from "hono";
import type { AppEnv } from "./auth";

const KINDS = new Set(["click", "add_to_cart", "checkout", "order"]);

type EventRow = {
	id: number;
	created_at: string;
	session_id: string;
	kind: string;
	path: string;
	label: string;
	product_id: string;
};

export async function recordEvent(c: Context<AppEnv>) {
	const body = await c.req
		.json<{ session?: string; kind?: string; path?: string; label?: string; productId?: string }>()
		.catch(() => null);
	const session = body?.session?.trim().slice(0, 80) ?? "";
	const kind = body?.kind?.trim() ?? "";
	if (!session || !KINDS.has(kind)) return c.json({ error: "invalid event" }, 400);
	const path = (body?.path ?? "").trim().slice(0, 200);
	const label = (body?.label ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
	const productId = (body?.productId ?? "").trim().slice(0, 80);
	await c.env.DB.prepare(
		`INSERT INTO events (session_id, kind, path, label, product_id) VALUES (?, ?, ?, ?, ?)`,
	)
		.bind(session, kind, path, label, productId)
		.run();
	return c.json({ ok: true });
}

export async function listAdminEvents(c: Context<AppEnv>) {
	const { results } = await c.env.DB.prepare(
		`SELECT id, created_at, session_id, kind, path, label, product_id
     FROM events ORDER BY id DESC LIMIT 200`,
	).all<EventRow>();
	return c.json({ events: results });
}
