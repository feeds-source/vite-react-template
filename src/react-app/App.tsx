import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

type View = "home" | "shop" | "product" | "about" | "contact" | "cart" | "login" | "register" | "account" | "wishlist" | "blog" | "post";
type Product = { id: string; name: string; category: string; price: number; compareAt?: number; description: string; tag?: string; accent: string; image: string };
type User = { id: number; email: string };
type Note = { id: number; title: string; content: string };
type CartLine = { product: Product; qty: number };
type Currency = "USD" | "EUR" | "GBP" | "AED" | "PKR";

const TOKEN_KEY = "femme_token";
const WISH_KEY = "femme_wish";
const FX_KEY = "femme_fx";
const CATEGORIES = ["All", "Bras", "Panties", "Lingerie", "Shapewear", "Sleepwear", "Loungewear", "Thermal"] as const;
const FX: Record<Currency, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: "$", rate: 1, label: "USD" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR" },
  GBP: { symbol: "£", rate: 0.78, label: "GBP" },
  AED: { symbol: "AED ", rate: 3.67, label: "AED" },
  PKR: { symbol: "Rs ", rate: 278, label: "PKR" },
};
const PRODUCTS: Product[] = [
  { id: "everyday-soft-bra", name: "Everyday Soft Cup Bra", category: "Bras", price: 42, compareAt: 52, description: "Wireless everyday bra with soft-stretch band.", tag: "Best seller", accent: "#6e1a48", image: "https://images.unsplash.com/photo-1563903530906-a27d02885ed3?auto=format&fit=crop&w=900&q=80" },
  { id: "ultimate-tshirt-bra", name: "Ultimate T-Shirt Bra", category: "Bras", price: 48, description: "Smooth molded cups under knits.", tag: "New", accent: "#3d1a5c", image: "https://images.unsplash.com/photo-1617551307538-25c64739bca5?auto=format&fit=crop&w=900&q=80" },
  { id: "first-fit-teen-bra", name: "First Fit Bralette", category: "Bras", price: 28, description: "Gentle fit for growing teens.", tag: "Teen", accent: "#1f5a4a", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" },
  { id: "daily-hipster", name: "Daily Hipster Brief", category: "Panties", price: 16, description: "Breathable mid-rise brief.", accent: "#8a2a1e", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80" },
  { id: "seamless-thong", name: "Seamless Soft Thong", category: "Panties", price: 14, description: "Nearly invisible under clothes.", accent: "#2a1848", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80" },
  { id: "lace-balconette-set", name: "Lace Balconette Set", category: "Lingerie", price: 78, compareAt: 96, description: "Matching balconette and brief in midnight lace.", tag: "Set", accent: "#9b1f5a", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80" },
  { id: "mesh-bodysuit", name: "Mesh Contour Bodysuit", category: "Lingerie", price: 88, description: "Sculpting mesh with snap closures.", accent: "#154038", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80" },
  { id: "high-waist-shaper", name: "High-Waist Soft Shaper", category: "Shapewear", price: 54, description: "Light control, breathable knit.", tag: "Shape", accent: "#5c1840", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80" },
  { id: "slip-short", name: "Everyday Slip Short", category: "Shapewear", price: 36, description: "Anti-chafe shorts with gentle hold.", accent: "#3a2048", image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80" },
  { id: "satin-night-set", name: "Satin Night Cami Set", category: "Sleepwear", price: 64, description: "Cool-touch satin cami and shorts.", tag: "Night", accent: "#b04a1a", image: "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?auto=format&fit=crop&w=900&q=80" },
  { id: "cloud-robe", name: "Cloud Knit Robe", category: "Loungewear", price: 72, description: "Mid-weight robe with self-tie belt.", accent: "#1a3a58", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80" },
  { id: "lounge-wide-pant", name: "Wide-Leg Lounge Pant", category: "Loungewear", price: 58, description: "Relaxed drawstring modal pant.", accent: "#4a1840", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80" },
  { id: "thermal-set", name: "Soft Thermal Set", category: "Thermal", price: 68, description: "Warm layer set for cooler nights.", tag: "Warm", accent: "#1a3a58", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80" },
];
const TICKER = ["Free Shipping Over $100+", "10% OFF on Selective New items", "COD available on all orders"];
const SLIDES = [
  { kicker: "Your First Fit Should Be the Right One", title: "The Ultimate Bra Style Guide for Every Outfit", lede: "Comfortable, gentle innerwear", cat: "Bras" as const },
  { kicker: "Find Your Fit, Feel the Difference", title: "Everyday Bras & Undies That Move with You", lede: "Soft, breathable styles for real life", cat: "Panties" as const },
];
const LOOKBOOK = [
  { name: "Bras", price: 119.99, video: "https://cdn.shopify.com/videos/c/o/v/30f5e22f0c054ae493e39c687a44d696.mp4" },
  { name: "Lingerie", price: 139.99, video: "https://cdn.shopify.com/videos/c/o/v/4fe7f9993e144f5fa95e7baca497775c.mp4" },
  { name: "Shapewear", price: 179.99, video: "https://cdn.shopify.com/videos/c/o/v/9816dc8146e44454892d2a00834650a1.mp4" },
  { name: "Panties", price: 109.99, video: "https://cdn.shopify.com/videos/c/o/v/cb781b1e5f314a97bf9121614b16779c.mp4" },
  { name: "Sleepwear", price: 99.99, video: "https://cdn.shopify.com/videos/c/o/v/91665cf8466f44779b373bd482b9729b.mp4" },
];
const QUOTES = [
  { title: "Real Comfort, Finally!", who: "Emily R., London, UK" },
  { title: "My Go-To Brand, Always", who: "Sophie L., New York, USA" },
  { title: "Perfect for Every Curve", who: "Isabella M., Melbourne, Australia" },
  { title: "Fast Delivery & Beautiful Packaging", who: "Layla A., Dubai, UAE" },
  { title: "Comfortable Fit & Great Support", who: "Noor S., Abu Dhabi, UAE" },
];
const SERVICES = [
  { title: "Free & Fast Delivery", text: "Complimentary shipping on qualifying orders." },
  { title: "24/7 Online Support", text: "Write us anytime. Real people, real answers." },
  { title: "30-Day Easy Returns", text: "Exchange or return within 30 days." },
];
const COLLECTIONS = [
  { name: "Bras", accent: "linear-gradient(160deg,#8a2458,#1a0810)" },
  { name: "Panties", accent: "linear-gradient(160deg,#3d1a5c,#100814)" },
  { name: "Lingerie", accent: "linear-gradient(160deg,#b04a1a,#1a0c08)" },
  { name: "Shapewear", accent: "linear-gradient(160deg,#1f5a4a,#081410)" },
  { name: "Sleepwear", accent: "linear-gradient(160deg,#9b1f5a,#140810)" },
  { name: "Thermal", accent: "linear-gradient(160deg,#1a3a58,#080c14)" },
];
const POSTS = [
  { id: "fit-guide", title: "The first-fit bra guide", date: "May 12, 2026", excerpt: "How to choose everyday support without giving up softness.", body: "Start with band first, then cup. A first-fit bra should feel quiet on the body." },
  { id: "move-with-you", title: "Support that moves with you", date: "May 20, 2026", excerpt: "What to wear when the day runs from desk to dinner.", body: "T-shirt bras and light shapewear hold a clean line under knits." },
  { id: "night-silk", title: "Satin nights, unapologetically Femme", date: "June 2, 2026", excerpt: "Sleepwear that still feels like an occasion.", body: "Cool-touch satin and a cloud robe are the house formula after dark." },
  { id: "packaging", title: "Why packaging matters", date: "June 18, 2026", excerpt: "Clients in Dubai and Abu Dhabi keep mentioning the unboxing.", body: "Every order is wrapped like a gift. Easy 30-day returns if the fit is wrong." },
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
  const [post, setPost] = useState<(typeof POSTS)[number] | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(WISH_KEY) || "[]"); } catch { return []; } });
  const [fx, setFx] = useState<Currency>(() => (localStorage.getItem(FX_KEY) as Currency) || "USD");
  const [hero, setHero] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mega, setMega] = useState(false);
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
  const wished = useMemo(() => PRODUCTS.filter((p) => wish.includes(p.id)), [wish]);
  const slide = SLIDES[hero] ?? SLIDES[0];
  const money = (n: number) => {
    const c = FX[fx];
    const v = n * c.rate;
    if (fx === "PKR" || fx === "AED") return `${c.symbol}${Math.round(v).toLocaleString()}`;
    return `${c.symbol}${v.toFixed(2)}`;
  };

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
  useEffect(() => { localStorage.setItem(WISH_KEY, JSON.stringify(wish)); }, [wish]);
  useEffect(() => { localStorage.setItem(FX_KEY, fx); }, [fx]);

  function persistToken(t: string | null) {
    if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
    setToken(t);
  }
  function goHome() { setView("home"); setSelected(null); setMenuOpen(false); setMega(false); }
  function goShop(cat: (typeof CATEGORIES)[number] = "All") { setCategory(cat); setSelected(null); setView("shop"); setMenuOpen(false); setMega(false); }
  function openProduct(p: Product) { setSelected(p); setView("product"); setMenuOpen(false); setMega(false); }
  function openPost(p: (typeof POSTS)[number]) { setPost(p); setView("post"); setMenuOpen(false); }
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
  function toggleWish(id: string) { setWish((w) => w.includes(id) ? w.filter((x) => x !== id) : [...w, id]); }

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
    const { ok, data } = await api<{ note?: Note }>("/api/notes", { method: "POST", token, body: JSON.stringify({ title: p.name, content: `Saved · ${p.category} · ${money(p.price)}` }) });
    if (ok && data.note) { setNotes((n) => [data.note!, ...n]); setView("account"); }
  }

  const productCard = (p: Product) => (
    <article key={p.id} className="card">
      <button type="button" className="wish-btn" onClick={() => toggleWish(p.id)} aria-label="Wishlist">{wish.includes(p.id) ? "♥" : "♡"}</button>
      <button type="button" className="card-hit" onClick={() => openProduct(p)}>
        <div className="card-visual" style={{ backgroundImage: `linear-gradient(180deg,transparent 40%,#0b0610), url(${p.image})` }}>
          {p.tag && <span className="tag on-dark">{p.tag}</span>}
        </div>
        <div className="card-body"><p className="card-cat">{p.category}</p><h3>{p.name}</h3><p className="card-price">{money(p.price)}</p></div>
      </button>
    </article>
  );

  const header = (
    <>
      <div className="ticker"><div className="ticker-track">{[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}</div></div>
      <header className="topbar">
        <button type="button" className="brand" onClick={goHome}>FEMME<small>Silk Atelier</small></button>
        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <button type="button" className={view === "home" ? "active" : ""} onClick={goHome}>Home</button>
          <div className={`mega-wrap ${mega ? "open" : ""}`} onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
            <button type="button" className={view === "shop" || view === "product" ? "active" : ""} onClick={() => goShop()}>Shop</button>
            <div className="mega">
              <p className="eyebrow">Collections</p>
              <div className="mega-grid">{CATEGORIES.filter((c) => c !== "All").map((c) => <button key={c} type="button" onClick={() => goShop(c)}>{c}</button>)}</div>
            </div>
          </div>
          <button type="button" className={view === "blog" || view === "post" ? "active" : ""} onClick={() => { setView("blog"); setMenuOpen(false); }}>Journal</button>
          <button type="button" className={view === "about" ? "active" : ""} onClick={() => { setView("about"); setMenuOpen(false); }}>About</button>
          <button type="button" className={view === "contact" ? "active" : ""} onClick={() => { setView("contact"); setMenuOpen(false); }}>Contact</button>
        </nav>
        <div className="topbar-right">
          <select className="fx" value={fx} onChange={(e) => setFx(e.target.value as Currency)} aria-label="Currency">
            {Object.keys(FX).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" className="icon-btn" onClick={() => { setView("wishlist"); setMenuOpen(false); }}>Wish <em>{wish.length}</em></button>
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
        <div><p className="foot-brand">FEMME</p><p className="muted">Comfort, confidence and care — on Cloudflare.</p></div>
        <div><h3>Shop</h3>{CATEGORIES.filter((c) => c !== "All").map((c) => <button key={c} type="button" onClick={() => goShop(c)}>{c}</button>)}</div>
        <div><h3>House</h3><button type="button" onClick={() => setView("blog")}>Journal</button><button type="button" onClick={() => setView("wishlist")}>Wishlist</button><button type="button" onClick={() => setView(user ? "account" : "login")}>{user ? "My account" : "Sign in"}</button></div>
        <div><h3>Store</h3><p className="muted">info@silkmoments.com</p></div>
      </div>
      <div className="copyright">© {new Date().getFullYear()} Femme · Silk Moments · Prices in {fx}</div>
    </footer>
  );

  function shell(body: React.ReactNode) { return <div className="store">{header}{body}{footer}</div>; }

  if (view === "login" || view === "register") {
    const isLogin = view === "login";
    return shell(
      <main className="page auth-page">
        <p className="eyebrow">{isLogin ? "Welcome back" : "Join Femme"}</p>
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
          <div className="detail-hero photo" style={{ backgroundImage: `url(${selected.image})` }}><span className="hero-mark">{selected.category}</span></div>
          <div className="detail-copy">
            {selected.tag && <span className="tag">{selected.tag}</span>}
            <h1>{selected.name}</h1>
            <p className="price">{money(selected.price)}{selected.compareAt && <s>{money(selected.compareAt)}</s>}</p>
            <p className="desc">{selected.description}</p>
            <div className="detail-actions">
              <button type="button" className="cta" onClick={() => addToCart(selected)}>Add to bag</button>
              <button type="button" className="cta ghost" onClick={() => toggleWish(selected.id)}>{wish.includes(selected.id) ? "In wishlist" : "Add to wishlist"}</button>
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
                <div className="cart-swatch photo" style={{ backgroundImage: `url(${l.product.image})` }} />
                <div><strong>{l.product.name}</strong><p className="muted">{money(l.product.price)}</p></div>
                <div className="qty"><button type="button" onClick={() => setQty(l.product.id, l.qty - 1)}>-</button><span>{l.qty}</span><button type="button" onClick={() => setQty(l.product.id, l.qty + 1)}>+</button></div>
                <strong>{money(l.product.price * l.qty)}</strong>
              </li>
            ))}</ul>
            <aside className="cart-sum"><p>Subtotal <strong>{money(cartTotal)}</strong></p><button type="button" className="cta" onClick={() => setView(user ? "contact" : "login")}>{user ? "Checkout" : "Sign in"}</button></aside>
          </div>
        )}
      </main>
    );
  }

  if (view === "wishlist") {
    return shell(
      <main className="page">
        <div className="catalog-head"><h1 className="page-title">Wishlist</h1><p className="muted">{wished.length} saved</p></div>
        {wished.length === 0 ? <p className="muted">Tap the heart on any piece.</p> : <div className="grid">{wished.map(productCard)}</div>}
      </main>
    );
  }

  if (view === "blog") {
    return shell(
      <main className="page">
        <p className="eyebrow">From the blog</p>
        <h1 className="page-title">Journal</h1>
        <div className="blog-grid">{POSTS.map((p) => (
          <article key={p.id} className="blog-card"><button type="button" className="card-hit" onClick={() => openPost(p)}>
            <p className="card-cat">{p.date}</p><h3>{p.title}</h3><p className="muted">{p.excerpt}</p>
          </button></article>
        ))}</div>
      </main>
    );
  }

  if (view === "post" && post) {
    return shell(
      <main className="page">
        <button type="button" className="back" onClick={() => setView("blog")}>Journal</button>
        <p className="eyebrow">{post.date}</p>
        <h1 className="page-title">{post.title}</h1>
        <p className="lede">{post.body}</p>
      </main>
    );
  }

  if (view === "about") {
    return shell(
      <main className="page about">
        <p className="eyebrow">About us</p>
        <h1 className="page-title">Femme — redefining comfort, confidence & care</h1>
        <p className="lede">At Femme, true beauty begins with self-love. Built for women, by women. Celebrate you — bold, beautiful, and unapologetically Femme.</p>
      </main>
    );
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
        <div className="grid">{filtered.map(productCard)}</div>
      </main>
    );
  }

  return shell(
    <>
      <section className="hero">
        <div className="hero-slide" style={{ background: "linear-gradient(115deg, rgba(155,31,90,0.38), rgba(26,58,88,0.22) 42%, transparent 72%)" }}>
          <p className="eyebrow light">{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <p className="lede light">{slide.lede}</p>
          <button type="button" className="cta" onClick={() => goShop(slide.cat)}>Shop now</button>
          <div className="hero-dots">{SLIDES.map((_, i) => <button key={i} type="button" className={hero === i ? "on" : ""} onClick={() => setHero(i)} />)}</div>
        </div>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>Shop by collection</h2></div>
        <div className="collections">{COLLECTIONS.map((c) => <button key={c.name} type="button" className="col-card" style={{ background: c.accent }} onClick={() => goShop(c.name as (typeof CATEGORIES)[number])}><span>{c.name}</span></button>)}</div>
      </section>
      <section className="page split-banner">
        <p className="eyebrow">New collection</p>
        <h2>Support that moves with you</h2>
        <p className="lede">Find the perfect bra for every mood, move, and moment.</p>
        <button type="button" className="cta" onClick={() => goShop("Bras")}>Shop now</button>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>Shop best collection</h2><button type="button" className="text-link" onClick={() => goShop()}>View all</button></div>
        <div className="grid">{PRODUCTS.slice(0, 8).map(productCard)}</div>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>Lookbook</h2></div>
        <div className="lookbook">{LOOKBOOK.map((l) => (
          <button key={l.name} type="button" className="look-card video" onClick={() => goShop(l.name as (typeof CATEGORIES)[number])}>
            <video src={l.video} muted loop playsInline autoPlay preload="metadata" />
            <span className="card-cat">{l.name}</span>
            <strong>Start {money(l.price)}</strong>
          </button>
        ))}</div>
      </section>
      <section className="page">
        <div className="catalog-head"><h2>From the blog</h2><button type="button" className="text-link" onClick={() => setView("blog")}>View all</button></div>
        <div className="blog-grid">{POSTS.slice(0, 3).map((p) => (
          <article key={p.id} className="blog-card"><button type="button" className="card-hit" onClick={() => openPost(p)}>
            <p className="card-cat">{p.date}</p><h3>{p.title}</h3><p className="muted">{p.excerpt}</p>
          </button></article>
        ))}</div>
      </section>
      <section className="page quotes">
        <div className="catalog-head"><h2>What our clients say</h2></div>
        <div className="quote-grid">{QUOTES.map((q) => (
          <blockquote key={q.who} className="quote"><p>{q.title}</p><cite>{q.who}</cite></blockquote>
        ))}</div>
      </section>
      <section className="page">
        <div className="service-row">{SERVICES.map((s) => (
          <article key={s.title} className="service"><h3>{s.title}</h3><p className="muted">{s.text}</p></article>
        ))}</div>
      </section>
    </>
  );
}

export default App;
