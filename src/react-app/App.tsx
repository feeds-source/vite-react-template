import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

type View = "home" | "shop" | "product" | "about" | "contact" | "cart" | "login" | "register" | "account";
type Product = { id: string; name: string; category: string; price: number; compareAt?: number; description: string; tag?: string; accent: string };
type User = { id: number; email: string };
type Note = { id: number; title: string; content: string };
type CartLine = { product: Product; qty: number };

const TOKEN_KEY = "femme_token";
const CATEGORIES = ["All", "Bras", "Panties", "Lingerie", "Shapewear", "Sleepwear", "Loungewear"] as const;
const PRODUCTS: Product[] = [
  { id: "everyday-soft-bra", name: "Everyday Soft Cup Bra", category: "Bras", price: 42, compareAt: 52, description: "Wireless everyday bra with soft-stretch band.", tag: "Best seller", accent: "#6e1a48" },
  { id: "ultimate-tshirt-bra", name: "Ultimate T-Shirt Bra", category: "Bras", price: 48, description: "Smooth molded cups under knits.", tag: "New", accent: "#3d1a5c" },
  { id: "first-fit-teen-bra", name: "First Fit Bralette", category: "Bras", price: 28, description: "Gentle fit for growing teens.", tag: "Teen", accent: "#1f5a4a" },
  { id: "daily-hipster", name: "Daily Hipster Brief", category: "Panties", price: 16, description: "Breathable mid-rise brief.", accent: "#8a2a1e" },
  { id: "seamless-thong", name: "Seamless Soft Thong", category: "Panties", price: 14, description: "Nearly invisible under clothes.", accent: "#2a1848" },
  { id: "lace-balconette-set", name: "Lace Balconette Set", category: "Lingerie", price: 78, compareAt: 96, description: "Matching balconette and brief in midnight lace.", tag: "Set", accent: "#9b1f5a" },
  { id: "mesh-bodysuit", name: "Mesh Contour Bodysuit", category: "Lingerie", price: 88, description: "Sculpting mesh with snap closures.", accent: "#154038" },
  { id: "high-waist-shaper", name: "High-Waist Soft Shaper", category: "Shapewear", price: 54, description: "Light control, breathable knit.", tag: "Shape", accent: "#5c1840" },
  { id: "slip-short", name: "Everyday Slip Short", category: "Shapewear", price: 36, description: "Anti-chafe shorts with gentle hold.", accent: "#3a2048" },
  { id: "satin-night-set", name: "Satin Night Cami Set", category: "Sleepwear", price: 64, description: "Cool-touch satin cami and shorts.", tag: "Night", accent: "#b04a1a" },
  { id: "cloud-robe", name: "Cloud Knit Robe", category: "Loungewear", price: 72, description: "Mid-weight robe with self-tie belt.", accent: "#1a3a58" },
  { id: "lounge-wide-pant", name: "Wide-Leg Lounge Pant", category: "Loungewear", price: 58, description: "Relaxed drawstring modal pant.", accent: "#4a1840" },
];
const TICKER = ["Silk from dusk till dawn", "Jewel tones · gold thread · atelier cut", "Free shipping over $100"];
const COLLECTIONS = [
  { name: "Bras", accent: "linear-gradient(160deg,#8a2458,#1a0810)" },
  { name: "Panties", accent: "linear-gradient(160deg,#3d1a5c,#100814)" },
  { name: "Lingerie", accent: "linear-gradient(160deg,#b04a1a,#1a0c08)" },
  { name: "Shapewear", accent: "linear-gradient(160deg,#1f5a4a,#081410)" },
  { name: "Sleepwear", accent: "linear-gradient(160deg,#9b1f5a,#140810)" },
  { name: "Loungewear", accent: "linear-gradient(160deg,#1a3a58,#080c14)" },
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
        <button type="button" className="brand" onClick={goHome}>FEMME<small>Silk Atelier</small></button>
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
        <div><p className="foot-brand">FEMME</p><p className="muted">Exotic silk, jewel nights, and a single atelier on Cloudflare.</p></div>
        <div><h3>Shop</h3>{CATEGORIES.filter((c) => c !== "All").map((c) => <button key={c} type="button" onClick={() => goShop(c)}>{c}</button>)}</div>
        <div><h3>Account</h3><button type="button" onClick={() => setView(user ? "account" : "login")}>{user ? "My account" : "Sign in"}</button><button type="button" onClick={() => setView("contact")}>Contact</button></div>
        <div><h3>Store</h3><p className="muted">info@silkmoments.com</p></div>
      </div>
      <div className="copyright">© {new Date().getFullYear()} Femme · Silk Moments</div>
    </footer>
  );

  function shell(body: React.ReactNode) { return <div className="store">{header}{body}{footer}</div>; }

  if (view === "login" || view === "register") {
    const isLogin = view === "login";
    return shell(
      <main className="page auth-page">
        <p className="eyebrow">{isLogin ? "Welcome back" : "Join the atelier"}</p>
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
            <div className="account-actions"><button type="button" className="cta ghost" onClick={() => void handleLogout()}>Sign out</button><button type="button" className="cta" onClick={() => goShop()}>Shop</button></div>
            <section className="account-notes">
              <h2>Saved items & notes</h2>
              <form className="contact-form" onSubmit={(e) => void saveNote(e)}>
                <label>Title<input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required /></label>
                <label>Note<textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={3} /></label>
                <button type="submit" className="cta">Save</button>
              </form>
              <ul className="notes-list">
                {notes.length === 0 && <li className="muted">No saved items yet.</li>}
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
        <button type="button" className="back" onClick={() => goShop(selected.category as (typeof CATEGORIES)[number])}>Back</button>
        <div className="detail-grid">
          <div className="detail-hero" style={{ background: `linear-gradient(145deg, ${selected.accent}, #0b0610)` }}><span className="hero-mark">{selected.category}</span><span className="hero-initial">{selected.name.charAt(0)}</span></div>
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
        {cart.length === 0 ? <p className="muted"><button type="button" className="text-link" onClick={() => goShop()}>Shop</button></p> : (
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
    return shell(<main className="page about"><p className="eyebrow">The house</p><h1 className="page-title">Silk cut for night cities</h1><p className="lede">Femme is an exotic lingerie atelier: plum nights, gold thread, emerald mesh. The store, account, and bag live on one Cloudflare app.</p></main>);
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
        <div className="catalog-head"><h1 className="page-title">{category === "All" ? "The collection" : category}</h1><p className="muted">{filtered.length} pieces</p></div>
        <div className="nav-cats">{CATEGORIES.map((c) => <button key={c} type="button" className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="grid">{filtered.map((p) => (
          <article key={p.id} className="card"><button type="button" className="card-hit" onClick={() => openProduct(p)}>
            <div className="card-visual" style={{ background: `linear-gradient(160deg, ${p.accent}, #0b0610)` }}>{p.tag && <span className="tag on-dark">{p.tag}</span>}<span className="card-initial">{p.name.charAt(0)}</span></div>
            <div className="card-body"><p className="card-cat">{p.category}</p><h3>{p.name}</h3><p className="card-price">${p.price}</p></div>
          </button></article>
        ))}</div>
      </main>
    );
  }

  return shell(
    <>
      <section className="hero">
        <div className="hero-slide" style={{ background: "linear-gradient(115deg, rgba(155,31,90,0.35), rgba(26,58,88,0.2) 40%, transparent 70%)" }}>
          <p className="eyebrow light">After-dark silk · jewel cut</p>
          <h1>Worn like a secret<br />in a night market</h1>
          <button type="button" className="cta" onClick={() => goShop("Lingerie")}>Enter the atelier</button>
          <div className="hero-dots"><button type="button" className={hero === 0 ? "on" : ""} onClick={() => setHero(0)} /><button type="button" className={hero === 1 ? "on" : ""} onClick={() => setHero(1)} /></div>
        </div>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>Shop by collection</h2></div>
        <div className="collections">{COLLECTIONS.map((c) => <button key={c.name} type="button" className="col-card" style={{ background: c.accent }} onClick={() => goShop(c.name as (typeof CATEGORIES)[number])}><span>{c.name}</span></button>)}</div>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>House favorites</h2><button type="button" className="text-link" onClick={() => goShop()}>View all</button></div>
        <div className="grid">{PRODUCTS.slice(0, 8).map((p) => (
          <article key={p.id} className="card"><button type="button" className="card-hit" onClick={() => openProduct(p)}>
            <div className="card-visual" style={{ background: `linear-gradient(160deg, ${p.accent}, #0b0610)` }}><span className="card-initial">{p.name.charAt(0)}</span></div>
            <div className="card-body"><p className="card-cat">{p.category}</p><h3>{p.name}</h3><p className="card-price">${p.price}</p></div>
          </button></article>
        ))}</div>
      </section>
    </>
  );
}

export default App;
