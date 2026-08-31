import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode, type SyntheticEvent } from "react";
import "./App.css";
import { AISLES, CAMPAIGNS, HERO, MARQUEE, TRUST, STORY, ANNOUNCEMENT, SPLIT } from "./data/banners";
import { CATEGORIES, PRODUCTS, defaultSize, sizesFor, type Product } from "./data/catalog";
import { FOOTER_AISLES, ROOMS, type Room } from "./data/footer";
import { ShopView } from "./pages/ShopView";
import { SizesView } from "./pages/SizesView";
import { AtelierView } from "./pages/AtelierView";
import { SearchView } from "./pages/SearchView";
import { SearchModal } from "./pages/SearchModal";
import { searchHouse } from "./data/search";
import type { PageHit } from "./data/search";
import { applyDocumentSeo } from "./data/seo";

type View = "home" | "shop" | "product" | "cart" | "checkout" | "login" | "register" | "account" | "admin" | "about" | "contact" | "sizes" | "search";
type User = { id: number; email: string; role?: string };

function coverFallback(e: SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.dataset.fallback === "1") return;
  el.dataset.fallback = "1";
  el.src = "/banners/hero.jpg";
}
type CartLine = { product: Product; qty: number; size: string };
type OrderItem = { product_id: string; name: string; qty: number; unit_cents: number };
type OrderEmail = { id: number; kind: string; to_email: string; subject: string; body: string; status: string };
type StoreOrder = {
  id: number; order_no: string; email: string; ship_name: string; ship_addr: string;
  subtotal_cents: number; shipping_cents: number; pack_cents?: number; tax_cents?: number;
  other_cents?: number; tax_label?: string; ship_country?: string; total_cents: number;
  status: string; tracking: string | null; items: OrderItem[]; emails?: OrderEmail[];
};

const TOKEN_KEY = "femme_token";
const CART_KEY = "femme_cart";
const NEXT_KEY = "femme_next";
const COUNTRIES = ["United Arab Emirates", "United Kingdom", "Pakistan", "United States", "Other"] as const;

function money(n: number) { return `$${n.toFixed(2)}`; }
function moneyCents(c: number) { return money((c || 0) / 100); }
function taxFor(addr: string, country: string) {
  const blob = `${country} ${addr}`.toLowerCase();
  if (/(ae|uae|united arab|dubai|abu dhabi)/.test(blob)) return { rate: 0.05, label: "UAE VAT 5%" };
  if (/(gb|uk|united kingdom|england|scotland|wales)/.test(blob)) return { rate: 0.2, label: "UK VAT 20%" };
  if (/(germany|france|italy|spain|netherlands|ireland|belgium|austria|sweden)/.test(blob)) return { rate: 0.2, label: "EU VAT 20%" };
  return { rate: 0, label: "Duties & taxes (not charged)" };
}
function quoteCart(subtotal: number, qty: number, addr: string, country: string) {
  const pack = qty <= 0 ? 0 : 2.95 + Math.max(0, qty - 1) * 0.85;
  const ship = subtotal >= 100 ? 0 : 8;
  const taxInfo = taxFor(addr, country);
  const tax = Math.round(subtotal * taxInfo.rate * 100) / 100;
  const other = qty <= 0 ? 0 : 1.5;
  return { pack, ship, tax, taxLabel: taxInfo.label, other, total: subtotal + pack + ship + tax + other };
}

async function api<T>(path: string, opts: RequestInit & { token?: string | null } = {}) {
  const headers = new Headers(opts.headers);
  if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`);
  const res = await fetch(path, { ...opts, headers });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, data };
}

function printSheet(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) { window.alert("Allow pop-ups for this site to print the receipt."); return; }
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body{font-family:Georgia,serif;color:#1a0e08;padding:24px;max-width:640px;margin:0 auto}
      h1{font-size:22px;letter-spacing:.18em;margin:0}
      .muted{color:#5a4638;font-size:13px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      td,th{border-bottom:1px solid #ddd;padding:8px 0;text-align:left}
      td.r,th.r{text-align:right}
      .total td{font-weight:700;border-top:2px solid #1a0e08}
    </style></head><body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}


function pathFor(view: View, opts?: { cat?: string; product?: Product | null; q?: string; room?: Room | "" }): string {
  if (view === "home") return "/";
  if (view === "search") {
    const q = opts?.q?.trim();
    return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
  }
  if (view === "shop") {
    if (opts?.room) return `/shop?room=${encodeURIComponent(opts.room)}`;
    const cat = opts?.cat;
    return cat && cat !== "All" ? `/shop?cat=${encodeURIComponent(cat)}` : "/shop";
  }
  if (view === "product") return opts?.product ? `/shop/${opts.product.id}` : "/shop";
  if (view === "sizes") return "/size-guide";
  if (view === "about") return "/atelier";
  if (view === "contact") return "/contact";
  if (view === "cart") return "/cart";
  if (view === "checkout") return "/checkout";
  if (view === "login") return "/login";
  if (view === "register") return "/register";
  if (view === "account") return "/account";
  if (view === "admin") return "/admin";
  return "/";
}

function parseLocation(): { view: View; cat: (typeof CATEGORIES)[number]; product: Product | null; q: string; room: Room | "" } {
  const url = new URL(window.location.href);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const catParam = url.searchParams.get("cat");
  const q = url.searchParams.get("q") || "";
  const roomParam = url.searchParams.get("room");
  const room: Room | "" = roomParam && roomParam in ROOMS ? (roomParam as Room) : "";
  const cat = CATEGORIES.includes(catParam as (typeof CATEGORIES)[number])
    ? (catParam as (typeof CATEGORIES)[number])
    : "All";
  if (path === "/search") return { view: "search", cat, product: null, q, room: "" };
  if (path === "/shop") return { view: "shop", cat, product: null, q, room };
  if (path.startsWith("/shop/")) {
    const id = decodeURIComponent(path.slice("/shop/".length));
    const product = PRODUCTS.find((p) => p.id === id) ?? null;
    return product
      ? { view: "product", cat: product.category, product, q, room: "" }
      : { view: "shop", cat, product: null, q, room: "" };
  }
  const map: Record<string, View> = {
    "/size-guide": "sizes",
    "/sizes": "sizes",
    "/atelier": "about",
    "/about": "about",
    "/contact": "contact",
    "/cart": "cart",
    "/checkout": "checkout",
    "/login": "login",
    "/register": "register",
    "/account": "account",
    "/admin": "admin",
  };
  return { view: map[path] ?? "home", cat, product: null, q, room: "" };
}

function App() {
  const boot = parseLocation();
  const [view, setViewRaw] = useState<View>(boot.view);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(boot.cat);
  const [pickSize, setPickSize] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Product | null>(boot.product);
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as Array<{ id: string; qty: number; size?: string }>;
      return raw.map((l) => {
        const product = PRODUCTS.find((p) => p.id === l.id);
        return product && l.qty > 0 ? { product, qty: l.qty, size: l.size || defaultSize(product) } : null;
      }).filter((l): l is CartLine => Boolean(l));
    } catch { return []; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [shipName, setShipName] = useState("");
  const [shipAddr, setShipAddr] = useState("");
  const [shipCountry, setShipCountry] = useState<(typeof COUNTRIES)[number]>("United Arab Emirates");
  const [placed, setPlaced] = useState<StoreOrder | null>(null);
  const [myOrders, setMyOrders] = useState<StoreOrder[]>([]);
  const [adminOrders, setAdminOrders] = useState<StoreOrder[]>([]);
  const [adminFilter, setAdminFilter] = useState<"all" | "received" | "confirmed" | "dispatched">("all");
  const [adminNotice, setAdminNotice] = useState("");
  const [openEmail, setOpenEmail] = useState<OrderEmail | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(boot.q);
  const [room, setRoom] = useState<Room | "">(boot.room);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cart.reduce((n, l) => n + l.product.price * l.qty, 0);
  const q = quoteCart(cartTotal, cartCount, shipAddr, shipCountry);
  const isAdmin = user?.role === "admin";
  const filtered = useMemo(() => {
    if (category !== "All") return PRODUCTS.filter((p) => p.category === category);
    if (room) return PRODUCTS.filter((p) => (ROOMS[room] as readonly string[]).includes(p.category));
    return PRODUCTS;
  }, [category, room]);

  useEffect(() => {
    applyDocumentSeo({ view, product: selected, category, room });
  }, [view, selected, category, room]);

  const refreshMe = useCallback(async (t: string | null) => {
    if (!t) { setUser(null); return; }
    const { ok, data } = await api<{ user?: User }>("/api/auth/me", { token: t });
    if (!ok || !data.user) { localStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null); return; }
    setUser(data.user);
    const ordersRes = await api<{ orders?: StoreOrder[] }>("/api/orders", { token: t });
    if (ordersRes.ok) setMyOrders(ordersRes.data.orders ?? []);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromOAuth = params.get("auth_token");
    const next = params.get("next") || localStorage.getItem(NEXT_KEY);
    if (fromOAuth) {
      localStorage.setItem(TOKEN_KEY, fromOAuth);
      setToken(fromOAuth);
      if (next === "checkout" || next === "account" || next === "cart") setView(next as View);
      localStorage.removeItem(NEXT_KEY);
      window.history.replaceState({}, "", "/");
    }
  }, []);
  useEffect(() => { void refreshMe(token); }, [token, refreshMe]);
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart.map((l) => ({ id: l.product.id, qty: l.qty, size: l.size })))); }, [cart]);

  useEffect(() => {
    const onPop = () => {
      const loc = parseLocation();
      setViewRaw(loc.view);
      setCategory(loc.cat);
      setSelected(loc.product);
      setSearchQuery(loc.q);
      setRoom(loc.room);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function persistToken(t: string | null) {
    if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
    setToken(t);
  }

  function go(next: View, extra?: { cat?: (typeof CATEGORIES)[number]; product?: Product | null; q?: string; room?: Room | "" }) {
    if (extra?.cat) setCategory(extra.cat);
    if (extra && "product" in extra) setSelected(extra.product ?? null);
    if (extra && "q" in extra && extra.q != null) setSearchQuery(extra.q);
    if (extra && "room" in extra) setRoom(extra.room ?? "");
    else if (next !== "shop") setRoom("");
    setViewRaw(next);
    setMenuOpen(false);
    setSearchOpen(false);
    const url = pathFor(next, {
      cat: extra?.cat ?? category,
      product: extra && "product" in extra ? extra.product : next === "product" ? selected : null,
      q: extra?.q ?? (next === "search" ? searchQuery : undefined),
      room: extra && "room" in extra ? extra.room : next === "shop" ? room : "",
    });
    const now = `${window.location.pathname}${window.location.search}`;
    if (now !== url) window.history.pushState({ view: next }, "", url);
  }
  const setView = (next: View) => go(next);

  function goShop(cat: (typeof CATEGORIES)[number] = "All") { go("shop", { cat, product: null, room: "" }); }
  function goRoom(next: Room) { setCategory("All"); go("shop", { cat: "All", product: null, room: next }); }
  function sizeOf(p: Product) { return pickSize[p.id] || defaultSize(p); }
  function addToCart(p: Product, size = sizeOf(p)) {
    setCart((prev) => {
      const hit = prev.find((l) => l.product.id === p.id && l.size === size);
      if (hit) return prev.map((l) => (l.product.id === p.id && l.size === size ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product: p, qty: 1, size }];
    });
  }
  function setQty(id: string, size: string, qty: number) {
    setCart((prev) => qty <= 0 ? prev.filter((l) => !(l.product.id === id && l.size === size)) : prev.map((l) => (l.product.id === id && l.size === size ? { ...l, qty } : l)));
  }
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
  async function handleLogout() {
    if (token) await api("/api/auth/logout", { method: "POST", token });
    persistToken(null); setView("home");
  }
  async function loadAdminOrders(filter = adminFilter) {
    if (!token) return;
    const qs = filter === "all" ? "" : `?status=${filter}`;
    const { ok, data } = await api<{ orders?: StoreOrder[]; error?: string }>(`/api/admin/orders${qs}`, { token });
    if (ok) setAdminOrders(data.orders ?? []);
    else setAdminNotice(data.error ?? "Admin access needed");
  }
  async function confirmCheckout(e: FormEvent) {
    e.preventDefault();
    if (!user || !token || cart.length === 0) return;
    setAuthBusy(true); setAuthError("");
    const { ok, data } = await api<{ order?: StoreOrder; error?: string }>("/api/orders", {
      method: "POST", token,
      body: JSON.stringify({ shipName, shipAddr, shipCountry, items: cart.map((l) => ({ id: l.product.id, qty: l.qty })) }),
    });
    setAuthBusy(false);
    if (!ok || !data.order) { setAuthError(data.error ?? "Could not place order"); return; }
    setPlaced(data.order); setMyOrders((prev) => [data.order!, ...prev]); setCart([]);
  }
  async function adminConfirm(id: number) {
    if (!token) return;
    const { ok, data } = await api<{ order?: StoreOrder; error?: string }>(`/api/admin/orders/${id}/confirm`, { method: "POST", token });
    if (!ok) { setAdminNotice(data.error ?? "Confirm failed"); return; }
    setAdminNotice(`Confirmed ${data.order?.order_no}`); await loadAdminOrders();
  }
  async function adminDispatch(id: number) {
    if (!token) return;
    const { ok, data } = await api<{ order?: StoreOrder; dispatchEmail?: OrderEmail; error?: string }>(`/api/admin/orders/${id}/dispatch`, { method: "POST", token, body: "{}" });
    if (!ok) { setAdminNotice(data.error ?? "Dispatch failed"); return; }
    setAdminNotice(`Dispatch email written for ${data.order?.order_no}`);
    if (data.dispatchEmail) setOpenEmail(data.dispatchEmail);
    await loadAdminOrders();
  }

  function totalsBlock(o?: StoreOrder) {
    const product = o ? moneyCents(o.subtotal_cents) : money(cartTotal);
    const pack = o ? moneyCents(o.pack_cents || 0) : money(q.pack);
    const ship = o ? (o.shipping_cents === 0 ? "Free" : moneyCents(o.shipping_cents)) : (q.ship === 0 ? "Free" : money(q.ship));
    const taxL = o?.tax_label || q.taxLabel;
    const tax = o ? moneyCents(o.tax_cents || 0) : money(q.tax);
    const other = o ? moneyCents(o.other_cents || 0) : money(q.other);
    const total = o ? moneyCents(o.total_cents) : money(q.total);
    return (
      <ul className="receipt-lines totals">
        <li><span>Product cost</span><strong>{product}</strong></li>
        <li><span>Packaging (box $2.95 + $0.85/extra piece)</span><strong>{pack}</strong></li>
        <li><span>Shipping {(!o && q.ship === 0) || o?.shipping_cents === 0 ? "(free over $100)" : ""}</span><strong>{ship}</strong></li>
        <li><span>{taxL}</span><strong>{tax}</strong></li>
        <li><span>Other charges (COD handling)</span><strong>{other}</strong></li>
        <li className="grand"><span>Total due</span><strong>{total}</strong></li>
      </ul>
    );
  }

  function printOrder(o?: StoreOrder) {
    const items = o
      ? o.items.map((i) => `<tr><td>${i.qty} × ${i.name}</td><td class="r">${moneyCents(i.unit_cents * i.qty)}</td></tr>`).join("")
      : cart.map((l) => `<tr><td>${l.qty} × ${l.product.name}</td><td class="r">${money(l.product.price * l.qty)}</td></tr>`).join("");
    const name = o?.ship_name || shipName || "—";
    const addr = o?.ship_addr || shipAddr || "—";
    const country = o?.ship_country || shipCountry;
    const no = o?.order_no || "PREVIEW";
    const product = o ? o.subtotal_cents : Math.round(cartTotal * 100);
    const pack = o ? (o.pack_cents || 0) : Math.round(q.pack * 100);
    const ship = o ? o.shipping_cents : Math.round(q.ship * 100);
    const tax = o ? (o.tax_cents || 0) : Math.round(q.tax * 100);
    const other = o ? (o.other_cents || 0) : Math.round(q.other * 100);
    const total = o ? o.total_cents : Math.round(q.total * 100);
    const taxL = o?.tax_label || q.taxLabel;
    printSheet(`Receipt ${no}`, `
      <h1>FEMME</h1><p class="muted">Silk Atelier · info@silkmoments.com</p>
      <p><strong>Receipt ${no}</strong>${o ? ` · ${o.status}` : " · preview"}</p>
      <p>${name}<br/>${addr.replace(/\n/g, "<br/>")}<br/>${country}</p>
      <table><thead><tr><th>Item</th><th class="r">Amount</th></tr></thead><tbody>${items}</tbody></table>
      <table>
        <tr><td>Product cost</td><td class="r">${moneyCents(product)}</td></tr>
        <tr><td>Packaging</td><td class="r">${moneyCents(pack)}</td></tr>
        <tr><td>Shipping</td><td class="r">${ship === 0 ? "Free" : moneyCents(ship)}</td></tr>
        <tr><td>${taxL}</td><td class="r">${moneyCents(tax)}</td></tr>
        <tr><td>Other charges (COD)</td><td class="r">${moneyCents(other)}</td></tr>
        <tr class="total"><td>Total due</td><td class="r">${moneyCents(total)}</td></tr>
      </table>
      <p class="muted">Payment: cash on delivery. Packaging = $2.95 gift box + $0.85 per extra piece. Shipping free on product totals of $100+.</p>
    `);
  }

  const receiptLines = (items: OrderItem[]) => items.map((i) => (
    <li key={i.product_id}><span>{i.qty} × {i.name}</span><strong>{moneyCents(i.unit_cents * i.qty)}</strong></li>
  ));

  function goPage(href: PageHit["href"]) {
    if (href === "/size-guide") go("sizes");
    else if (href === "/atelier") go("about");
    else go("contact");
  }

  const header = (
    <>
    <div className="announcement-bar" role="region" aria-label="Announcement">{ANNOUNCEMENT}</div>
    <header className="topbar">
      <button type="button" className="brand" onClick={() => setView("home")}>FEMME<small>Silk Atelier</small></button>
      <nav className={`nav ${menuOpen ? "open" : ""}`}>
        <button type="button" className={view === "shop" && !room && category === "All" ? "active" : ""} onClick={() => goShop()}>Shop</button>
        <button type="button" className={room === "Sleep" ? "active" : ""} onClick={() => goRoom("Sleep")}>Sleep</button>
        <button type="button" className={room === "Lingerie" ? "active" : ""} onClick={() => goRoom("Lingerie")}>Lingerie</button>
        <button type="button" className={room === "Lounge" ? "active" : ""} onClick={() => goRoom("Lounge")}>Lounge</button>
        <button type="button" className={view === "about" ? "active" : ""} onClick={() => go("about")}>The Atelier</button>
        <button type="button" className={view === "sizes" ? "active" : ""} onClick={() => { setView("sizes"); setMenuOpen(false); }}>Size Guide</button>
        <button type="button" className={view === "contact" ? "active" : ""} onClick={() => setView("contact")}>Contact</button>
      </nav>
      <div className="topbar-right">
        <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search the atelier">Search</button>
        {isAdmin && <button type="button" className="icon-btn" onClick={() => { setView("admin"); void loadAdminOrders(); }}>Orders</button>}
        {user ? <button type="button" className="icon-btn" onClick={() => setView("account")}>Account</button> : (
          <>
            <button type="button" className="icon-btn" onClick={() => setView("login")}>Sign in</button>
            <button type="button" className="icon-btn" onClick={() => setView("register")}>Register</button>
          </>
        )}
        <button type="button" className="icon-btn" onClick={() => setView("cart")}>Bag <em>{cartCount}</em></button>
        <button type="button" className="burger" onClick={() => setMenuOpen((o) => !o)}>Menu</button>
      </div>
    </header>
    <SearchModal
      open={searchOpen}
      initialQuery={searchQuery}
      onClose={() => setSearchOpen(false)}
      onProduct={(p) => go("product", { product: p })}
      onAisle={(c) => goShop(c)}
      onPage={goPage}
      onSubmit={(q) => go("search", { q })}
    />
    </>
  );
  const footer = (
    <footer className="foot atelier-foot">
      <div className="foot-grid">
        <div>
          <p className="foot-brand">FEMME</p>
          <p className="muted">Silk Atelier</p>
          <p className="lede">Exotic silk, cut for the body. Complimentary discreet packaging and cash on delivery worldwide.</p>
        </div>
        {FOOTER_AISLES.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            {g.cats.map((c) => <button key={c} type="button" onClick={() => goShop(c)}>{c}</button>)}
          </div>
        ))}
        <div>
          <h3>House</h3>
          <button type="button" onClick={() => setView("about")}>The atelier</button>
          <button type="button" onClick={() => setView("sizes")}>Size guide</button>
          <button type="button" onClick={() => setView("contact")}>Contact</button>
          <button type="button" onClick={() => setView("account")}>Orders</button>
          {isAdmin && <button type="button" onClick={() => { setView("admin"); void loadAdminOrders(); }}>Admin</button>}
          <p className="muted">info@silkmoments.com</p>
        </div>
      </div>
    </footer>
  );
  function shell(body: ReactNode) { return <div className="store">{header}{body}{footer}</div>; }

  if (view === "login" || view === "register") {
    const isLogin = view === "login";
    return shell(<main className="page"><h1 className="page-title">{isLogin ? "Sign in" : "Register"}</h1>
      <form className="contact-form" onSubmit={(e) => { e.preventDefault(); void handleAuth(isLogin ? "login" : "register"); }}>
        <label>Email<input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
        <label>Password<input type="password" required minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
        {authError && <p className="auth-error">{authError}</p>}
        <button type="submit" className="cta" disabled={authBusy}>{isLogin ? "Sign in" : "Create my account"}</button>
      </form>
      <p className="auth-links">
        <button type="button" className="text-link" onClick={() => setView(isLogin ? "register" : "login")}>{isLogin ? "Register" : "Sign in"}</button>
        <a className="cta google" href="/api/auth/oauth/google?next=account">Google</a>
      </p>
    </main>);
  }

  if (view === "account") {
    return shell(<main className="page"><h1 className="page-title">{user ? user.email : "Account"}</h1>
      {!user ? <button type="button" className="text-link" onClick={() => setView("login")}>Sign in</button> : (
        <>
          <div className="account-actions">
            {isAdmin && <button type="button" className="cta" onClick={() => { setView("admin"); void loadAdminOrders(); }}>Admin orders</button>}
            <button type="button" className="cta ghost" onClick={() => void handleLogout()}>Sign out</button>
          </div>
          <h2 className="section-title">My orders</h2>
          {myOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <ul className="order-list">{myOrders.map((o) => (
              <li key={o.id} className="order-card">
                <strong>{o.order_no}</strong> <span className={`status ${o.status}`}>{o.status}</span>
                <ul className="receipt-lines">{receiptLines(o.items)}</ul>
                {totalsBlock(o)}
                {o.tracking && <p className="muted">Tracking {o.tracking}</p>}
                <button type="button" className="cta ghost" onClick={() => printOrder(o)}>Print receipt</button>
              </li>
            ))}</ul>
          )}
        </>
      )}
    </main>);
  }

  if (view === "product" && selected) {
    return shell(<main className="page"><button type="button" className="back" onClick={() => goShop()}>Back</button>
      <div className="detail-grid"><div className="detail-hero" style={{ backgroundImage: `url(${selected.image})` }} />
        <div className="detail-copy"><h1>{selected.name}</h1><p className="price">{money(selected.price)}</p><p>{selected.description}</p>
          <label className="size-label">Size
            <select className="size-select" value={sizeOf(selected)} onChange={(e) => setPickSize((s) => ({ ...s, [selected.id]: e.target.value }))}>
              {sizesFor(selected).map((sz) => <option key={sz} value={sz}>{sz}</option>)}
            </select>
          </label>
          <p className="muted size-guide-note">Complimentary size exchange · Cash on delivery worldwide · <button type="button" className="text-link" onClick={() => go("sizes")}>Size guide</button></p>
          <button type="button" className="cta" onClick={() => addToCart(selected)}>Add to bag</button>
          <div className="product-trust">
            <div className="trust-item"><span className="trust-icon" aria-hidden="true">📦</span><div><p className="trust-title">Discreet Atelier Presentation</p><p className="trust-desc">Signature noir & gold presentation box on all orders</p></div></div>
            <div className="trust-item"><span className="trust-icon" aria-hidden="true">💵</span><div><p className="trust-title">Cash on Delivery Worldwide</p><p className="trust-desc">Doorstep inspection with printable receipt</p></div></div>
            <div className="trust-item"><span className="trust-icon" aria-hidden="true">📐</span><div><p className="trust-title">14-Day Complimentary Exchange</p><p className="trust-desc">Free size exchange support across 30B–42C & XS–XXL</p></div></div>
          </div>
          <details className="pdp-tab">
            <summary>Atelier Silk Care & Materials</summary>
            <p>100% 19mm Mulberry Silk with French Leavers lace accents. Hand wash cold with delicate silk detergent or dry clean only. Dry flat in shade.</p>
          </details>
          <details className="pdp-tab">
            <summary>Shipping, Returns & Cash on Delivery</summary>
            <p>Complimentary discreet luxury packaging with all atelier orders. Cash on delivery worldwide with doorstep inspection. Free size exchanges within 14 days of delivery.</p>
          </details>
        </div></div></main>);
  }

  if (view === "cart") {
    return shell(<main className="page"><h1 className="page-title">Your bag</h1>
      {cart.length === 0 ? <button type="button" className="text-link" onClick={() => goShop()}>Shop</button> : (
        <div className="cart-layout">
          <ul className="cart-list">{cart.map((l) => <li key={`${l.product.id}-${l.size}`}><div className="cart-swatch" style={{ backgroundImage: `url(${l.product.image})` }} /><div><strong>{l.product.name}</strong><p className="muted">{l.size}</p></div>
            <div className="qty"><button type="button" onClick={() => setQty(l.product.id, l.size, l.qty - 1)}>-</button><span>{l.qty}</span><button type="button" onClick={() => setQty(l.product.id, l.size, l.qty + 1)}>+</button></div>
            <button type="button" className="text-link" onClick={() => setQty(l.product.id, l.size, 0)}>Remove</button></li>)}</ul>
          <aside className="cart-sum">
            {totalsBlock()}
            <button type="button" className="cta" onClick={() => { localStorage.setItem(NEXT_KEY, "checkout"); setPlaced(null); setView("checkout"); }}>Review receipt</button>
          </aside>
        </div>
      )}
    </main>);
  }

  if (view === "checkout") {
    return shell(<main className="page">
      <p className="eyebrow">Secure checkout</p>
      <h1 className="page-title">{placed ? "Order received" : "Review receipt"}</h1>
      {placed ? (
        <section className="receipt-sheet">
          <p className="lede">Thank you. Order <strong>{placed.order_no}</strong> is with the atelier.</p>
          <p className="muted">{placed.ship_name}<br />{placed.ship_addr}<br />{placed.ship_country}</p>
          <ul className="receipt-lines">{receiptLines(placed.items)}</ul>
          {totalsBlock(placed)}
          <span className={`status ${placed.status}`}>{placed.status}</span>
          <div className="account-actions">
            <button type="button" className="cta" onClick={() => printOrder(placed)}>Print receipt</button>
            <button type="button" className="cta ghost" onClick={() => goShop()}>Add more products</button>
            <button type="button" className="text-link" onClick={() => setView("account")}>My orders</button>
          </div>
        </section>
      ) : (
        <div className="checkout-grid">
          <div>
            {!user ? (
              <section className="checkout-auth">
                <h2>Sign in to continue</h2>
                <a className="cta google" href="/api/auth/oauth/google?next=checkout" onClick={() => localStorage.setItem(NEXT_KEY, "checkout")}>Continue with Google</a>
                <form className="contact-form" onSubmit={(e) => { e.preventDefault(); localStorage.setItem(NEXT_KEY, "checkout"); void handleAuth("login"); }}>
                  <label>Email<input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label>
                  <label>Password<input type="password" required minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label>
                  {authError && <p className="auth-error">{authError}</p>}
                  <button type="submit" className="cta">Sign in & continue</button>
                </form>
                <button type="button" className="text-link" onClick={() => setView("register")}>Create account</button>
              </section>
            ) : (
              <form className="contact-form" onSubmit={(e) => void confirmCheckout(e)}>
                <p className="muted">Signed in as <strong>{user.email}</strong></p>
                <label>Full name<input required value={shipName} onChange={(e) => setShipName(e.target.value)} /></label>
                <label>Country
                  <select value={shipCountry} onChange={(e) => setShipCountry(e.target.value as (typeof COUNTRIES)[number])}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label>Delivery address<textarea required rows={3} value={shipAddr} onChange={(e) => setShipAddr(e.target.value)} /></label>
                <p className="muted">Cash on delivery. Confirm only after the receipt looks right.</p>
                {authError && <p className="auth-error">{authError}</p>}
                <button type="submit" className="cta" disabled={authBusy || cart.length === 0}>{authBusy ? "Placing…" : `Confirm order · ${money(q.total)}`}</button>
              </form>
            )}
          </div>
          <aside className="cart-sum receipt-sheet">
            <p className="eyebrow">Receipt</p>
            {cart.length === 0 ? <p className="muted">Bag is empty.</p> : (
              <ul className="cart-list compact">{cart.map((l) => (
                <li key={`${l.product.id}-${l.size}`}>
                  <div className="cart-swatch" style={{ backgroundImage: `url(${l.product.image})` }} />
                  <div><strong>{l.product.name}</strong><p className="muted">{l.size}</p></div>
                  <div className="qty"><button type="button" onClick={() => setQty(l.product.id, l.size, l.qty - 1)}>-</button><span>{l.qty}</span><button type="button" onClick={() => setQty(l.product.id, l.size, l.qty + 1)}>+</button></div>
                  <button type="button" className="text-link" onClick={() => setQty(l.product.id, l.size, 0)}>Remove</button>
                </li>
              ))}</ul>
            )}
            {totalsBlock()}
            <div className="account-actions">
              <button type="button" className="cta ghost" onClick={() => printOrder()}>Print receipt</button>
              <button type="button" className="text-link" onClick={() => goShop()}>Add more products</button>
            </div>
          </aside>
        </div>
      )}
    </main>);
  }

  if (view === "admin") {
    return shell(<main className="page">
      <p className="eyebrow">Atelier desk</p>
      <h1 className="page-title">Orders received</h1>
      {!user ? <button type="button" className="text-link" onClick={() => setView("login")}>Sign in</button> : !isAdmin ? (
        <p className="lede">This desk is limited to the store owner.</p>
      ) : (
        <>
          <div className="nav-cats">{(["all", "received", "confirmed", "dispatched"] as const).map((f) => (
            <button key={f} type="button" className={adminFilter === f ? "active" : ""} onClick={() => { setAdminFilter(f); void loadAdminOrders(f); }}>{f}</button>
          ))}</div>
          {adminNotice && <p className="muted">{adminNotice}</p>}
          {openEmail && <aside className="email-preview"><p className="eyebrow">Shipment email</p><strong>{openEmail.subject}</strong><p className="muted">To {openEmail.to_email}</p><pre>{openEmail.body}</pre><button type="button" className="text-link" onClick={() => setOpenEmail(null)}>Close</button></aside>}
          <ul className="order-list">{adminOrders.map((o) => (
            <li key={o.id} className="order-card">
              <div className="order-head">
                <div><strong>{o.order_no}</strong> <span className={`status ${o.status}`}>{o.status}</span><p className="muted">{o.email} · {o.ship_name} · {moneyCents(o.total_cents)}</p><p className="muted">{o.ship_addr}</p></div>
                <div className="account-actions">
                  {o.status === "received" && <button type="button" className="cta" onClick={() => void adminConfirm(o.id)}>Confirm order</button>}
                  {o.status !== "dispatched" && <button type="button" className="cta ghost" onClick={() => void adminDispatch(o.id)}>Dispatch & email</button>}
                  <button type="button" className="text-link" onClick={() => printOrder(o)}>Print</button>
                </div>
              </div>
              <ul className="receipt-lines">{receiptLines(o.items)}</ul>
              {totalsBlock(o)}
              {o.tracking && <p className="muted">Tracking {o.tracking}</p>}
            </li>
          ))}</ul>
        </>
      )}
    </main>);
  }

  if (view === "about") return <div className="store">{header}<AtelierView onShop={(c) => goShop(c ?? "All")} onSizes={() => go("sizes")} />{footer}</div>;
  if (view === "contact") return shell(<main className="page"><h1 className="page-title">Contact</h1><p className="muted">info@silkmoments.com</p></main>);
  const searchHits = searchHouse(searchQuery, 48);
  const gridProducts = view === "search" ? searchHits.products : filtered;
  const productGrid = (
      <div className="grid shop-grid">{gridProducts.map((p) => (
        <article key={p.id} className="card product-tile">
          <button type="button" className="card-hit" onClick={() => { go("product", { product: p }); }}>
            <div className="card-visual">
              <img className="ken" src={p.image} alt="" onError={coverFallback} />
              {p.tag && <span className="tag on-dark">{p.tag}</span>}
            </div>
          </button>
          <div className="card-body">
            <p className="card-cat">{p.category}</p>
            <h3>{p.name}</h3>
            <p className="card-price">{money(p.price)}</p>
          </div>
          <div className="card-actions">
            <label className="size-label">Size
              <select className="size-select" value={sizeOf(p)} onChange={(e) => setPickSize((s) => ({ ...s, [p.id]: e.target.value }))}>
                {sizesFor(p).map((sz) => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </label>
            <button type="button" className="cta" onClick={() => addToCart(p)}>Add</button>
          </div>
        </article>
      ))}</div>
  );

  if (view === "sizes") {
    return <div className="store">{header}<SizesView />{footer}</div>;
  }

  if (view === "home") {
    const featured = PRODUCTS.filter((p) => p.tag).slice(0, 6);
    return <div className="store">{header}
      <section className="cine-hero">
        <img className="ken" src={HERO.poster} alt="" />
        <video className="motion-video" autoPlay muted loop playsInline poster={HERO.poster}><source src={HERO.video} type="video/mp4" /></video>
        <div className="hero-veil" />
        <div className="cine-copy">
          <p className="eyebrow">{HERO.kicker}</p>
          <h1>{HERO.title}</h1>
          <p className="lede">{HERO.body}</p>
          <div className="hero-ctas">
            <button type="button" className="cta" onClick={() => goShop()}>Shop the house</button>
            <button type="button" className="cta ghost" onClick={() => go("sizes")}>Fit studio & sizing</button>
          </div>
        </div>
      </section>
      <section className="page trust-wrap">
        <div className="trust-strip">
          {TRUST.map((t) => (
            <div key={t.title} className="trust-item">
              <span className="trust-icon" aria-hidden="true">{t.icon}</span>
              <div>
                <p className="trust-title">{t.title}</p>
                <p className="trust-desc">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="marquee" aria-hidden="true"><div className="marquee-track">{[...MARQUEE, ...MARQUEE].map((m, i) => <img key={i} src={m.src} alt="" />)}</div></div>
      <section className="campaign-home">
        {CAMPAIGNS.map((c) => (
          <button key={c.id} type="button" className="campaign-panel" onClick={() => goRoom(c.room)}>
            <img className="ken" src={c.poster} alt="" />
            {c.video && <video className="motion-video" autoPlay muted loop playsInline poster={c.poster}><source src={c.video} type="video/mp4" /></video>}
            <div className="hero-veil" />
            <span className="eyebrow">{c.kicker}</span>
            <strong>{c.title}</strong>
          </button>
        ))}
      </section>
      <section className="page">
        <div className="atelier-story-card">
          <div className="atelier-story-media">
            <img src={HERO.poster} alt="The Femme Atelier" />
            <div className="hero-veil" style={{ opacity: 0.35 }} />
          </div>
          <div className="atelier-story-content">
            <p className="eyebrow">{STORY.kicker}</p>
            <h2 className="page-title">{STORY.heading}</h2>
            <p className="lede">{STORY.body}</p>
            <div className="hero-ctas">
              <button type="button" className="cta" onClick={() => go("about")}>Discover The Atelier</button>
              <button type="button" className="cta ghost" onClick={() => go("sizes")}>Explore Fit Matrix</button>
            </div>
          </div>
        </div>
      </section>
      <main className="page">
        <p className="eyebrow">The House</p>
        <h2 className="page-title">Walk the house</h2>
        <div className="aisle-grid">
          {AISLES.map((a) => (
            <button key={a.cat} type="button" className="aisle" onClick={() => goRoom(a.room)}>
              <img src={a.image} alt="" />
              <div className="hero-veil" />
              <span><em>{a.cat}</em><b>{a.title}</b></span>
            </button>
          ))}
        </div>
        <div className="catalog-head">
          <div>
            <p className="eyebrow">The Collection</p>
            <h2 className="page-title">House Highlights</h2>
          </div>
          <button type="button" className="text-link" onClick={() => goShop()}>View all pieces</button>
        </div>
        <div className="grid highlights-grid">{featured.map((p) => (
          <article key={p.id} className="card product-tile">
            <button type="button" className="card-hit" onClick={() => { go("product", { product: p }); }}>
              <div className="card-visual"><img className="ken" src={p.image} alt="" onError={coverFallback} />{p.tag && <span className="tag on-dark">{p.tag}</span>}</div>
            </button>
            <div className="card-body"><p className="card-cat">{p.category}</p><h3>{p.name}</h3><p className="card-price">{money(p.price)}</p></div>
            <div className="card-actions">
              <label className="size-label">Size
                <select className="size-select" value={sizeOf(p)} onChange={(e) => setPickSize((s) => ({ ...s, [p.id]: e.target.value }))}>
                  {sizesFor(p).map((sz) => <option key={sz} value={sz}>{sz}</option>)}
                </select>
              </label>
              <button type="button" className="cta" onClick={() => addToCart(p)}>Add</button>
            </div>
          </article>
        ))}</div>
      </main>
      <section className="campaign-home">
        {SPLIT.map((p) => (
          <button key={p.title} type="button" className="campaign-panel" onClick={() => goRoom(p.room)}>
            <img className="ken" src={p.image} alt="" onError={coverFallback} />
            <div className="hero-veil" />
            <span className="eyebrow">{p.kicker}</span>
            <strong>{p.title}</strong>
          </button>
        ))}
      </section>
      {footer}
    </div>;
  }

  if (view === "search") {
    return <div className="store">{header}<SearchView query={searchQuery} onQuery={(q) => go("search", { q })} onAisle={goShop} onPage={goPage}>{productGrid}</SearchView>{footer}</div>;
  }
  if (view === "shop") {
    return <div className="store">{header}<ShopView category={category} room={room} count={filtered.length} productGrid={productGrid} onCat={goShop} onRoom={goRoom} onSizes={() => go("sizes")} />{footer}</div>;
  }
  return shell(<main className="page"><h1 className="page-title">Femme</h1></main>);
}

export default App;
