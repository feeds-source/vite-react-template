import { Hono } from "hono";
import { cors } from "hono/cors";

type Note = {
	id: number;
	title: string;
	content: string;
	created_at: string;
	updated_at: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

// Health / demo endpoint
app.get("/api/", (c) => c.json({ name: "Cloudflare", d1: true }));

// List all notes
app.get("/api/notes", async (c) => {
	const { results } = await c.env.DB.prepare(
		"SELECT id, title, content, created_at, updated_at FROM notes ORDER BY created_at DESC",
	).all<Note>();

	return c.json({ notes: results ?? [] });
});

// Get a single note
app.get("/api/notes/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) {
		return c.json({ error: "Invalid id" }, 400);
	}

	const note = await c.env.DB.prepare(
		"SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?",
	)
		.bind(id)
		.first<Note>();

	if (!note) {
		return c.json({ error: "Note not found" }, 404);
	}

	return c.json({ note });
});

// Create a note
app.post("/api/notes", async (c) => {
	const body = await c.req.json<{ title?: string; content?: string }>().catch(() => null);
	const title = body?.title?.trim();
	const content = body?.content?.trim() ?? "";

	if (!title) {
		return c.json({ error: "title is required" }, 400);
	}

	const result = await c.env.DB.prepare(
		"INSERT INTO notes (title, content) VALUES (?, ?) RETURNING id, title, content, created_at, updated_at",
	)
		.bind(title, content)
		.first<Note>();

	return c.json({ note: result }, 201);
});

// Update a note
app.put("/api/notes/:id", async (c) => {
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

	// Build dynamic update
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
	values.push(id);

	const result = await c.env.DB.prepare(
		`UPDATE notes SET ${sets.join(", ")} WHERE id = ? RETURNING id, title, content, created_at, updated_at`,
	)
		.bind(...values)
		.first<Note>();

	if (!result) {
		return c.json({ error: "Note not found" }, 404);
	}

	return c.json({ note: result });
});

// Delete a note
app.delete("/api/notes/:id", async (c) => {
	const id = Number(c.req.param("id"));
	if (!Number.isFinite(id)) {
		return c.json({ error: "Invalid id" }, 400);
	}

	const result = await c.env.DB.prepare("DELETE FROM notes WHERE id = ? RETURNING id")
		.bind(id)
		.first<{ id: number }>();

	if (!result) {
		return c.json({ error: "Note not found" }, 404);
	}

	return c.json({ ok: true, id: result.id });
});

export default app;
