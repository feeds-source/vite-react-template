import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode, type SyntheticEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./App.css";
import { AISLES, CAMPAIGNS, HERO, MARQUEE, TRUST, STORY, ANNOUNCEMENT, SPLIT, EXCHANGE } from "./data/banners";
import { CATEGORIES, PRODUCTS, defaultSize, materialsFor, sizesFor, type Product } from "./data/catalog";
import { FOOTER_AISLES, ROOMS, type Room } from "./data/footer";
import { ShopView } from "./pages/ShopView";
import { FitView } from "./pages/FitView";
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

function Motion({ image, video, alt }: { image: string; video?: string; alt: string }) {
  return (
    <>
      <img className="ken" src={image} alt={alt} onError={coverFallback} />
      {video ? (
        <video className="motion-video" autoPlay muted loop playsInline poster={image}>
          <source src={video} type="video/mp4" />
        </video>
      ) : null}
    </>
  );
}
type CartLine = { product: Product; qty: number; size: string };
type OrderItem = { product_id: string; name: string; qty: number; unit_cents: number };
type OrderEmail = { id: number; kind: string; to_email: string; subject: string; body: string; status: string };
type StoreOrder = {
  id: number; order_no: string; email: string; ship_name: string; ship_addr: string;
  subtotal_cents: number; shipping_cents: number; pack_cents?: number; tax_cents?: number;
  other_cents?: number; tax_label?: string; ship_country?: string; pay_method?: string; total_cents: number;
  status: string; tracking: string | null; created_at?: string; confirmed_at?: string | null; dispatched_at?: string | null; items: OrderItem[]; emails?: OrderEmail[];
};

const TOKEN_KEY = "femme_token";
const CART_KEY = "femme_cart";
const NEXT_KEY = "femme_next";
const SID_KEY = "femme_sid";
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
function quoteCart(subtotal: number, qty: number, addr: string, country: string, pay: "card" | "cod") {
  const pack = qty <= 0 ? 0 : 2.95 + Math.max(0, qty - 1) * 0.85;
  const ship = subtotal >= 100 ? 0 : 8;
  const taxInfo = taxFor(addr, country);
  const tax = Math.round(subtotal * taxInfo.rate * 100) / 100;
  const other = qty <= 0 || pay === "card" ? 0 : 1.5;
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

function sessionId() {
  let id = sessionStorage.getItem(SID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SID_KEY, id);
  }
  return id;
}

function track(kind: "click" | "add_to_cart" | "checkout" | "order", label: string, productId = "") {
  const body = JSON.stringify({
    session: sessionId(),
    kind,
    path: `${window.location.pathname}${window.location.search}`,
    label: label.replace(/\s+/g, " ").trim().slice(0, 120),
    productId,
  });
  void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
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

function catHref(cat: string) {
  return cat && cat !== "All" ? `/shop?cat=${encodeURIComponent(cat)}` : "/shop";
}
function roomHref(room: string) {
  return `/shop?room=${encodeURIComponent(room)}`;
}
function follow(e: ReactMouseEvent<HTMLAnchorElement>, go: () => void) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  go();
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

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    const { ok, data } = await api<{ error?: string }>("/api/contact", {
      method: "POST",
      body: JSON.stringify({ name, email, orderNo, message }),
    });
    setBusy(false);
    if (!ok) { setNote(data.error ?? "Could not send"); return; }
    setMessage("");
    setNote("The atelier has your note.");
  }
  return (
    <main className="page">
      <h1 className="page-title">Contact</h1>
      <p className="lede">Write the atelier. Add an order number if you have one.</p>
      <form className="contact-form" onSubmit={(e) => void send(e)}>
        <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Order number<input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} /></label>
        <label>Note<textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <button type="submit" className="cta" disabled={busy}>{busy ? "Sending…" : "Send"}</button>
      </form>
      {note && <p className="muted">{note}</p>}
      <p className="muted">info@silkmoments.com</p>
    </main>
  );
}

function App() {
  const {
    isLoading,
    isAuthenticated,
    error: auth0Error,
    loginWithRedirect: login,
    logout: auth0Logout,
    getAccessTokenSilently,
    user: auth0User,
  } = useAuth0();
  const logoutAuth0 = () => auth0Logout({ logoutParams: { returnTo: window.location.origin } });
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
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [shipName, setShipName] = useState("");
  const [shipAddr, setShipAddr] = useState("");
  const [shipCountry, setShipCountry] = useState<(typeof COUNTRIES)[number]>("United Arab Emirates");
  const [payMethod, setPayMethod] = useState<"card" | "cod">("card");
  const [notes, setNotes] = useState<Array<{ id: number; created_at: string; name: string; email: string; order_no: string; body: string }>>([]);
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
  const [shopEvents, setShopEvents] = useState<Array<{ id: number; created_at: string; session_id: string; kind: string; path: string; label: string; product_id: string }>>([]);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cart.reduce((n, l) => n + l.product.price * l.qty, 0);
  const q = quoteCart(cartTotal, cartCount, shipAddr, shipCountry, payMethod);
  const isAdmin = user?.role === "admin";
  const filtered = useMemo(() => {
    if (category !== "All") return PRODUCTS.filter((p) => p.category === category);
    if (room) return PRODUCTS.filter((p) => (ROOMS[room] as readonly string[]).includes(p.category));
    return PRODUCTS;
  }, [category, room]);

  useEffect(() => {
    applyDocumentSeo({ view, product: selected, category, room });
  }, [view, selected, category, room]);

  useEffect(() => {
    const kick = () => {
      document.querySelectorAll<HTMLVideoElement>("video.motion-video").forEach((v) => {
        v.muted = true;
        if (v.paused) void v.play().catch(() => undefined);
      });
    };
    kick();
    const root = document.getElementById("root") ?? document.body;
    const obs = new MutationObserver(kick);
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
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
  useEffect(() => {
    if (isLoading || !isAuthenticated || token) return;
    let cancel = false;
    (async () => {
      try {
        const access = await getAccessTokenSilently();
        const res = await fetch("/api/auth/auth0/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${access}` },
        });
        const data = (await res.json()) as { token?: string; error?: string };
        if (cancel) return;
        if (!res.ok || !data.token) {
          setAuthError(data.error ?? "Could not open your atelier account");
          return;
        }
        persistToken(data.token);
      } catch (err) {
        if (!cancel) setAuthError(err instanceof Error ? err.message : "Could not open your atelier account");
      }
    })();
    return () => { cancel = true; };
  }, [isLoading, isAuthenticated, token, getAccessTokenSilently]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const next = localStorage.getItem(NEXT_KEY);
    if (next === "checkout" || next === "account" || next === "cart") {
      localStorage.removeItem(NEXT_KEY);
      setView(next as View);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (view === "account" && token) void refreshMe(token);
  }, [view, token, refreshMe]);
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart.map((l) => ({ id: l.product.id, qty: l.qty, size: l.size })))); }, [cart]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.closest("input, textarea, select, option")) return;
      const el = t.closest("button, a");
      if (!el) return;
      const label = el.getAttribute("aria-label") || el.textContent || "";
      if (!label.trim()) return;
      track("click", label);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (view === "checkout" && !placed) track("checkout", "Review receipt");
  }, [view, placed]);

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
    track("add_to_cart", `${p.name} · ${size}`, p.id);
    setCart((prev) => {
      const hit = prev.find((l) => l.product.id === p.id && l.size === size);
      if (hit) return prev.map((l) => (l.product.id === p.id && l.size === size ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product: p, qty: 1, size }];
    });
  }
  function setQty(id: string, size: string, qty: number) {
    setCart((prev) => qty <= 0 ? prev.filter((l) => !(l.product.id === id && l.size === size)) : prev.map((l) => (l.product.id === id && l.size === size ? { ...l, qty } : l)));
  }
  function signIn(next: "account" | "checkout" = "account", screen?: "signup") {
    localStorage.setItem(NEXT_KEY, next);
    const authorizationParams = screen === "signup" ? { screen_hint: "signup" } : undefined;
    void login({ authorizationParams, appState: { returnTo: next === "checkout" ? "/checkout" : "/account" } });
  }
  async function handleLogout() {
    if (token) await api("/api/auth/logout", { method: "POST", token });
    persistToken(null);
    if (isAuthenticated) {
      logoutAuth0();
      return;
    }
    setView("home");
  }
  async function loadAdminOrders(filter = adminFilter) {
    if (!token) return;
    const qs = filter === "all" ? "" : `?status=${filter}`;
    const { ok, data } = await api<{ orders?: StoreOrder[]; error?: string }>(`/api/admin/orders${qs}`, { token });
    if (ok) setAdminOrders(data.orders ?? []);
    else setAdminNotice(data.error ?? "Admin access needed");
    const ev = await api<{ events?: typeof shopEvents }>("/api/admin/events", { token });
    if (ev.ok) setShopEvents(ev.data.events ?? []);
    const notesRes = await api<{ messages?: typeof notes }>("/api/admin/messages", { token });
    if (notesRes.ok) setNotes(notesRes.data.messages ?? []);
  }
  async function confirmCheckout(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setAuthBusy(true); setAuthError("");
    let auth = token;
    if (!auth) {
      setAuthBusy(false);
      setAuthError("Sign in to place this order.");
      return;
    }
    const { ok, data } = await api<{ order?: StoreOrder; error?: string }>("/api/orders", {
      method: "POST", token: auth,
      body: JSON.stringify({ shipName, shipAddr, shipCountry, payMethod, items: cart.map((l) => ({ id: l.product.id, qty: l.qty })) }),
    });
    setAuthBusy(false);
    if (!ok || !data.order) { setAuthError(data.error ?? "Could not place order"); return; }
    setPlaced(data.order); setMyOrders((prev) => [data.order!, ...prev]); setCart([]);
    track("order", data.order.order_no);
    const placedUrl = "/checkout?placed=1";
    if (`${window.location.pathname}${window.location.search}` !== placedUrl) {
      window.history.pushState({ view: "checkout", placed: true }, "", placedUrl);
    }
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

  function orderTrack(o: StoreOrder) {
    const code = o.tracking || o.order_no;
    const rank = o.status === "dispatched" ? 2 : o.status === "confirmed" ? 1 : 0;
    const steps = [
      { title: "Order placed", detail: o.pay_method === "card" ? "The atelier has your order. A pay link follows." : "The atelier has your order. Pay when it arrives." },
      { title: "Confirmed", detail: rank >= 1 ? "Your order is being prepared." : "Waiting for the atelier to confirm." },
      { title: "Dispatched", detail: o.tracking ? `On the way. Tracking ${o.tracking}` : "Ships with this same tracking reference." },
    ];
    return (
      <div className="track-block">
        <p className="track-code">Tracking <strong>{code}</strong></p>
        <ol className="track" aria-label={`Tracking for ${o.order_no}`}>
          {steps.map((step, i) => (
            <li key={step.title} className={i < rank ? "done" : i === rank ? "now" : ""}>
              <span className="track-mark" aria-hidden="true" />
              <div>
                <strong>{step.title}</strong>
                <p className="muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
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
        <li><span>{(o?.pay_method ?? payMethod) === "card" ? "Card handling" : "Cash on delivery handling"}</span><strong>{other}</strong></li>
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
    const pay = o?.pay_method || payMethod;
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
        <tr><td>${pay === "card" ? "Card handling" : "Cash on delivery handling"}</td><td class="r">${moneyCents(other)}</td></tr>
        <tr class="total"><td>Total due</td><td class="r">${moneyCents(total)}</td></tr>
      </table>
      <p class="muted">${pay === "card" ? "Payment: card. A secure pay link is emailed when the atelier confirms. No card number is taken on this page." : "Payment: cash on delivery."} ${EXCHANGE}</p>
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
        <a href="/shop" className={view === "shop" && !room && category === "All" ? "active" : ""} onClick={(e) => follow(e, () => goShop())}>Shop</a>
        <a href={roomHref("Sleep")} className={room === "Sleep" ? "active" : ""} onClick={(e) => follow(e, () => goRoom("Sleep"))}>Sleep</a>
        <a href={roomHref("Lingerie")} className={room === "Lingerie" ? "active" : ""} onClick={(e) => follow(e, () => goRoom("Lingerie"))}>Lingerie</a>
        <a href={roomHref("Lounge")} className={room === "Lounge" ? "active" : ""} onClick={(e) => follow(e, () => goRoom("Lounge"))}>Lounge</a>
        <a href="/atelier" className={view === "about" ? "active" : ""} onClick={(e) => follow(e, () => go("about"))}>The Atelier</a>
        <a href="/size-guide" className={view === "sizes" ? "active" : ""} onClick={(e) => follow(e, () => { setView("sizes"); setMenuOpen(false); })}>Size Guide</a>
        <a href="/contact" className={view === "contact" ? "active" : ""} onClick={(e) => follow(e, () => setView("contact"))}>Contact</a>
      </nav>
      <div className="topbar-right">
        <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search the atelier">Search</button>
        {isAdmin && <button type="button" className="icon-btn" onClick={() => { setView("admin"); void loadAdminOrders(); }}>Orders</button>}
        {user || isAuthenticated ? <button type="button" className="icon-btn" onClick={() => setView("account")}>Account</button> : (
          <>
            <button type="button" className="icon-btn" onClick={() => signIn("account")} disabled={isLoading}>{isLoading ? "Loading..." : "Login"}</button>
            <button type="button" className="icon-btn" onClick={() => signIn("account", "signup")} disabled={isLoading}>Signup</button>
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
          <p className="lede">Exotic silk, cut for the body. Card or cash on delivery. {EXCHANGE}</p>
        </div>
        {FOOTER_AISLES.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            {g.cats.map((c) => <a key={c} href={catHref(c)} onClick={(e) => follow(e, () => goShop(c))}>{c}</a>)}
          </div>
        ))}
        <div>
          <h3>House</h3>
          <a href="/atelier" onClick={(e) => follow(e, () => setView("about"))}>The atelier</a>
          <a href="/size-guide" onClick={(e) => follow(e, () => setView("sizes"))}>Size guide</a>
          <a href="/contact" onClick={(e) => follow(e, () => setView("contact"))}>Contact</a>
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
      {isLoading ? <p>Loading...</p> : isAuthenticated ? (
        <>
          <p>Logged in as {auth0User?.email}</p>
          <h2 className="section-title">User Profile</h2>
          <pre>{JSON.stringify(auth0User, null, 2)}</pre>
          <button type="button" className="cta" onClick={() => void handleLogout()}>Logout</button>
        </>
      ) : (
        <>
          {auth0Error && <p className="auth-error">Error: {auth0Error.message}</p>}
          {authError && <p className="auth-error">{authError}</p>}
          <p className="muted">One account, through Auth0.</p>
          <p className="auth-links">
            <button type="button" className="cta" onClick={() => signIn("account")} disabled={isLoading}>Login</button>
            <button type="button" className="cta ghost" onClick={() => signIn("account", "signup")} disabled={isLoading}>Signup</button>
          </p>
        </>
      )}
    </main>);
  }

  if (view === "account") {
    return shell(<main className="page"><h1 className="page-title">{user?.email || auth0User?.email || "Account"}</h1>
      {isAuthenticated && auth0User && (
        <>
          <p>Logged in as {auth0User.email}</p>
          <h2 className="section-title">User Profile</h2>
          <pre>{JSON.stringify(auth0User, null, 2)}</pre>
        </>
      )}
      {!user && !isAuthenticated ? <button type="button" className="text-link" onClick={() => signIn("account")}>Login</button> : (
        <>
          <div className="account-actions">
            {isAdmin && <button type="button" className="cta" onClick={() => { setView("admin"); void loadAdminOrders(); }}>Admin orders</button>}
            <button type="button" className="cta ghost" onClick={() => void handleLogout()}>Sign out</button>
          </div>
          <h2 className="section-title">Track my orders</h2>
          {myOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <ul className="order-list">{myOrders.map((o) => (
              <li key={o.id} className="order-card">
                <div className="order-head">
                  <div><strong>{o.order_no}</strong> <span className={`status ${o.status}`}>{o.status}</span></div>
                  <button type="button" className="cta ghost" onClick={() => printOrder(o)}>Print receipt</button>
                </div>
                {orderTrack(o)}
                <ul className="receipt-lines">{receiptLines(o.items)}</ul>
                {totalsBlock(o)}
              </li>
            ))}</ul>
          )}
        </>
      )}
    </main>);
  }

  if (view === "product" && selected) {
    const cloth = materialsFor(selected);
    return shell(<main className="page"><button type="button" className="back" onClick={() => goShop()}>Back</button>
      <div className="detail-grid">
        <div>
          <div className="pdp-frame">
            <img className="ken" src={selected.image} alt={selected.name} />
            {selected.video ? (
              <video className="motion-video" autoPlay muted loop playsInline poster={selected.image}>
                <source src={selected.video} type="video/mp4" />
              </video>
            ) : null}
          </div>
          <FitView product={selected} size={sizeOf(selected)} sizes={sizesFor(selected)} onSize={(sz) => setPickSize((s) => ({ ...s, [selected.id]: sz }))} />
        </div>
        <div className="detail-copy"><h1>{selected.name}</h1><p className="price">{money(selected.price)}</p><p>{selected.description}</p>
          <label className="size-label">Size
            <select className="size-select" value={sizeOf(selected)} onChange={(e) => setPickSize((s) => ({ ...s, [selected.id]: e.target.value }))}>
              {sizesFor(selected).map((sz) => <option key={sz} value={sz}>{sz}</option>)}
            </select>
          </label>
          <p className="muted size-guide-note">{EXCHANGE} <button type="button" className="text-link" onClick={() => go("sizes")}>Size guide</button></p>
          <button type="button" className="cta" onClick={() => addToCart(selected)}>Add to bag</button>
          <details className="pdp-tab">
            <summary>Cloth and care</summary>
            <p>{cloth.cloth} {cloth.care}</p>
          </details>
          <details className="pdp-tab">
            <summary>Shipping and exchange</summary>
            <p>Discreet packaging. Pay by card, or cash when the parcel arrives. {EXCHANGE}</p>
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
            <p className="muted">{EXCHANGE}</p>
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
            <button type="button" className="cta" onClick={() => setView("account")}>Track my order</button>
            <button type="button" className="cta ghost" onClick={() => printOrder(placed)}>Print receipt</button>
            <button type="button" className="text-link" onClick={() => goShop()}>Add more products</button>
          </div>
        </section>
      ) : (
        <div className="checkout-grid">
          <div>
          <form className="contact-form" onSubmit={(e) => void confirmCheckout(e)}>
            {user ? <p className="muted">Signed in as <strong>{user.email}</strong></p> : null}
            <label>Full name<input required value={shipName} onChange={(e) => setShipName(e.target.value)} /></label>
            <label>Country
              <select value={shipCountry} onChange={(e) => setShipCountry(e.target.value as (typeof COUNTRIES)[number])}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Delivery address<textarea required rows={3} value={shipAddr} onChange={(e) => setShipAddr(e.target.value)} /></label>
            <fieldset className="pay-choice">
              <legend>Payment</legend>
              <label><input type="radio" name="pay" checked={payMethod === "card"} onChange={() => setPayMethod("card")} /> Card</label>
              <label><input type="radio" name="pay" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")} /> Cash on delivery</label>
            </fieldset>
            <p className="muted">{payMethod === "card" ? "A secure pay link is emailed when the atelier confirms. The card number is not taken on this page." : "Pay when the parcel arrives."}</p>
            {!user && (
              <p className="auth-links">
                <button type="button" className="cta" onClick={() => signIn("checkout")} disabled={isLoading}>Login</button>
                <button type="button" className="cta ghost" onClick={() => signIn("checkout", "signup")} disabled={isLoading}>Signup</button>
              </p>
            )}
            <p className="muted">{EXCHANGE}</p>
            {authError && <p className="auth-error">{authError}</p>}
            <button type="submit" className="cta" disabled={authBusy || cart.length === 0 || !user}>{authBusy ? "Placing…" : `Confirm order · ${money(q.total)}`}</button>
          </form>
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
          <h2 className="section-title">Notes</h2>
          {notes.length === 0 ? <p className="muted">No notes yet.</p> : (
            <ul className="order-list">{notes.map((n) => (
              <li key={n.id} className="order-card">
                <strong>{n.name}</strong> <span className="muted">{n.email}{n.order_no ? ` · ${n.order_no}` : ""}</span>
                <p>{n.body}</p>
              </li>
            ))}</ul>
          )}
          <h2 className="section-title">Clicks, bag, checkout</h2>
          {shopEvents.length === 0 ? <p className="muted">No shopper events yet.</p> : (
            <ul className="order-list">{shopEvents.map((ev) => (
              <li key={ev.id} className="order-card">
                <strong>{ev.kind}</strong> <span className="muted">{ev.created_at} UTC</span>
                <p>{ev.label || "—"} <span className="muted">{ev.path}</span></p>
                <p className="muted">{ev.session_id.slice(0, 8)}{ev.product_id ? ` · ${ev.product_id}` : ""}</p>
              </li>
            ))}</ul>
          )}
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
              {orderTrack(o)}
              {totalsBlock(o)}
            </li>
          ))}</ul>
        </>
      )}
    </main>);
  }

  if (view === "about") return <div className="store">{header}<AtelierView onShop={(c) => goShop(c ?? "All")} onSizes={() => go("sizes")} />{footer}</div>;
  if (view === "contact") return shell(<ContactPage />);
  const searchHits = searchHouse(searchQuery, 48);
  const gridProducts = view === "search" ? searchHits.products : filtered;
  const productGrid = (
      <div className="grid shop-grid">{gridProducts.map((p) => (
        <article key={p.id} className="card product-tile">
          <button type="button" className="card-hit" aria-label={p.name} onClick={() => { go("product", { product: p }); }}>
            <div className="card-visual">
              <Motion image={p.image} video={p.video} alt={p.name} />
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
    return <div className="store">{header}<SizesView onOpen={(p, size) => { setPickSize((s) => ({ ...s, [p.id]: size })); go("product", { product: p }); }} />{footer}</div>;
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
              <div>
                <p className="trust-title">{t.title}</p>
                <p className="trust-desc">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="marquee" aria-hidden="true"><div className="marquee-track">{[...MARQUEE, ...MARQUEE].map((m, i) => (
        <span className="marquee-still" key={i}>
          <img src={m.src} alt="" />
          <video className="motion-video" autoPlay muted loop playsInline poster={m.src}><source src={m.src.replace(/\.jpg$/, ".mp4")} type="video/mp4" /></video>
        </span>
      ))}</div></div>
      <section className="campaign-home">
        {CAMPAIGNS.map((c) => (
          <a key={c.id} href={roomHref(c.room)} className="campaign-panel" onClick={(e) => follow(e, () => goRoom(c.room))}>
            <img className="ken" src={c.poster} alt="" />
            {c.video && <video className="motion-video" autoPlay muted loop playsInline poster={c.poster}><source src={c.video} type="video/mp4" /></video>}
            <div className="hero-veil" />
            <span className="eyebrow">{c.kicker}</span>
            <strong>{c.title}</strong>
          </a>
        ))}
      </section>
      <section className="page">
        <div className="atelier-story-card">
          <div className="atelier-story-media">
            <img className="ken" src={HERO.poster} alt="The Femme Atelier" />
            <video className="motion-video" autoPlay muted loop playsInline poster={HERO.poster}>
              <source src={HERO.video} type="video/mp4" />
            </video>
            <div className="hero-veil" style={{ opacity: 0.35 }} />
          </div>
          <div className="atelier-story-content">
            <p className="eyebrow">{STORY.kicker}</p>
            <h2 className="page-title">{STORY.heading}</h2>
            <p className="lede">{STORY.body}</p>
            <div className="hero-ctas">
              <a href="/atelier" className="cta" onClick={(e) => follow(e, () => go("about"))}>Discover The Atelier</a>
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
            <a key={a.cat} href={catHref(a.cat)} className="aisle" onClick={(e) => follow(e, () => goShop(a.cat))}>
              <img className="ken" src={a.image} alt="" />
              <video className="motion-video" autoPlay muted loop playsInline poster={a.image}>
                <source src={a.image.replace(/\.jpg$/, ".mp4")} type="video/mp4" />
              </video>
              <div className="hero-veil" />
              <span><em>{a.cat}</em><b>{a.title}</b></span>
            </a>
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
            <button type="button" className="card-hit" aria-label={p.name} onClick={() => { go("product", { product: p }); }}>
              <div className="card-visual"><Motion image={p.image} video={p.video} alt={p.name} />{p.tag && <span className="tag on-dark">{p.tag}</span>}</div>
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
            <img className="ken" src={p.image} alt={p.title} onError={coverFallback} />
            <video className="motion-video" autoPlay muted loop playsInline poster={p.image}>
              <source src={p.image.replace(/\.jpg$/, ".mp4")} type="video/mp4" />
            </video>
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
