import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

type View = "home" | "shop" | "product" | "about" | "contact" | "cart" | "checkout" | "login" | "register" | "forgot" | "reset" | "account" | "wishlist" | "blog" | "post";
type Product = { id: string; name: string; category: string; price: number; compareAt?: number; description: string; tag?: string; accent: string; image: string };
type User = { id: number; email: string };
type Note = { id: number; title: string; content: string };
type CartLine = { product: Product; qty: number };
type Currency = "USD" | "EUR" | "GBP" | "AED" | "PKR";

const TOKEN_KEY = "femme_token";
const WISH_KEY = "femme_wish";
const FX_KEY = "femme_fx";
const NEXT_KEY = "femme_next";
const CATEGORIES = ["All", "Bras", "Panties", "Lingerie", "Shapewear", "Sleepwear", "Loungewear", "Thermal"] as const;
const FX: Record<Currency, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 }, EUR: { symbol: "€", rate: 0.92 }, GBP: { symbol: "£", rate: 0.78 }, AED: { symbol: "AED ", rate: 3.67 }, PKR: { symbol: "Rs ", rate: 278 },
};
const photo = (id: string, w = 640) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=60`;
const PRODUCTS: Product[] = [
  { id: "everyday-soft-bra", name: "Everyday Soft Cup Bra", category: "Bras", price: 42, compareAt: 52, description: "Wireless everyday bra.", tag: "Best seller", accent: "#6e1a48", image: photo("photo-1515886657613-9f3515b0c78f") },
  { id: "ultimate-tshirt-bra", name: "Ultimate T-Shirt Bra", category: "Bras", price: 48, description: "Smooth molded cups.", tag: "New", accent: "#3d1a5c", image: photo("photo-1524504388940-b1c1722653e1") },
  { id: "first-fit-teen-bra", name: "First Fit Bralette", category: "Bras", price: 28, description: "Gentle first-fit bralette.", tag: "Teen", accent: "#1f5a4a", image: photo("photo-1487412720507-e7ab37603c6f") },
  { id: "daily-hipster", name: "Daily Hipster Brief", category: "Panties", price: 16, description: "Breathable mid-rise brief.", accent: "#8a2a1e", image: photo("photo-1469334031218-e382a71b716b") },
  { id: "seamless-thong", name: "Seamless Soft Thong", category: "Panties", price: 14, description: "Nearly invisible.", accent: "#2a1848", image: photo("photo-1490481651871-ab68de25d43d") },
  { id: "lace-balconette-set", name: "Lace Balconette Set", category: "Lingerie", price: 78, compareAt: 96, description: "Midnight lace set.", tag: "Set", accent: "#9b1f5a", image: photo("photo-1515372039744-b8f02a3ae446") },
  { id: "mesh-bodysuit", name: "Mesh Contour Bodysuit", category: "Lingerie", price: 88, description: "Sculpting mesh.", accent: "#154038", image: photo("photo-1529626455594-4ff0802cfb7e") },
  { id: "high-waist-shaper", name: "High-Waist Soft Shaper", category: "Shapewear", price: 54, description: "Light control.", tag: "Shape", accent: "#5c1840", image: photo("photo-1503342217505-b0a15ec3261c") },
  { id: "slip-short", name: "Everyday Slip Short", category: "Shapewear", price: 36, description: "Anti-chafe shorts.", accent: "#3a2048", image: photo("photo-1483985988355-763728e1935b") },
  { id: "satin-night-set", name: "Satin Night Cami Set", category: "Sleepwear", price: 64, description: "Cool-touch satin.", tag: "Night", accent: "#b04a1a", image: photo("photo-1515886657613-9f3515b0c78f") },
  { id: "cloud-robe", name: "Cloud Knit Robe", category: "Loungewear", price: 72, description: "Mid-weight robe.", accent: "#1a3a58", image: photo("photo-1469334031218-e382a71b716b") },
  { id: "lounge-wide-pant", name: "Wide-Leg Lounge Pant", category: "Loungewear", price: 58, description: "Relaxed modal pant.", accent: "#4a1840", image: photo("photo-1524504388940-b1c1722653e1") },
  { id: "thermal-set", name: "Soft Thermal Set", category: "Thermal", price: 68, description: "Warm layer set.", tag: "Warm", accent: "#1a3a58", image: photo("photo-1487412720507-e7ab37603c6f") },
];
const TICKER = ["Free Shipping Over $100+", "10% OFF on Selective New items", "COD available on all orders"];
const SLIDES = [
  { kicker: "Your First Fit Should Be the Right One", title: "The Ultimate Bra Style Guide for Every Outfit", lede: "Comfortable, gentle innerwear", cat: "Bras" as const, image: photo("photo-1515886657613-9f3515b0c78f", 1400) },
  { kicker: "Find Your Fit, Feel the Difference", title: "Everyday Bras & Undies That Move with You", lede: "Soft, breathable styles for real life", cat: "Panties" as const, image: photo("photo-1469334031218-e382a71b716b", 1400) },
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
  { title: "24/7 Online Support", text: "Write us anytime." },
  { title: "30-Day Easy Returns", text: "Exchange or return within 30 days." },
];
const COLLECTIONS = [
  { name: "Bras", accent: "linear-gradient(160deg,#8a2458,#1a0810)", image: photo("photo-1515886657613-9f3515b0c78f", 720) },
  { name: "Panties", accent: "linear-gradient(160deg,#3d1a5c,#100814)", image: photo("photo-1469334031218-e382a71b716b", 720) },
  { name: "Lingerie", accent: "linear-gradient(160deg,#b04a1a,#1a0c08)", image: photo("photo-1524504388940-b1c1722653e1", 720) },
  { name: "Shapewear", accent: "linear-gradient(160deg,#1f5a4a,#081410)", image: photo("photo-1515372039744-b8f02a3ae446", 720) },
  { name: "Sleepwear", accent: "linear-gradient(160deg,#9b1f5a,#140810)", image: photo("photo-1490481651871-ab68de25d43d", 720) },
  { name: "Thermal", accent: "linear-gradient(160deg,#1a3a58,#080c14)", image: photo("photo-1487412720507-e7ab37603c6f", 720) },
];
const POSTS = [
  { id: "fit-guide", title: "The first-fit bra guide", date: "May 12, 2026", excerpt: "How to choose everyday support.", body: "Start with band first, then cup." },
  { id: "move-with-you", title: "Support that moves with you", date: "May 20, 2026", excerpt: "Desk to dinner.", body: "T-shirt bras hold a clean line under knits." },
  { id: "night-silk", title: "Satin nights", date: "June 2, 2026", excerpt: "Sleepwear as an occasion.", body: "Satin cami and a cloud robe after dark." },
  { id: "packaging", title: "Why packaging matters", date: "June 18, 2026", excerpt: "Unboxing in Dubai and Abu Dhabi.", body: "Every order is wrapped like a gift." },
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
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [placed, setPlaced] = useState(false);
  const [shipName, setShipName] = useState("");
  const [shipAddr, setShipAddr] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [authNotice, setAuthNotice] = useState("");

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
    const next = params.get("next") || localStorage.getItem(NEXT_KEY);
    if (fromOAuth) {
      localStorage.setItem(TOKEN_KEY, fromOAuth);
      setToken(fromOAuth);
      if (next === "checkout" || next === "account" || next === "cart") setView(next);
      localStorage.removeItem(NEXT_KEY);
      window.history.replaceState({}, "", "/");
    }
    if (params.get("auth_error")) { setAuthError(params.get("auth_error")!); setView("checkout"); window.history.replaceState({}, "", "/"); }
    const resetFromLink = params.get("reset_token");
    if (resetFromLink) { setResetToken(resetFromLink); setView("reset"); window.history.replaceState({}, "", "/"); }
  }, []);
  useEffect(() => { void refreshMe(token); }, [token, refreshMe]);
  useEffect(() => { localStorage.setItem(WISH_KEY, JSON.stringify(wish)); }, [wish]);
  useEffect(() => { localStorage.setItem(FX_KEY, fx); }, [fx]);
  useEffect(() => {
    if (view !== "home") return;
    const id = window.setInterval(() => setHero((h) => (h + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(id);
  }, [view]);

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
    persistToken(data.token); setAuthPassword("");
    const next = localStorage.getItem(NEXT_KEY);
    localStorage.removeItem(NEXT_KEY);
    setView(next === "checkout" ? "checkout" : "account");
  }
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(""); setAuthNotice(""); setAuthBusy(true);
    const { ok, data } = await api<{ error?: string; resetToken?: string }>("/api/auth/forgot", { method: "POST", body: JSON.stringify({ email: authEmail }) });
    setAuthBusy(false);
    if (!ok) { setAuthError(data.error ?? "Could not start reset"); return; }
    if (data.resetToken) { setResetToken(data.resetToken); setView("reset"); setAuthNotice("Enter a new password for this account."); }
    else setAuthNotice("If that email is registered, you can set a new password next.");
  }
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(""); setAuthBusy(true);
    const { ok, data } = await api<{ token?: string; error?: string }>("/api/auth/reset", { method: "POST", body: JSON.stringify({ token: resetToken, password: authPassword }) });
    setAuthBusy(false);
    if (!ok || !data.token) { setAuthError(data.error ?? "Reset failed"); return; }
    persistToken(data.token); setAuthPassword(""); setResetToken("");
    setView(localStorage.getItem(NEXT_KEY) === "checkout" ? "checkout" : "account");
    localStorage.removeItem(NEXT_KEY);
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
    const { ok, data } = await api<{ note?: Note }>("/api/notes", { method: "POST", token, body: JSON.stringify({ title: p.name, content: `Saved · ${p.category}` }) });
    if (ok && data.note) { setNotes((n) => [data.note!, ...n]); setView("account"); }
  }

  const productCard = (p: Product) => (
    <article key={p.id} className="card">
      <button type="button" className="wish-btn" onClick={() => toggleWish(p.id)}>{wish.includes(p.id) ? "♥" : "♡"}</button>
      <button type="button" className="card-hit" onClick={() => openProduct(p)}>
        <div className="card-visual">
          <img src={p.image} alt="" loading="lazy" decoding="async" width={640} height={230} />
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
            <div className="mega"><p className="eyebrow">Collections</p><div className="mega-grid">{CATEGORIES.filter((c) => c !== "All").map((c) => <button key={c} type="button" onClick={() => goShop(c)}>{c}</button>)}</div></div>
          </div>
          <button type="button" className={view === "blog" || view === "post" ? "active" : ""} onClick={() => { setView("blog"); setMenuOpen(false); }}>Journal</button>
          <button type="button" className={view === "about" ? "active" : ""} onClick={() => { setView("about"); setMenuOpen(false); }}>About</button>
          <button type="button" className={view === "contact" ? "active" : ""} onClick={() => { setView("contact"); setMenuOpen(false); }}>Contact</button>
        </nav>
        <div className="topbar-right">
          <select className="fx" value={fx} onChange={(e) => setFx(e.target.value as Currency)}>{Object.keys(FX).map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <button type="button" className="icon-btn" onClick={() => { setView("wishlist"); setMenuOpen(false); }}>Wish <em>{wish.length}</em></button>
          {user ? (
            <button type="button" className="icon-btn" onClick={() => { setView("account"); setMenuOpen(false); }}>Account</button>
          ) : (
            <>
              <button type="button" className="icon-btn" onClick={() => { setView("login"); setAuthError(""); setMenuOpen(false); }}>Sign in</button>
              <button type="button" className="icon-btn" onClick={() => { setView("register"); setAuthError(""); setMenuOpen(false); }}>Register</button>
            </>
          )}
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
        <div><p className="foot-brand">FEMME</p><p className="muted">Comfort, confidence and care.</p></div>
        <div><h3>Shop</h3>{CATEGORIES.filter((c) => c !== "All").map((c) => <button key={c} type="button" onClick={() => goShop(c)}>{c}</button>)}</div>
        <div><h3>House</h3><button type="button" onClick={() => setView("blog")}>Journal</button><button type="button" onClick={() => setView("wishlist")}>Wishlist</button><button type="button" onClick={() => setView("register")}>Register</button><button type="button" onClick={() => setView("login")}>Sign in</button></div>
        <div><h3>Store</h3><p className="muted">info@silkmoments.com</p></div>
      </div>
      <div className="copyright">© {new Date().getFullYear()} Femme · Silk Moments · {fx}</div>
    </footer>
  );
  function shell(body: React.ReactNode) { return <div className="store">{header}{body}{footer}</div>; }

  if (view === "login" || view === "register") {
    const isLogin = view === "login";
    return shell(<main className="page"><h1 className="page-title">{isLogin ? "Sign in" : "Register"}</h1>
      <p className="lede">{isLogin ? "Welcome back. New here? Tap Register." : "Create a free account. Password must be at least 8 characters."}</p>
      <div className="auth-tabs">
        <button type="button" className={isLogin ? "active" : ""} onClick={() => { setView("login"); setAuthError(""); }}>Sign in</button>
        <button type="button" className={!isLogin ? "active" : ""} onClick={() => { setView("register"); setAuthError(""); }}>Register</button>
      </div>
      <form className="contact-form" onSubmit={(e) => { e.preventDefault(); void handleAuth(isLogin ? "login" : "register"); }}>
        <label>Email<input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
        <label>Password<input type="password" required minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
        {authError && <p className="auth-error">{authError}</p>}
        <button type="submit" className="cta" disabled={authBusy}>{isLogin ? "Sign in" : "Create my account"}</button>
      </form>
      <div className="oauth-row"><a className="cta google" href="/api/auth/oauth/google?next=account" onClick={() => localStorage.setItem(NEXT_KEY, "account")}>Continue with Google</a></div>
      <p className="auth-links">
        {isLogin ? <button type="button" className="cta ghost" onClick={() => { setView("register"); setAuthError(""); }}>No account? Register</button> : <button type="button" className="text-link" onClick={() => { setView("login"); setAuthError(""); }}>Already registered? Sign in</button>}
        <button type="button" className="text-link" onClick={() => { setView("forgot"); setAuthError(""); setAuthNotice(""); }}>Forgot password</button>
      </p>
    </main>);
  }
  if (view === "forgot") {
    return shell(<main className="page"><h1 className="page-title">Reset password</h1>
      <p className="lede">Enter the email on your account. New shoppers can register instead.</p>
      <form className="contact-form" onSubmit={(e) => void handleForgot(e)}>
        <label>Email<input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
        {authError && <p className="auth-error">{authError}</p>}
        {authNotice && <p className="muted">{authNotice}</p>}
        <button type="submit" className="cta" disabled={authBusy}>{authBusy ? "Please wait…" : "Continue"}</button>
      </form>
      <p className="auth-links"><button type="button" className="text-link" onClick={() => setView("login")}>Back to sign in</button><button type="button" className="cta ghost" onClick={() => setView("register")}>Create account</button></p>
    </main>);
  }
  if (view === "reset") {
    return shell(<main className="page"><h1 className="page-title">Choose a new password</h1>
      <form className="contact-form" onSubmit={(e) => void handleReset(e)}>
        <label>Reset code<input required value={resetToken} onChange={(e) => setResetToken(e.target.value)} /></label>
        <label>New password<input type="password" required minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
        {authError && <p className="auth-error">{authError}</p>}
        {authNotice && <p className="muted">{authNotice}</p>}
        <button type="submit" className="cta" disabled={authBusy}>{authBusy ? "Saving…" : "Update password"}</button>
      </form>
    </main>);
  }
  if (view === "account") {
    return shell(<main className="page"><h1 className="page-title">{user ? user.email : "Account"}</h1>
      {!user ? <button type="button" className="text-link" onClick={() => setView("login")}>Sign in</button> : (
        <><div className="account-actions"><button type="button" className="cta ghost" onClick={() => void handleLogout()}>Sign out</button></div>
        <form className="contact-form" onSubmit={(e) => void saveNote(e)}><label>Title<input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required /></label><label>Note<textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={3} /></label><button type="submit" className="cta">Save</button></form>
        <ul className="notes-list">{notes.map((n) => <li key={n.id}><div><strong>{n.title}</strong><p className="muted">{n.content}</p></div><button type="button" className="text-link" onClick={() => void deleteNote(n.id)}>Remove</button></li>)}</ul></>
      )}</main>);
  }
  if (view === "product" && selected) {
    return shell(<main className="page"><button type="button" className="back" onClick={() => goShop(selected.category as (typeof CATEGORIES)[number])}>Back</button>
      <div className="detail-grid"><div className="detail-hero" style={{ backgroundImage: `url(${selected.image})` }} /><div className="detail-copy">
        <h1>{selected.name}</h1><p className="price">{money(selected.price)}</p><p className="desc">{selected.description}</p>
        <div className="detail-actions"><button type="button" className="cta" onClick={() => addToCart(selected)}>Add to bag</button>
        <button type="button" className="cta ghost" onClick={() => toggleWish(selected.id)}>Wishlist</button>
        <button type="button" className="cta ghost" onClick={() => void saveProductNote(selected)}>Save</button></div></div></div></main>);
  }
  if (view === "cart") {
    return shell(<main className="page"><h1 className="page-title">Your bag</h1>
      {cart.length === 0 ? <button type="button" className="text-link" onClick={() => goShop()}>Shop</button> : (
        <div className="cart-layout"><ul className="cart-list">{cart.map((l) => <li key={l.product.id}><div className="cart-swatch" style={{ backgroundImage: `url(${l.product.image})` }} /><div><strong>{l.product.name}</strong></div>
          <div className="qty"><button type="button" onClick={() => setQty(l.product.id, l.qty - 1)}>-</button><span>{l.qty}</span><button type="button" onClick={() => setQty(l.product.id, l.qty + 1)}>+</button></div><strong>{money(l.product.price * l.qty)}</strong></li>)}</ul>
          <aside className="cart-sum"><p>Subtotal <strong>{money(cartTotal)}</strong></p><button type="button" className="cta" onClick={() => { localStorage.setItem(NEXT_KEY, "checkout"); setPlaced(false); setView("checkout"); }}>Checkout</button></aside></div>
      )}</main>);
  }
  if (view === "checkout") {
    return shell(
      <main className="page checkout-page">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="page-title">Checkout</h1>
        {placed ? (
          <p className="lede">Order received for {user?.email}. We will confirm by email. Cash on delivery available.</p>
        ) : (
          <div className="checkout-grid">
            <div>
              {!user ? (
                <section className="checkout-auth">
                  <h2>Sign in to continue</h2>
                  <p className="muted">Use Google or your email. Your bag stays on this device.</p>
                  <a className="cta google" href="/api/auth/oauth/google?next=checkout" onClick={() => localStorage.setItem(NEXT_KEY, "checkout")}>Continue with Google</a>
                  <p className="divider">or email</p>
                  <div className="auth-tabs">
                    <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Email login</button>
                    <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Create account</button>
                  </div>
                  <form className="contact-form" onSubmit={(e) => { e.preventDefault(); localStorage.setItem(NEXT_KEY, "checkout"); void handleAuth(authMode); }}>
                    <label>Email<input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
                    <label>Password<input type="password" required minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
                    {authError && <p className="auth-error">{authError}</p>}
                    <button type="submit" className="cta" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Sign in & continue" : "Create account & continue"}</button>
                  </form>
                  <p className="auth-links"><button type="button" className="text-link" onClick={() => { localStorage.setItem(NEXT_KEY, "checkout"); setView("forgot"); }}>Forgot password</button></p>
                </section>
              ) : (
                <section>
                  <p className="muted">Signed in as <strong>{user.email}</strong></p>
                  <form className="contact-form" onSubmit={(e) => { e.preventDefault(); if (!user || !token || cart.length === 0) return; setAuthBusy(true); const lines = cart.map((l) => `${l.qty} x ${l.product.name}`).join(", "); void api("/api/notes", { method: "POST", token, body: JSON.stringify({ title: `Order ${money(cartTotal)}`, content: `${shipName} · ${shipAddr} · ${lines}` }) }).then(() => { setCart([]); setPlaced(true); setAuthBusy(false); }); }}>
                    <label>Full name<input required value={shipName} onChange={(e) => setShipName(e.target.value)} /></label>
                    <label>Delivery address<textarea required rows={3} value={shipAddr} onChange={(e) => setShipAddr(e.target.value)} /></label>
                    <p className="muted">Payment: cash on delivery. No card required.</p>
                    <button type="submit" className="cta" disabled={authBusy || cart.length === 0}>Place order · {money(cartTotal)}</button>
                  </form>
                </section>
              )}
            </div>
            <aside className="cart-sum">
              <p className="eyebrow">Bag</p>
              {cart.length === 0 ? <p className="muted">Bag is empty.</p> : cart.map((l) => <p key={l.product.id}>{l.qty} × {l.product.name} <strong>{money(l.product.price * l.qty)}</strong></p>)}
              <p>Subtotal <strong>{money(cartTotal)}</strong></p>
              <button type="button" className="text-link" onClick={() => setView("cart")}>Edit bag</button>
            </aside>
          </div>
        )}
      </main>
    );
  }
  if (view === "wishlist") return shell(<main className="page"><h1 className="page-title">Wishlist</h1>{wished.length ? <div className="grid">{wished.map(productCard)}</div> : <p className="muted">Tap a heart.</p>}</main>);
  if (view === "blog") return shell(<main className="page"><h1 className="page-title">Journal</h1><div className="blog-grid">{POSTS.map((p) => <article key={p.id} className="blog-card"><button type="button" className="card-hit" onClick={() => openPost(p)}><p className="card-cat">{p.date}</p><h3>{p.title}</h3></button></article>)}</div></main>);
  if (view === "post" && post) return shell(<main className="page"><button type="button" className="back" onClick={() => setView("blog")}>Journal</button><h1 className="page-title">{post.title}</h1><p className="lede">{post.body}</p></main>);
  if (view === "about") return shell(<main className="page"><h1 className="page-title">Femme — comfort, confidence & care</h1><p className="lede">Built for women, by women. Unapologetically Femme.</p></main>);
  if (view === "contact") return shell(<main className="page"><h1 className="page-title">Contact</h1><form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}><label>Name<input required /></label><label>Email<input type="email" required /></label><label>Message<textarea required rows={4} /></label><button type="submit" className="cta">{sent ? "Sent" : "Send"}</button></form></main>);
  if (view === "shop") return shell(<main className="page"><h1 className="page-title">{category === "All" ? "The collection" : category}</h1><div className="nav-cats">{CATEGORIES.map((c) => <button key={c} type="button" className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="grid">{filtered.map(productCard)}</div></main>);

  return shell(
    <>
      <section className="hero">
        {SLIDES.map((s, i) => <img key={s.title} className={hero === i ? "hero-photo on" : "hero-photo"} src={s.image} alt="" fetchPriority={i === 0 ? "high" : "low"} decoding="async" />)}
        <div className="hero-slide">
          <p className="eyebrow light">{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <p className="lede light">{slide.lede}</p>
          <button type="button" className="cta" onClick={() => goShop(slide.cat)}>Shop now</button>
          <div className="hero-dots">{SLIDES.map((_, i) => <button key={i} type="button" className={hero === i ? "on" : ""} onClick={() => setHero(i)} />)}</div>
        </div>
      </section>
      <section className="page"><div className="catalog-head"><h2>Shop by collection</h2></div>
        <div className="collections">{COLLECTIONS.map((c) => <button key={c.name} type="button" className="col-card" style={{ backgroundImage: `${c.accent}, url(${c.image})` }} onClick={() => goShop(c.name as (typeof CATEGORIES)[number])}><span>{c.name}</span></button>)}</div></section>
      <section className="page split-banner"><p className="eyebrow">New collection</p><h2>Support that moves with you</h2><button type="button" className="cta" onClick={() => goShop("Bras")}>Shop now</button></section>
      <section className="page"><div className="catalog-head"><h2>Shop best collection</h2></div><div className="grid">{PRODUCTS.slice(0, 8).map(productCard)}</div></section>
      <section className="page"><div className="catalog-head"><h2>Lookbook</h2></div>
        <div className="lookbook">{LOOKBOOK.map((l) => (
          <button key={l.name} type="button" className="look-card" onClick={() => goShop(l.name as (typeof CATEGORIES)[number])}>
            <video src={l.video} muted loop playsInline autoPlay preload="metadata" />
            <span className="card-cat">{l.name}</span><strong>Start {money(l.price)}</strong>
          </button>
        ))}</div></section>
      <section className="page"><div className="catalog-head"><h2>From the blog</h2></div>
        <div className="blog-grid">{POSTS.slice(0, 3).map((p) => <article key={p.id} className="blog-card"><button type="button" className="card-hit" onClick={() => openPost(p)}><p className="card-cat">{p.date}</p><h3>{p.title}</h3></button></article>)}</div></section>
      <section className="page"><div className="catalog-head"><h2>What our clients say</h2></div>
        <div className="quote-grid">{QUOTES.map((q) => <blockquote key={q.who} className="quote"><p>{q.title}</p><cite>{q.who}</cite></blockquote>)}</div></section>
      <section className="page"><div className="service-row">{SERVICES.map((s) => <article key={s.title} className="service"><h3>{s.title}</h3><p className="muted">{s.text}</p></article>)}</div></section>
    </>
  );
}

export default App;
