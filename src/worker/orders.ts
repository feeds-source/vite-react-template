import type { Context } from "hono";
import type { AppEnv, AuthUser } from "./auth";
import { CATALOG_BY_ID, dollarsToCents, quoteOrder } from "./catalog";

export type OrderRow = {
	id: number;
	order_no: string;
	user_id: number;
	email: string;
	ship_name: string;
	ship_addr: string;
	currency: string;
	subtotal_cents: number;
	shipping_cents: number;
	pack_cents: number;
	tax_cents: number;
	other_cents: number;
	tax_label: string;
	ship_country: string;
	total_cents: number;
	status: string;
	tracking: string | null;
	created_at: string;
	confirmed_at: string | null;
	dispatched_at: string | null;
};

export type OrderItemRow = {
	id: number;
	order_id: number;
	product_id: string;
	name: string;
	qty: number;
	unit_cents: number;
};

export type OrderEmailRow = {
	id: number;
	order_id: number;
	kind: string;
	to_email: string;
	subject: string;
	body: string;
	status: string;
	created_at: string;
};

const ORDER_COLS =
	"id, order_no, user_id, email, ship_name, ship_addr, currency, subtotal_cents, shipping_cents, COALESCE(pack_cents,0) AS pack_cents, COALESCE(tax_cents,0) AS tax_cents, COALESCE(other_cents,0) AS other_cents, COALESCE(tax_label,'Duties & taxes') AS tax_label, COALESCE(ship_country,'') AS ship_country, total_cents, status, tracking, created_at, confirmed_at, dispatched_at";

export function adminEmails(env: Env): string[] {
	return (env.ADMIN_EMAILS || "")
		.split(",")
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
}

export function userIsAdmin(env: Env, user: AuthUser): boolean {
	return adminEmails(env).includes(user.email.toLowerCase());
}

function formatMoney(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

async function loadItems(db: D1Database, orderId: number): Promise<OrderItemRow[]> {
	const { results } = await db
		.prepare("SELECT id, order_id, product_id, name, qty, unit_cents FROM order_items WHERE order_id = ? ORDER BY id")
		.bind(orderId)
		.all<OrderItemRow>();
	return results ?? [];
}

async function loadEmails(db: D1Database, orderId: number): Promise<OrderEmailRow[]> {
	const { results } = await db
		.prepare(
			"SELECT id, order_id, kind, to_email, subject, body, status, created_at FROM order_emails WHERE order_id = ? ORDER BY id DESC",
		)
		.bind(orderId)
		.all<OrderEmailRow>();
	return results ?? [];
}

export async function packOrder(db: D1Database, order: OrderRow, withEmails = false) {
	const items = await loadItems(db, order.id);
	const emails = withEmails ? await loadEmails(db, order.id) : [];
	return { ...order, items, emails };
}

function receiptText(order: OrderRow, items: OrderItemRow[], extra = ""): string {
	const lines = items.map((i) => `  ${i.qty} × ${i.name} — ${formatMoney(i.unit_cents * i.qty)}`);
	return [
		`Femme Silk Atelier`,
		`Order ${order.order_no}`,
		`Status: ${order.status}`,
		``,
		`Ship to: ${order.ship_name}`,
		order.ship_addr,
		order.ship_country ? `Country: ${order.ship_country}` : "",
		``,
		`Items`,
		...lines,
		``,
		`Product cost     ${formatMoney(order.subtotal_cents)}`,
		`Packaging        ${formatMoney(order.pack_cents || 0)}`,
		`Shipping         ${order.shipping_cents === 0 ? "Free" : formatMoney(order.shipping_cents)}`,
		`${order.tax_label || "Duties & taxes"}  ${formatMoney(order.tax_cents || 0)}`,
		`COD handling     ${formatMoney(order.other_cents || 0)}`,
		`Total due        ${formatMoney(order.total_cents)}`,
		order.tracking ? `Tracking  ${order.tracking}` : "",
		extra,
		``,
		`Payment: cash on delivery`,
		`Questions: info@silkmoments.com`,
	]
		.filter((line) => line !== "")
		.join("\n");
}

async function recordEmail(
	db: D1Database,
	order: OrderRow,
	kind: string,
	subject: string,
	body: string,
): Promise<OrderEmailRow> {
	const row = await db
		.prepare(
			`INSERT INTO order_emails (order_id, kind, to_email, subject, body, status)
       VALUES (?, ?, ?, ?, ?, 'demo')
       RETURNING id, order_id, kind, to_email, subject, body, status, created_at`,
		)
		.bind(order.id, kind, order.email, subject, body)
		.first<OrderEmailRow>();
	if (!row) throw new Error("failed to record email");
	return row;
}

export async function createOrder(c: Context<AppEnv>) {
	const user = c.get("user");
	const body = await c.req
		.json<{
			shipName?: string;
			shipAddr?: string;
			shipCountry?: string;
			items?: Array<{ id?: string; qty?: number }>;
		}>()
		.catch(() => null);

	const shipName = body?.shipName?.trim();
	const shipAddr = body?.shipAddr?.trim();
	const shipCountry = body?.shipCountry?.trim() || "";
	const rawItems = body?.items ?? [];
	if (!shipName || !shipAddr) return c.json({ error: "name and delivery address are required" }, 400);
	if (!rawItems.length) return c.json({ error: "bag is empty" }, 400);

	const lines: Array<{ product_id: string; name: string; qty: number; unit_cents: number }> = [];
	for (const line of rawItems) {
		const id = line.id?.trim();
		const qty = Number(line.qty);
		if (!id || !Number.isFinite(qty) || qty < 1 || qty > 20) return c.json({ error: "invalid bag line" }, 400);
		const product = CATALOG_BY_ID[id];
		if (!product) return c.json({ error: `unknown product ${id}` }, 400);
		lines.push({ product_id: id, name: product.name, qty: Math.floor(qty), unit_cents: dollarsToCents(product.price) });
	}

	const subtotal = lines.reduce((n, l) => n + l.unit_cents * l.qty, 0);
	const itemCount = lines.reduce((n, l) => n + l.qty, 0);
	const quote = quoteOrder(subtotal, itemCount, shipAddr, shipCountry);
	const orderNo = `FM${Date.now().toString(36).toUpperCase()}`;

	const order = await c.env.DB.prepare(
		`INSERT INTO orders (order_no, user_id, email, ship_name, ship_addr, currency, subtotal_cents, shipping_cents, pack_cents, tax_cents, other_cents, tax_label, ship_country, total_cents, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received')
     RETURNING ${ORDER_COLS}`,
	)
		.bind(
			orderNo,
			user.id,
			user.email,
			shipName,
			shipAddr,
			"USD",
			subtotal,
			quote.shipping,
			quote.packaging,
			quote.tax,
			quote.other,
			quote.taxLabel,
			shipCountry,
			quote.total,
		)
		.first<OrderRow>();
	if (!order) return c.json({ error: "failed to place order" }, 500);

	for (const line of lines) {
		await c.env.DB.prepare("INSERT INTO order_items (order_id, product_id, name, qty, unit_cents) VALUES (?, ?, ?, ?, ?)")
			.bind(order.id, line.product_id, line.name, line.qty, line.unit_cents)
			.run();
	}

	const items = await loadItems(c.env.DB, order.id);
	const email = await recordEmail(
		c.env.DB,
		order,
		"placed",
		`We received order ${order.order_no}`,
		receiptText(order, items, "\nWe will confirm your order shortly, then dispatch with tracking."),
	);

	return c.json({ order: { ...order, items, emails: [email] } }, 201);
}

export async function listMyOrders(c: Context<AppEnv>) {
	const user = c.get("user");
	const { results } = await c.env.DB.prepare(
		`SELECT ${ORDER_COLS} FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
	)
		.bind(user.id)
		.all<OrderRow>();
	const packed = await Promise.all((results ?? []).map((o) => packOrder(c.env.DB, o)));
	return c.json({ orders: packed });
}

export async function getMyOrder(c: Context<AppEnv>) {
	const user = c.get("user");
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) return c.json({ error: "invalid id" }, 400);
	const order = await c.env.DB.prepare(`SELECT ${ORDER_COLS} FROM orders WHERE id = ? AND user_id = ?`)
		.bind(id, user.id)
		.first<OrderRow>();
	if (!order) return c.json({ error: "order not found" }, 404);
	return c.json({ order: await packOrder(c.env.DB, order, true) });
}

export async function listAdminOrders(c: Context<AppEnv>) {
	const status = c.req.query("status");
	const filtered = status && ["received", "confirmed", "dispatched"].includes(status);
	const sql = filtered
		? `SELECT ${ORDER_COLS} FROM orders WHERE status = ? ORDER BY created_at DESC`
		: `SELECT ${ORDER_COLS} FROM orders ORDER BY created_at DESC`;
	const stmt = filtered ? c.env.DB.prepare(sql).bind(status) : c.env.DB.prepare(sql);
	const { results } = await stmt.all<OrderRow>();
	const packed = await Promise.all((results ?? []).map((o) => packOrder(c.env.DB, o, true)));
	return c.json({ orders: packed });
}

export async function confirmOrder(c: Context<AppEnv>) {
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) return c.json({ error: "invalid id" }, 400);
	const current = await c.env.DB.prepare(`SELECT ${ORDER_COLS} FROM orders WHERE id = ?`).bind(id).first<OrderRow>();
	if (!current) return c.json({ error: "order not found" }, 404);
	if (current.status === "dispatched") return c.json({ error: "already dispatched" }, 409);

	const order = await c.env.DB.prepare(
		`UPDATE orders SET status = 'confirmed', confirmed_at = datetime('now') WHERE id = ? RETURNING ${ORDER_COLS}`,
	)
		.bind(id)
		.first<OrderRow>();
	if (!order) return c.json({ error: "failed to confirm" }, 500);
	const items = await loadItems(c.env.DB, order.id);
	const email = await recordEmail(
		c.env.DB,
		order,
		"confirmed",
		`Order ${order.order_no} is confirmed`,
		receiptText(order, items, "\nYour order is confirmed. We will email again when it ships."),
	);
	return c.json({ order: { ...order, items, emails: [email] } });
}

export async function dispatchOrder(c: Context<AppEnv>) {
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) return c.json({ error: "invalid id" }, 400);
	const body = await c.req.json<{ tracking?: string }>().catch(() => null);
	const tracking = body?.tracking?.trim() || `FM-SHIP-${id}-${Date.now().toString(36).toUpperCase()}`;

	const current = await c.env.DB.prepare(`SELECT ${ORDER_COLS} FROM orders WHERE id = ?`).bind(id).first<OrderRow>();
	if (!current) return c.json({ error: "order not found" }, 404);

	const order = await c.env.DB.prepare(
		`UPDATE orders SET status = 'dispatched', tracking = ?, confirmed_at = COALESCE(confirmed_at, datetime('now')), dispatched_at = datetime('now') WHERE id = ? RETURNING ${ORDER_COLS}`,
	)
		.bind(tracking, id)
		.first<OrderRow>();
	if (!order) return c.json({ error: "failed to dispatch" }, 500);
	const items = await loadItems(c.env.DB, order.id);
	const email = await recordEmail(
		c.env.DB,
		order,
		"dispatched",
		`Your Femme order ${order.order_no} is on the way`,
		receiptText(order, items, `\nShipment dispatched.\nTracking: ${tracking}`),
	);
	return c.json({ order: { ...order, items, emails: [email] }, dispatchEmail: email });
}
