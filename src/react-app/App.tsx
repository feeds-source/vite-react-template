import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

type View = "home" | "shop" | "product" | "about" | "contact" | "cart" | "login" | "register" | "account";
type Product = { id: string; name: string; category: string; price: number; compareAt?: number; description: string; tag?: string; accent: string };
type User = { id: number; email: string };
type Note = { id: number; title: string; content: string };
type CartLine = { product: Product; qty: number };

const TOKEN_KEY = "jeans_token";
const CATEGORIES = ["All", "Straight", "Relaxed", "Wide Leg", "Shorts", "Jackets", "Workwear"] as const;
const PRODUCTS: Product[] = [
  { id: "vintage-straight-indigo", name: "Vintage Straight Indigo", category: "Straight", price: 88, compareAt: 110, description: "Rigid indigo denim with a high rise and a clean vintage wash.", tag: "Best seller", accent: "#2f3f54" },
  { id: "selvedge-straight-rinse", name: "Selvedge Straight Rinse", category: "Straight", price: 128, description: "14oz Japanese selvedge with a rinse that keeps the indigo deep.", tag: "New", accent: "#243446" },
  { id: "first-wash-straight", name: "First Wash Straight", category: "Straight", price: 72, description: "Softer first pair. Light rinse, easy break-in, classic five-pocket cut.", tag: "Everyday", accent: "#3d536b" },
  { id: "relaxed-faded-clay", name: "Relaxed Faded Clay", category: "Relaxed", price: 96, description: "Room through the thigh with a sun-faded clay wash.", accent: "#6b4a32" },
  { id: "relaxed-stone-wash", name: "Relaxed Stone Wash", category: "Relaxed", price: 84, description: "Classic stone wash, mid rise, worn-in hand from day one.", accent: "#4a5a6a" },
  { id: "wide-leg-archive", name: "Wide Leg Archive", category: "Wide Leg", price: 118, compareAt: 140, description: "Full-leg vintage cut with a faded indigo seat.", tag: "Archive", accent: "#3a2e22" },
  { id: "wide-leg-ecru", name: "Wide Leg Ecru", category: "Wide Leg", price: 108, description: "Unwashed ecru denim. Cream warp, raw weft.", accent: "#8a7354" },
  { id: "cutoff-work-short", name: "Cutoff Work Short", category: "Shorts", price: 58, description: "Cut from leftover work denim. Frayed hem, patch pockets.", tag: "Summer", accent: "#5c4630" },
  { id: "carpenter-short", name: "Carpenter Short", category: "Shorts", price: 64, description: "Utility loop, hammer pocket, mid-thigh vintage length.", accent: "#4a3c2a" },
  { id: "truck-jacket-indigo", name: "Truck Jacket Indigo", category: "Jackets", price: 164, description: "Type-III silhouette in 12oz indigo. Brass buttons, broken-in collar.", tag: "Heritage", accent: "#2a3544" },
  { id: "chore-coat-khaki", name: "Chore Coat Khaki", category: "Workwear", price: 148, description: "French workwear cut in faded khaki twill.", accent: "#6a5a3a" },
  { id: "work-dungaree", name: "Work Dungaree", category: "Workwear", price: 132, description: "Bib-front vintage dungaree in rinsed denim.", tag: "Work", accent: "#3d4a38" },
];
const TICKER = ["Free shipping over $100", "Vintage washes, new stock weekly", "Repairs on every pair we sell"];
const COLLECTIONS = [
  { name: "Straight", accent: "linear-gradient(160deg,#2f3f54,#1a1610)" },
  { name: "Relaxed", accent: "linear-gradient(160deg,#6b4a32,#1c1610)" },
  { name: "Wide Leg", accent: "linear-gradient(160deg,#3a2e22,#14100c)" },
  { name: "Shorts", accent: "linear-gradient(160deg,#5c4630,#16120c)" },
  { name: "Jackets", accent: "linear-gradient(160deg,#2a3544,#12100c)" },
  { name: "Workwear", accent: "linear-gradient(160deg,#4a3c2a,#14100a)" },
];

async function api<T>(path: string, opts: RequestInit & { token?: string | null } = {}) {
  const headers = new Headers(opts.headers);
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);
  const res = await fetch(path, { ...opts, headers });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, data };
}

function App() {
  const [view, setView] = useState<View>("home");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hero, setHero] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cart.reduce((n, l) => n + l.product.price * l.qty, 0);
  const filtered = useMemo(() => (category === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === category)), [category]);

  const refreshMe = useCallback(async (t: string | null) => {
    if (!t) { setUser(null); setNotes([]); return; }
    const { ok, data } = await api<{ user?: User }>("/api/auth/me", { token: t });
    if (!ok || !data.user) { localStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null); return; }
    setUser(data.user);
    const notesRes = await api<{ notes?: Note[] }>("/api/notes", { token: t });
    if (notesRes.ok) setNotes(notesRes.data.notes ?? []);
  }, []);

  useEffect(() => {
    void api("/api/").then((r) => setApiOk(r.ok));
    const params = new URLSearchParams(window.location.search);
    const fromOAuth = params.get("auth_token");
    if (fromOAuth) { localStorage.setItem(TOKEN_KEY, fromOAuth); setToken(fromOAuth); window.history.replaceState({}, "", "/"); }
    if (params.get("auth_error")) { setAuthError(params.get("auth_error")!); setView("login"); window.history.replaceState({}, "", "/"); }
  }, []);

  useEffect(() => { void refreshMe(token); }, [token, refreshMe]);

  function persistToken(t: string | null) {
    if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
    setToken(t);
  }
  function goHome() { setView("home"); setSelected(null); setMenuOpen(false); }
  function goShop(cat: (typeof CATEGORIES)[number] = "All") { setCategory(cat); setSelected(null); setView("shop"); setMenuOpen(false); }
  function openProduct(p: Product) { setSelected(p); setView("product"); setMenuOpen(false); }
  function addToCart(p: Product) {
    setCart((prev) => {
      const hit = prev.find((l) => l.product.id === p.id);
      if (hit) return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product: p, qty: 1 }];
    });
  }
  function setQty(id: string, qty: number) {
    setCart((prev) => qty <= 0 ? prev.filter((l) => l.product.id !== id) : prev.map((l) => (l.product.id === id ? { ...l, qty } : l)));
  }

  async function handleAuth(mode: "login" | "register") {
    setAuthError(""); setAuthBusy(true);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const { ok, data } = await api<{ token?: string; error?: string }>(path, { method: "POST", body: JSON.stringify({ email: authEmail, password: authPassword }) });
    setAuthBusy(false);
    if (!ok || !data.token) { setAuthError(data.error ?? "Something went wrong"); return; }
    persistToken(data.token); setAuthPassword(""); setView("account");
  }
  async function handleLogout() {
    if (token) await api("/api/auth/logout", { method: "POST", token });
    persistToken(null); setView("home");
  }
  async function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !noteTitle.trim()) return;
    const { ok, data } = await api<{ note?: Note }>("/api/notes", { method: "POST", token, body: JSON.stringify({ title: noteTitle.trim(), content: noteContent.trim() }) });
    if (ok && data.note) { setNotes((n) => [data.note!, ...n]); setNoteTitle(""); setNoteContent(""); }
  }
  async function deleteNote(id: number) {
    if (!token) return;
    const { ok } = await api(`/api/notes/${id}`, { method: "DELETE", token });
    if (ok) setNotes((n) => n.filter((x) => x.id !== id));
  }
  async function saveProductNote(p: Product) {
    if (!token) { setView("login"); return; }
    const { ok, data } = await api<{ note?: Note }>("/api/notes", { method: "POST", token, body: JSON.stringify({ title: p.name, content: `Saved · ${p.category} · $${p.price}` }) });
    if (ok && data.note) { setNotes((n) => [data.note!, ...n]); setView("account"); }
  }

  const header = (
    <>
      <div className="ticker"><div className="ticker-track">{[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}</div></div>
      <header className="topbar">
        <button type="button" className="brand" onClick={goHome}>JEANS<small>Vintage denim</small></button>
        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <button type="button" className={view === "home" ? "active" : ""} onClick={goHome}>Home</button>
          <button type="button" className={view === "shop" || view === "product" ? "active" : ""} onClick={() => goShop()}>Shop</button>
          <button type="button" className={view === "about" ? "active" : ""} onClick={() => { setView("about"); setMenuOpen(false); }}>About</button>
          <button type="button" className={view === "contact" ? "active" : ""} onClick={() => { setView("contact"); setMenuOpen(false); }}>Contact</button>
        </nav>
        <div className="topbar-right">
          <button type="button" className="icon-btn" onClick={() => { setView(user ? "account" : "login"); setMenuOpen(false); }}>{user ? "Account" : "Sign in"}</button>
          <button type="button" className="icon-btn" onClick={() => setView("cart")}>Bag <em>{cartCount}</em></button>
          <button type="button" className="burger" onClick={() => setMenuOpen((o) => !o)}>Menu</button>
        </div>
      </header>
      {apiOk === false && <div className="api-banner">API offline — auth needs a live Worker.</div>}
    </>
  );

  const footer = (
    <footer className="foot">
      <div className="foot-grid">
        <div><p className="foot-brand">JEANS</p><p className="muted">Vintage denim. Washed by wear, cut for work, made to fade.</p></div>
        <div><h3>Shop</h3>{CATEGORIES.filter((c) => c !== "All").map((c) => <button key={c} type="button" onClick={() => goShop(c)}>{c}</button>)}</div>
        <div><h3>Account</h3><button type="button" onClick={() => setView(user ? "account" : "login")}>{user ? "My account" : "Sign in"}</button><button type="button" onClick={() => setView("contact")}>Contact</button></div>
        <div><h3>Atelier</h3><p className="muted">info@jeans.studio</p></div>
      </div>
      <div className="copyright">© {new Date().getFullYear()} Jeans · Vintage denim</div>
    </footer>
  );

  function shell(body: React.ReactNode) { return <div className="store">{header}{body}{footer}</div>; }

  if (view === "login" || view === "register") {
    const isLogin = view === "login";
    return shell(
      <main className="page auth-page">
        <p className="eyebrow">{isLogin ? "Welcome back" : "Join Jeans"}</p>
        <h1 className="page-title">{isLogin ? "Sign in" : "Create account"}</h1>
        <form className="contact-form auth-form" onSubmit={(e) => { e.preventDefault(); void handleAuth(isLogin ? "login" : "register"); }}>
          <label>Email<input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
          <label>Password<input type="password" required minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
          {authError && <p className="auth-error">{authError}</p>}
          <button type="submit" className="cta" disabled={authBusy}>{authBusy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}</button>
        </form>
        <p className="muted">{isLogin ? <>New? <button type="button" className="text-link" onClick={() => setView("register")}>Create account</button></> : <>Have an account? <button type="button" className="text-link" onClick={() => setView("login")}>Sign in</button></>}</p>
        <div className="oauth-row"><a className="cta ghost" href="/api/auth/oauth/github">GitHub</a><a className="cta ghost" href="/api/auth/oauth/google">Google</a></div>
      </main>
    );
  }

  if (view === "account") {
    return shell(
      <main className="page">
        <p className="eyebrow">Your account</p>
        <h1 className="page-title">{user ? user.email : "Account"}</h1>
        {!user ? <p className="muted"><button type="button" className="text-link" onClick={() => setView("login")}>Sign in</button></p> : (
          <>
            <div className="account-actions"><button type="button" className="cta ghost" onClick={() => void handleLogout()}>Sign out</button><button type="button" className="cta" onClick={() => goShop()}>Shop jeans</button></div>
            <section className="account-notes">
              <h2>Saved jeans & notes</h2>
              <form className="contact-form" onSubmit={(e) => void saveNote(e)}>
                <label>Title<input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required /></label>
                <label>Note<textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={3} /></label>
                <button type="submit" className="cta">Save</button>
              </form>
              <ul className="notes-list">
                {notes.length === 0 && <li className="muted">No saved jeans yet.</li>}
                {notes.map((n) => <li key={n.id}><div><strong>{n.title}</strong><p className="muted">{n.content}</p></div><button type="button" className="text-link" onClick={() => void deleteNote(n.id)}>Remove</button></li>)}
              </ul>
            </section>
          </>
        )}
      </main>
    );
  }

  if (view === "product" && selected) {
    return shell(
      <main className="page">
        <button type="button" className="back" onClick={() => goShop(selected.category as (typeof CATEGORIES)[number])}>Back to {selected.category}</button>
        <div className="detail-grid">
          <div className="detail-hero" style={{ background: `linear-gradient(145deg, ${selected.accent}, #1a1610)` }}><span className="hero-mark">{selected.category}</span><span className="hero-initial">{selected.name.charAt(0)}</span></div>
          <div className="detail-copy">
            {selected.tag && <span className="tag">{selected.tag}</span>}
            <h1>{selected.name}</h1>
            <p className="price">${selected.price}{selected.compareAt && <s>${selected.compareAt}</s>}</p>
            <p className="desc">{selected.description}</p>
            <div className="detail-actions">
              <button type="button" className="cta" onClick={() => addToCart(selected)}>Add to bag</button>
              <button type="button" className="cta ghost" onClick={() => void saveProductNote(selected)}>{user ? "Save to account" : "Sign in to save"}</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (view === "cart") {
    return shell(
      <main className="page">
        <h1 className="page-title">Your bag</h1>
        {cart.length === 0 ? <p className="muted"><button type="button" className="text-link" onClick={() => goShop()}>Shop jeans</button></p> : (
          <div className="cart-layout">
            <ul className="cart-list">{cart.map((l) => (
              <li key={l.product.id}>
                <div className="cart-swatch" style={{ background: l.product.accent }} />
                <div><strong>{l.product.name}</strong><p className="muted">${l.product.price}</p></div>
                <div className="qty"><button type="button" onClick={() => setQty(l.product.id, l.qty - 1)}>-</button><span>{l.qty}</span><button type="button" onClick={() => setQty(l.product.id, l.qty + 1)}>+</button></div>
                <strong>${l.product.price * l.qty}</strong>
              </li>
            ))}</ul>
            <aside className="cart-sum"><p>Subtotal <strong>${cartTotal}</strong></p><button type="button" className="cta" onClick={() => setView(user ? "contact" : "login")}>{user ? "Checkout" : "Sign in"}</button></aside>
          </div>
        )}
      </main>
    );
  }

  if (view === "about") {
    return shell(<main className="page about"><p className="eyebrow">About</p><h1>Jeans — vintage denim, cut to last</h1><p className="lede">An archive of washes and workwear. Straight, relaxed, and wide-leg jeans faded the old way.</p></main>);
  }

  if (view === "contact") {
    return shell(
      <main className="page">
        <h1 className="page-title">Contact</h1>
        <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <label>Name<input required /></label><label>Email<input type="email" required /></label><label>Message<textarea required rows={4} /></label>
          <button type="submit" className="cta">{sent ? "Sent" : "Send"}</button>
        </form>
      </main>
    );
  }

  if (view === "shop") {
    return shell(
      <main className="page">
        <div className="catalog-head"><h1 className="page-title">{category === "All" ? "Shop jeans" : category}</h1><p className="muted">{filtered.length} pieces</p></div>
        <div className="nav-cats">{CATEGORIES.map((c) => <button key={c} type="button" className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="grid">{filtered.map((p) => (
          <article key={p.id} className="card"><button type="button" className="card-hit" onClick={() => openProduct(p)}>
            <div className="card-visual" style={{ background: `linear-gradient(160deg, ${p.accent}, #1a1610)` }}>{p.tag && <span className="tag on-dark">{p.tag}</span>}<span className="card-initial">{p.name.charAt(0)}</span></div>
            <div className="card-body"><p className="card-cat">{p.category}</p><h3>{p.name}</h3><p className="card-price">${p.price}</p></div>
          </button></article>
        ))}</div>
      </main>
    );
  }

  return shell(
    <>
      <section className="hero">
        <div className="hero-slide">
          <p className="eyebrow light">Washed by wear</p>
          <h1>{hero === 0 ? <>Vintage jeans<br />cut for every day</> : <>Workwear denim<br />made to fade</>}</h1>
          <button type="button" className="cta" onClick={() => goShop("Straight")}>Shop jeans</button>
          <div className="hero-dots"><button type="button" className={hero === 0 ? "on" : ""} onClick={() => setHero(0)} /><button type="button" className={hero === 1 ? "on" : ""} onClick={() => setHero(1)} /></div>
        </div>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>Shop by cut</h2></div>
        <div className="collections">{COLLECTIONS.map((c) => <button key={c.name} type="button" className="col-card" style={{ background: c.accent }} onClick={() => goShop(c.name as (typeof CATEGORIES)[number])}><span>{c.name}</span></button>)}</div>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>The jeans rack</h2><button type="button" className="text-link" onClick={() => goShop()}>View all</button></div>
        <div className="grid">{PRODUCTS.slice(0, 8).map((p) => (
          <article key={p.id} className="card"><button type="button" className="card-hit" onClick={() => openProduct(p)}>
            <div className="card-visual" style={{ background: `linear-gradient(160deg, ${p.accent}, #1a1610)` }}><span className="card-initial">{p.name.charAt(0)}</span></div>
            <div className="card-body"><p className="card-cat">{p.category}</p><h3>{p.name}</h3><p className="card-price">${p.price}</p></div>
          </button></article>
        ))}</div>
      </section>
    </>
  );
}

export default App;
