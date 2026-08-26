import { useCallback, useEffect, useState } from "react";
import "./App.css";

type Note = {
	id: number;
	title: string;
	content: string;
	created_at: string;
	updated_at: string;
};

function App() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const loadNotes = useCallback(async () => {
		setError(null);
		try {
			const res = await fetch("/api/notes");
			if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);
			const data = (await res.json()) as { notes: Note[] };
			setNotes(data.notes);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load notes");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadNotes();
	}, [loadNotes]);

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;

		setSaving(true);
		setError(null);
		try {
			const res = await fetch("/api/notes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: title.trim(), content: content.trim() }),
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { error?: string } | null;
				throw new Error(body?.error ?? `Create failed (${res.status})`);
			}
			setTitle("");
			setContent("");
			await loadNotes();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to create note");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(id: number) {
		setError(null);
		try {
			const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
			if (!res.ok) throw new Error(`Delete failed (${res.status})`);
			setNotes((prev) => prev.filter((n) => n.id !== id));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to delete note");
		}
	}

	return (
		<div className="app">
			<header className="header">
				<h1>Notes + D1</h1>
				<p className="subtitle">Vite · React · Hono · Cloudflare Workers · D1</p>
			</header>

			<section className="panel">
				<h2>New note</h2>
				<form onSubmit={handleCreate} className="form">
					<input
						type="text"
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						disabled={saving}
						required
					/>
					<textarea
						placeholder="Content (optional)"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						disabled={saving}
						rows={3}
					/>
					<button type="submit" disabled={saving || !title.trim()}>
						{saving ? "Saving…" : "Add note"}
					</button>
				</form>
			</section>

			{error && <div className="error">{error}</div>}

			<section className="panel">
				<div className="panel-header">
					<h2>Notes</h2>
					<button type="button" className="ghost" onClick={() => void loadNotes()} disabled={loading}>
						Refresh
					</button>
				</div>

				{loading ? (
					<p className="muted">Loading…</p>
				) : notes.length === 0 ? (
					<p className="muted">No notes yet. Create one above.</p>
				) : (
					<ul className="notes">
						{notes.map((note) => (
							<li key={note.id} className="note">
								<div className="note-body">
									<strong>{note.title}</strong>
									{note.content && <p>{note.content}</p>}
									<small className="muted">{new Date(note.created_at + "Z").toLocaleString()}</small>
								</div>
								<button type="button" className="danger" onClick={() => void handleDelete(note.id)}>
									Delete
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

export default App;
