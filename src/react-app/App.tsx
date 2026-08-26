import { useCallback, useEffect, useState } from "react";
import "./App.css";

type Note = {
	id: number;
	title: string;
	content: string;
	created_at: string;
	updated_at: string;
};

type User = {
	id: number;
	email: string;
};

const TOKEN_KEY = "notes_auth_token";

function authHeaders(token: string | null): HeadersInit {
	const h: Record<string, string> = { "Content-Type": "application/json" };
	if (token) h.Authorization = `Bearer ${token}`;
	return h;
}

function App() {
	const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
	const [user, setUser] = useState<User | null>(null);
	const [authMode, setAuthMode] = useState<"login" | "register">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authLoading, setAuthLoading] = useState(false);

	const [notes, setNotes] = useState<Note[]>([]);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [booting, setBooting] = useState(true);

	const persistToken = (t: string | null) => {
		setToken(t);
		if (t) localStorage.setItem(TOKEN_KEY, t);
		else localStorage.removeItem(TOKEN_KEY);
	};

	// Restore session on load
	useEffect(() => {
		if (!token) {
			setBooting(false);
			return;
		}
		void (async () => {
			try {
				const res = await fetch("/api/auth/me", { headers: authHeaders(token) });
				if (!res.ok) throw new Error("session invalid");
				const data = (await res.json()) as { user: User };
				setUser(data.user);
			} catch {
				persistToken(null);
				setUser(null);
			} finally {
				setBooting(false);
			}
		})();
	}, [token]);

	const loadNotes = useCallback(async () => {
		if (!token) return;
		setError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/notes", { headers: authHeaders(token) });
			if (res.status === 401) {
				persistToken(null);
				setUser(null);
				throw new Error("Session expired — please log in again");
			}
			if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);
			const data = (await res.json()) as { notes: Note[] };
			setNotes(data.notes);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load notes");
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		if (user && token) void loadNotes();
	}, [user, token, loadNotes]);

	async function handleAuth(e: React.FormEvent) {
		e.preventDefault();
		setAuthLoading(true);
		setError(null);
		try {
			const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
			const res = await fetch(path, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim(), password }),
			});
			const data = (await res.json().catch(() => null)) as
				| { user?: User; token?: string; error?: string }
				| null;
			if (!res.ok) throw new Error(data?.error ?? `Auth failed (${res.status})`);
			if (!data?.token || !data.user) throw new Error("Invalid auth response");
			persistToken(data.token);
			setUser(data.user);
			setPassword("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Authentication failed");
		} finally {
			setAuthLoading(false);
		}
	}

	async function handleLogout() {
		if (token) {
			await fetch("/api/auth/logout", {
				method: "POST",
				headers: authHeaders(token),
			}).catch(() => null);
		}
		persistToken(null);
		setUser(null);
		setNotes([]);
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim() || !token) return;

		setSaving(true);
		setError(null);
		try {
			const res = await fetch("/api/notes", {
				method: "POST",
				headers: authHeaders(token),
				body: JSON.stringify({ title: title.trim(), content: content.trim() }),
			});
			if (res.status === 401) {
				persistToken(null);
				setUser(null);
				throw new Error("Session expired — please log in again");
			}
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
		if (!token) return;
		setError(null);
		try {
			const res = await fetch(`/api/notes/${id}`, {
				method: "DELETE",
				headers: authHeaders(token),
			});
			if (res.status === 401) {
				persistToken(null);
				setUser(null);
				throw new Error("Session expired — please log in again");
			}
			if (!res.ok) throw new Error(`Delete failed (${res.status})`);
			setNotes((prev) => prev.filter((n) => n.id !== id));
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to delete note");
		}
	}

	if (booting) {
		return (
			<div className="app">
				<p className="muted">Loading…</p>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="app">
				<header className="header">
					<h1>Notes + D1</h1>
					<p className="subtitle">Sign in to manage your notes</p>
				</header>

				<section className="panel">
					<div className="panel-header">
						<h2>{authMode === "login" ? "Log in" : "Create account"}</h2>
						<button
							type="button"
							className="ghost"
							onClick={() => {
								setAuthMode(authMode === "login" ? "register" : "login");
								setError(null);
							}}
						>
							{authMode === "login" ? "Need an account?" : "Have an account?"}
						</button>
					</div>

					<form onSubmit={handleAuth} className="form">
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={authLoading}
							autoComplete="email"
							required
						/>
						<input
							type="password"
							placeholder="Password (min 8 chars)"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={authLoading}
							autoComplete={authMode === "login" ? "current-password" : "new-password"}
							minLength={8}
							required
						/>
						<button type="submit" disabled={authLoading}>
							{authLoading ? "Please wait…" : authMode === "login" ? "Log in" : "Register"}
						</button>
					</form>
				</section>

				{error && <div className="error">{error}</div>}
			</div>
		);
	}

	return (
		<div className="app">
			<header className="header">
				<div className="header-row">
					<div>
						<h1>Notes + D1</h1>
						<p className="subtitle">Signed in as {user.email}</p>
					</div>
					<button type="button" className="ghost" onClick={() => void handleLogout()}>
						Log out
					</button>
				</div>
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
					<h2>Your notes</h2>
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
