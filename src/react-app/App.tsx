import { useMemo, useState } from "react";
import "./App.css";

type View = "home" | "shop" | "product" | "about" | "contact" | "cart";

type Product = {
	id: string;
	name: string;
	category: string;
	price: number;
	compareAt?: number;
	description: string;
	tag?: string;
	accent: string;
};

const CATEGORIES = [
	"All",
	"Bras",
	"Panties",
	"Lingerie",
	"Shapewear",
	"Sleepwear",
	"Loungewear",
] as const;

const PRODUCTS: Product[] = [
	{
		id: "everyday-soft-bra",
		name: "Everyday Soft Cup Bra",
		category: "Bras",
		price: 42,
		compareAt: 52,
		description:
			"A gentle, wireless everyday bra with breathable cups and a soft-stretch band. Built for all-day wear, first fits, and real movement.",
		tag: "Best seller",
		accent: "#5a1a3a",
	},
	{
		id: "ultimate-tshirt-bra",
		name: "Ultimate T-Shirt Bra",
		category: "Bras",
		price: 48,
		description:
			"Smooth molded cups that disappear under knits. Light lift, no show-through, and a hook-and-eye back that stays put.",
		tag: "New",
		accent: "#3d1230",
	},
	{
		id: "first-fit-teen-bra",
		name: "First Fit Bralette",
		category: "Bras",
		price: 28,
		description:
			"Comfortable, gentle innerwear for growing teens. Soft straps, cotton-blend lining, and a sizing guide that takes the guesswork out.",
		tag: "Teen",
		accent: "#6b2048",
	},
	{
		id: "daily-hipster",
		name: "Daily Hipster Brief",
		category: "Panties",
		price: 16,
		description:
			"Breathable mid-rise brief with a cotton gusset and a no-dig waistband. Pack-ready basics that actually stay comfortable.",
		accent: "#4a1634",
	},
	{
		id: "seamless-thong",
		name: "Seamless Soft Thong",
		category: "Panties",
		price: 14,
		description:
			"Nearly invisible under fitted clothes. Soft microfiber, clean edges, and a barely-there feel that still stays in place.",
		accent: "#2a0e20",
	},
	{
		id: "lace-balconette-set",
		name: "Lace Balconette Set",
		category: "Lingerie",
		price: 78,
		compareAt: 96,
		description:
			"A matching balconette and brief in stretch lace. Supportive underwire, adjustable straps, and a silhouette made for real curves.",
		tag: "Set",
		accent: "#7a1f4d",
	},
	{
		id: "mesh-bodysuit",
		name: "Mesh Contour Bodysuit",
		category: "Lingerie",
		price: 88,
		description:
			"Sculpting mesh panels with snap closures. Wear it as lingerie or under an open shirt — stylish and functional.",
		accent: "#401028",
	},
	{
		id: "high-waist-shaper",
		name: "High-Waist Soft Shaper",
		category: "Shapewear",
		price: 54,
		description:
			"Light control that smooths without squeezing. Breathable knit, stay-put silicone edge, made to move with you.",
		tag: "Shape",
		accent: "#521834",
	},
	{
		id: "slip-short",
		name: "Everyday Slip Short",
		category: "Shapewear",
		price: 36,
		description:
			"Anti-chafe shorts with a gentle hold. Wear under dresses or as a layer — no rolling, no shine.",
		accent: "#2c101c",
	},
	{
		id: "satin-night-set",
		name: "Satin Night Cami Set",
		category: "Sleepwear",
		price: 64,
		description:
			"Cool-touch satin cami and shorts. Sleep in style, wake in comfort — with an adjustable strap and relaxed cut.",
		tag: "Night",
		accent: "#8a2458",
	},
	{
		id: "cloud-robe",
		name: "Cloud Knit Robe",
		category: "Loungewear",
		price: 72,
		description:
			"A mid-weight knit robe with a self-tie belt and deep pockets. Soft on skin, easy over sleepwear.",
		accent: "#3a1428",
	},
	{
		id: "lounge-wide-pant",
		name: "Wide-Leg Lounge Pant",
		category: "Loungewear",
		price: 58,
		description:
			"Relaxed drawstring pant in a modal blend. Drapes clean, washes well, made for weekends and late flights.",
		accent: "#4e1838",
	},
];

const FEATURES = [
	{ title: "Inclusive & Empowering", copy: "Sized and styled for real bodies, not a single ideal." },
	{ title: "Affordable Luxury", copy: "Premium feel and finish without the designer markup." },
	{ title: "Tailored for Real Women", copy: "Fit-first design informed by everyday wear, not just lookbooks." },
	{ title: "Stylish & Functional", copy: "Pieces you can live in — and still want to be seen in." },
];

const SERVICES = [
	{ title: "Free & Fast Delivery", copy: "Complimentary shipping on orders over $100 across the lower 48." },
	{ title: "24/7 Online Support", copy: "Fit questions, exchanges, and order help whenever you need it." },
	{ title: "30-Day Easy Returns", copy: "Exchange or return unworn items within 30 days, no extra cost." },
];

const TESTIMONIALS = [
	{
		title: "Real Comfort, Finally!",
		quote:
			"I used to think innerwear was just something functional. Femme completely shifted that. From the first everyday bra I could feel the difference.",
		who: "Emily R., London, UK",
		rating: 4,
	},
	{
		title: "My Go-To Brand, Always",
		quote:
			"Postpartum life changed my body and my priorities. Finding comfortable pieces that didn’t feel clinical was impossible… until Femme.",
		who: "Sophie L., New York, USA",
		rating: 5,
	},
	{
		title: "Perfect for Every Curve",
		quote:
			"Shopping as a curvy woman used to mean wrong sizes and boring styles. Femme changed the game — the fit finally feels considered.",
		who: "Isabella M., Melbourne, Australia",
		rating: 4,
	},
];

const TICKER = ["Free Shipping Over $100+", "10% OFF on Selective New items", "COD available on all orders"];

const COLLECTIONS = [
	{ name: "Bras", accent: "linear-gradient(160deg,#7a1f4d,#1a050e)" },
	{ name: "Panties", accent: "linear-gradient(160deg,#4a1634,#12040a)" },
	{ name: "Lingerie", accent: "linear-gradient(160deg,#8a2458,#1c0610)" },
	{ name: "Shapewear", accent: "linear-gradient(160deg,#521834,#0e0408)" },
	{ name: "Sleepwear", accent: "linear-gradient(160deg,#6b2048,#14060c)" },
	{ name: "Loungewear", accent: "linear-gradient(160deg,#3a1428,#0a0306)" },
];

type CartLine = { product: Product; qty: number };

function Stars({ n }: { n: number }) {
	return (
		<span className="stars" aria-label={`${n} out of 5`}>
			{"★★★★★".slice(0, n)}
			<span className="off">{"★★★★★".slice(n)}</span>
		</span>
	);
}

function App() {
	const [view, setView] = useState<View>("home");
	const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
	const [selected, setSelected] = useState<Product | null>(null);
	const [cart, setCart] = useState<CartLine[]>([]);
	const [hero, setHero] = useState(0);
	const [menuOpen, setMenuOpen] = useState(false);
	const [sent, setSent] = useState(false);

	const cartCount = cart.reduce((n, l) => n + l.qty, 0);
	const cartTotal = cart.reduce((n, l) => n + l.product.price * l.qty, 0);

	const filtered = useMemo(() => {
		if (category === "All") return PRODUCTS;
		return PRODUCTS.filter((p) => p.category === category);
	}, [category]);

	function goHome() {
		setView("home");
		setSelected(null);
		setMenuOpen(false);
	}

	function goShop(cat: (typeof CATEGORIES)[number] = "All") {
		setCategory(cat);
		setSelected(null);
		setView("shop");
		setMenuOpen(false);
	}

	function openProduct(p: Product) {
		setSelected(p);
		setView("product");
		setMenuOpen(false);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function addToCart(p: Product) {
		setCart((prev) => {
			const hit = prev.find((l) => l.product.id === p.id);
			if (hit) return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l));
			return [...prev, { product: p, qty: 1 }];
		});
	}

	function setQty(id: string, qty: number) {
		setCart((prev) =>
			qty <= 0 ? prev.filter((l) => l.product.id !== id) : prev.map((l) => (l.product.id === id ? { ...l, qty } : l)),
		);
	}

	const header = (
		<>
			<div className="ticker" style={{ background: "#ea1095" }}>
				<div className="ticker-track">
					{[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
						<span key={i}>{t}</span>
					))}
				</div>
			</div>
			<header className="topbar">
				<button type="button" className="brand" onClick={goHome}>
					FEMME
					<small>Silk Moments</small>
				</button>
				<nav className={`nav ${menuOpen ? "open" : ""}`}>
					<button type="button" className={view === "home" ? "active" : ""} onClick={goHome}>
						Home
					</button>
					<button type="button" className={view === "shop" || view === "product" ? "active" : ""} onClick={() => goShop()}>
						Shop collection
					</button>
					<button type="button" className={view === "about" ? "active" : ""} onClick={() => { setView("about"); setMenuOpen(false); }}>
						About us
					</button>
					<button type="button" className={view === "contact" ? "active" : ""} onClick={() => { setView("contact"); setMenuOpen(false); }}>
						Contact us
					</button>
				</nav>
				<div className="topbar-right">
					<button type="button" className="icon-btn" onClick={() => setView("cart")} aria-label="Bag">
						Bag <em>{cartCount}</em>
					</button>
					<button type="button" className="burger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
						Menu
					</button>
				</div>
			</header>
		</>
	);

	const footer = (
		<footer className="foot">
			<div className="foot-grid">
				<div>
					<p className="foot-brand">FEMME</p>
					<p className="muted">
						Redefining comfort, confidence and care. Crafted for women, by women — inspired by real lives and real bodies.
					</p>
				</div>
				<div>
					<h3>Information</h3>
					<button type="button" onClick={() => setView("about")}>About us</button>
					<button type="button" onClick={() => setView("contact")}>Contact</button>
					<button type="button" onClick={() => goShop()}>Shop</button>
				</div>
				<div>
					<h3>Categories</h3>
					{CATEGORIES.filter((c) => c !== "All").map((c) => (
						<button key={c} type="button" onClick={() => goShop(c)}>{c}</button>
					))}
				</div>
				<div>
					<h3>Store information</h3>
					<p className="muted">A20 Green Hill Road<br />Fayetteville, California</p>
					<p className="muted">+1 209-223-2635</p>
					<p className="muted">info@silkmoments.com</p>
				</div>
			</div>
			<form className="newsletter" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
				<div>
					<strong>Subscribe to our newsletter</strong>
					<p>Current news and 20% off your first order.</p>
				</div>
				<div className="newsletter-row">
					<input type="email" required placeholder="Email address" aria-label="Email" />
					<button type="submit">{sent ? "You're in" : "Subscribe"}</button>
				</div>
			</form>
			<div className="copyright">© {new Date().getFullYear()} Femme · Silk Moments · Demo on Cloudflare Workers</div>
		</footer>
	);

	if (view === "product" && selected) {
		return (
			<div className="store">
				{header}
				<main className="page">
					<button type="button" className="back" onClick={() => goShop(selected.category as (typeof CATEGORIES)[number])}>
						Back to {selected.category}
					</button>
					<div className="detail-grid">
						<div className="detail-hero" style={{ background: `linear-gradient(145deg, ${selected.accent}, #030101)` }}>
							<span className="hero-mark">{selected.category}</span>
							<span className="hero-initial">{selected.name.charAt(0)}</span>
						</div>
						<div className="detail-copy">
							{selected.tag && <span className="tag">{selected.tag}</span>}
							<h1>{selected.name}</h1>
							<p className="price">
								${selected.price}
								{selected.compareAt && <s>${selected.compareAt}</s>}
							</p>
							<p className="desc">{selected.description}</p>
							<ul className="specs">
								<li>Soft on skin, built for everyday wear</li>
								<li>Inclusive sizing with a simple fit guide</li>
								<li>30-day easy returns on unworn items</li>
							</ul>
							<button type="button" className="cta" onClick={() => addToCart(selected)}>Add to bag</button>
						</div>
					</div>
				</main>
				{footer}
			</div>
		);
	}

	if (view === "cart") {
		return (
			<div className="store">
				{header}
				<main className="page">
					<h1 className="page-title">Your bag</h1>
					{cart.length === 0 ? (
						<p className="muted">
							Your bag is empty.{" "}
							<button type="button" className="text-link" onClick={() => goShop()}>Shop the collection</button>
						</p>
					) : (
						<div className="cart-layout">
							<ul className="cart-list">
								{cart.map((l) => (
									<li key={l.product.id}>
										<div className="cart-swatch" style={{ background: l.product.accent }} />
										<div>
											<strong>{l.product.name}</strong>
											<p className="muted">{l.product.category} · ${l.product.price}</p>
										</div>
										<div className="qty">
											<button type="button" onClick={() => setQty(l.product.id, l.qty - 1)}>-</button>
											<span>{l.qty}</span>
											<button type="button" onClick={() => setQty(l.product.id, l.qty + 1)}>+</button>
										</div>
										<strong>${l.product.price * l.qty}</strong>
									</li>
								))}
							</ul>
							<aside className="cart-sum">
								<p>Subtotal <strong>${cartTotal}</strong></p>
								<p className="muted">Free shipping over $100 · COD available</p>
								<button type="button" className="cta" onClick={() => setView("contact")}>Checkout inquiry</button>
							</aside>
						</div>
					)}
				</main>
				{footer}
			</div>
		);
	}

	if (view === "about") {
		return (
			<div className="store">
				{header}
				<main className="page about">
					<p className="eyebrow">About us</p>
					<h1>Femme — redefining comfort, confidence and care</h1>
					<p className="lede">At Femme, we believe that true beauty begins with self-love and confidence. Our brand is built for women, by women — inspired by real lives, real bodies, and real needs.</p>
					<p className="desc">From intimate innerwear to feel-good fashion essentials, every Femme product is crafted to embrace you just the way you are. Join the movement. Celebrate you — bold, beautiful, and unapologetically Femme.</p>
					<div className="feature-row">
						{FEATURES.map((f) => (
							<article key={f.title}><h3>{f.title}</h3><p>{f.copy}</p></article>
						))}
					</div>
				</main>
				{footer}
			</div>
		);
	}

	if (view === "contact") {
		return (
			<div className="store">
				{header}
				<main className="page">
					<p className="eyebrow">Contact us</p>
					<h1 className="page-title">We are here to help</h1>
					<div className="contact-grid">
						<form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
							<label>Name<input required name="name" /></label>
							<label>Email<input required type="email" name="email" /></label>
							<label>Message<textarea required name="message" rows={5} /></label>
							<button type="submit" className="cta">{sent ? "Message sent" : "Send message"}</button>
						</form>
						<div>
							<p className="muted">A20 Green Hill Road, Fayetteville, California.</p>
							<p className="muted">+1 209-223-2635</p>
							<p className="muted">info@silkmoments.com</p>
						</div>
					</div>
				</main>
				{footer}
			</div>
		);
	}

	if (view === "shop") {
		return (
			<div className="store">
				{header}
				<main className="page">
					<div className="catalog-head">
						<div>
							<p className="eyebrow">Shop collection</p>
							<h1 className="page-title">{category === "All" ? "Shop best collection" : category}</h1>
						</div>
						<p className="muted">{filtered.length} pieces</p>
					</div>
					<div className="nav-cats">
						{CATEGORIES.map((c) => (
							<button key={c} type="button" className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>
						))}
					</div>
					<div className="grid">
						{filtered.map((p) => (
							<article key={p.id} className="card">
								<button type="button" className="card-hit" onClick={() => openProduct(p)}>
									<div className="card-visual" style={{ background: `linear-gradient(160deg, ${p.accent}, #121212)` }}>
										{p.tag && <span className="tag on-dark">{p.tag}</span>}
										<span className="card-initial">{p.name.charAt(0)}</span>
									</div>
									<div className="card-body">
										<p className="card-cat">{p.category}</p>
										<h3>{p.name}</h3>
										<p className="card-price">${p.price}{p.compareAt && <s>${p.compareAt}</s>}</p>
									</div>
								</button>
							</article>
						))}
					</div>
				</main>
				{footer}
			</div>
		);
	}

	return (
		<div className="store">
			{header}
			<section className="hero">
				<div className="hero-slide" style={{ background: hero === 0 ? "linear-gradient(120deg,#2a0816,#030101 55%)" : "linear-gradient(120deg,#1a0610,#030101 55%)" }}>
					<p className="eyebrow light">{hero === 0 ? "Your first fit should be the right one" : "Find your fit, feel the difference"}</p>
					<h1>
						{hero === 0 ? (
							<>The Ultimate Bra Style<br />Guide for Every Outfit</>
						) : (
							<>Everyday Bras & Undies<br />That Move with You</>
						)}
					</h1>
					<p className="lede light">
						{hero === 0
							? "Comfortable, gentle innerwear for growing teens and everyday wear."
							: "Soft, breathable styles for real life and real comfort."}
					</p>
					<button type="button" className="cta" onClick={() => goShop("Bras")}>Shop now</button>
					<div className="hero-dots">
						<button type="button" className={hero === 0 ? "on" : ""} onClick={() => setHero(0)} aria-label="Slide 1" />
						<button type="button" className={hero === 1 ? "on" : ""} onClick={() => setHero(1)} aria-label="Slide 2" />
					</div>
				</div>
			</section>

			<section className="page">
				<div className="catalog-head"><h2>Shop by collection</h2></div>
				<div className="collections">
					{COLLECTIONS.map((c) => (
						<button key={c.name} type="button" className="col-card" style={{ background: c.accent }} onClick={() => goShop(c.name as (typeof CATEGORIES)[number])}>
							<span>{c.name}</span>
						</button>
					))}
				</div>
			</section>

			<section className="page split">
				<div className="split-visual" />
				<div>
					<p className="eyebrow">About us</p>
					<h2>Femme – redefining comfort, confidence and care</h2>
					<p className="desc">At Femme, we believe that true beauty begins with self-love and confidence. From intimate innerwear to feel-good essentials, every piece is crafted to embrace you just the way you are.</p>
					<button type="button" className="cta ghost" onClick={() => setView("about")}>Read our story</button>
				</div>
			</section>

			<section className="page">
				<div className="catalog-head">
					<h2>Shop best collection</h2>
					<button type="button" className="text-link" onClick={() => goShop()}>View all</button>
				</div>
				<div className="grid">
					{PRODUCTS.slice(0, 8).map((p) => (
						<article key={p.id} className="card">
							<button type="button" className="card-hit" onClick={() => openProduct(p)}>
								<div className="card-visual" style={{ background: `linear-gradient(160deg, ${p.accent}, #121212)` }}>
									{p.tag && <span className="tag on-dark">{p.tag}</span>}
									<span className="card-initial">{p.name.charAt(0)}</span>
								</div>
								<div className="card-body">
									<p className="card-cat">{p.category}</p>
									<h3>{p.name}</h3>
									<p className="card-price">${p.price}</p>
								</div>
							</button>
						</article>
					))}
				</div>
			</section>

			<section className="banners page">
				{[
					["Sustainable innerwear", "Soft on skin. Kinder to earth."],
					["Teen & first bra", "Your first fit should be the right one."],
					["Sleepwear & nightwear", "Sleep in style, wake in comfort."],
					["Bridal & occasion", "For the most beautiful you."],
				].map(([t, s]) => (
					<button key={t} type="button" className="banner" onClick={() => goShop()}>
						<strong>{t}</strong>
						<span>{s}</span>
					</button>
				))}
			</section>

			<section className="page quotes">
				<h2>What our clients say</h2>
				<div className="quote-grid">
					{TESTIMONIALS.map((t) => (
						<blockquote key={t.who}>
							<Stars n={t.rating} />
							<h3>{t.title}</h3>
							<p>{t.quote}</p>
							<footer>{t.who}</footer>
						</blockquote>
					))}
				</div>
			</section>

			<section className="services">
				{SERVICES.map((s) => (
					<article key={s.title}><h3>{s.title}</h3><p>{s.copy}</p></article>
				))}
			</section>
			{footer}
		</div>
	);
}

export default App;
