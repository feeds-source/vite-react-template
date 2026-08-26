import { useMemo, useState } from "react";
import "./App.css";

type Product = {
	id: string;
	name: string;
	category: string;
	price: number;
	description: string;
	tag?: string;
	accent: string;
};

const PRODUCTS: Product[] = [
	{
		id: "wallet-denim",
		name: "Selvedge Denim Wallet",
		category: "Wallets",
		price: 42,
		description:
			"Hand-stitched bifold from leftover Japanese selvedge. Ages with a soft indigo fade—built for cards, cash, and years of wear.",
		tag: "Best seller",
		accent: "#3d5a80",
	},
	{
		id: "wallet-patch",
		name: "Patchwork Coin Wallet",
		category: "Wallets",
		price: 36,
		description:
			"Recycled jean pockets turned into a compact coin and card pouch. Brass snap, raw edges, one-of-a-kind panels.",
		accent: "#5c4033",
	},
	{
		id: "keychain-rivet",
		name: "Rivet Tag Keychain",
		category: "Keychains",
		price: 14,
		description:
			"A worn denim scrap, copper rivet, and solid brass ring. Small enough for keys, tough enough for daily carry.",
		tag: "New",
		accent: "#8b7355",
	},
	{
		id: "keychain-loop",
		name: "Belt-Loop Key Fob",
		category: "Keychains",
		price: 18,
		description:
			"Cut from authentic belt loops. Indigo-dyed cord and a stamped year tag—simple, useful, and pure workwear.",
		accent: "#2c3e50",
	},
	{
		id: "jacket-truck",
		name: "Type III Trucker Jacket",
		category: "Jackets",
		price: 168,
		description:
			"Classic trucker cut in 13.5 oz rigid denim. Copper buttons, chest pockets, and a blank canvas for your own fade story.",
		tag: "Heritage",
		accent: "#1a365d",
	},
	{
		id: "jacket-chore",
		name: "Chore Coat — Faded Indigo",
		category: "Jackets",
		price: 154,
		description:
			"Roomy chore silhouette with three front pockets. Pre-washed for a lived-in hand; ready for workshops and weekends.",
		accent: "#4a5568",
	},
	{
		id: "pant-straight",
		name: "Straight Fit 1955",
		category: "Pants",
		price: 128,
		description:
			"Mid-rise straight leg inspired by mid-century work pants. Unsanforized option available—expect honest shrink and character.",
		tag: "Classic",
		accent: "#2b4c7e",
	},
	{
		id: "pant-wide",
		name: "Wide Crop Carpenter",
		category: "Pants",
		price: 138,
		description:
			"Relaxed crop with tool pocket and hammer loop. Soft stone wash, reinforced seams, made for movement.",
		accent: "#5a6a7a",
	},
	{
		id: "apron-studio",
		name: "Studio Denim Apron",
		category: "Goods",
		price: 58,
		description:
			"Cross-back apron from heavy mill ends. Leather straps, deep pockets—for makers, baristas, and weekend projects.",
		accent: "#6b4423",
	},
	{
		id: "tote-market",
		name: "Market Tote — Repaired",
		category: "Goods",
		price: 48,
		description:
			"Upcycled jean legs and sashiko-style mends. Roomy, washable, and proudly imperfect.",
		tag: "Upcycled",
		accent: "#3d4450",
	},
	{
		id: "cap-brim",
		name: "Indigo Work Cap",
		category: "Goods",
		price: 32,
		description:
			"Six-panel cap in soft broken-in denim. Adjustable strap, subtle tonal stitch—everyday headwear with grit.",
		accent: "#34495e",
	},
	{
		id: "patch-kit",
		name: "Vintage Patch Kit",
		category: "Goods",
		price: 24,
		description:
			"Assorted denim scraps, needles, and waxed thread. Repair, customize, or start your next small project.",
		accent: "#7d6b55",
	},
];

const CATEGORIES = ["All", "Wallets", "Keychains", "Jackets", "Pants", "Goods"] as const;

function App() {
	const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
	const [selected, setSelected] = useState<Product | null>(null);
	const [cartCount, setCartCount] = useState(0);

	const filtered = useMemo(() => {
		if (category === "All") return PRODUCTS;
		return PRODUCTS.filter((p) => p.category === category);
	}, [category]);

	function addToCart() {
		setCartCount((c) => c + 1);
	}

	if (selected) {
		return (
			<div className="shop">
				<header className="topbar">
					<button type="button" className="brand" onClick={() => setSelected(null)}>
						Indigo <span>Archive</span>
					</button>
					<div className="topbar-right">
						<span className="cart-pill">Bag {cartCount}</span>
					</div>
				</header>

				<main className="detail">
					<button type="button" className="back" onClick={() => setSelected(null)}>
						← Back to shop
					</button>
					<div className="detail-grid">
						<div
							className="detail-hero"
							style={{ background: `linear-gradient(145deg, ${selected.accent} 0%, #1a1a1a 100%)` }}
						>
							<span className="hero-mark">{selected.category}</span>
							<span className="hero-initial">{selected.name.charAt(0)}</span>
						</div>
						<div className="detail-copy">
							{selected.tag && <span className="tag">{selected.tag}</span>}
							<h1>{selected.name}</h1>
							<p className="price">${selected.price}</p>
							<p className="desc">{selected.description}</p>
							<ul className="specs">
								<li>Made from real denim & mill leftovers</li>
								<li>Ships in recycled paper wrap</li>
								<li>Built to fade, not fall apart</li>
							</ul>
							<button type="button" className="cta" onClick={addToCart}>
								Add to bag
							</button>
						</div>
					</div>
				</main>

				<footer className="foot">
					<p>Indigo Archive · Vintage denim goods · Est. in the wash</p>
				</footer>
			</div>
		);
	}

	return (
		<div className="shop">
			<div className="paper-grain" aria-hidden />

			<header className="topbar">
				<button type="button" className="brand" onClick={() => setCategory("All")}>
					Indigo <span>Archive</span>
				</button>
				<nav className="nav-cats">
					{CATEGORIES.map((c) => (
						<button
							key={c}
							type="button"
							className={category === c ? "active" : ""}
							onClick={() => setCategory(c)}
						>
							{c}
						</button>
					))}
				</nav>
				<div className="topbar-right">
					<span className="cart-pill">Bag {cartCount}</span>
				</div>
			</header>

			<section className="hero-banner">
				<div className="hero-text">
					<p className="eyebrow">Worn in · Not worn out</p>
					<h1>Jeans goods with a past</h1>
					<p className="lede">
						Wallets, keychains, jackets, and pants cut from real denim—vintage soul, everyday use. Small
						batches, honest materials.
					</p>
				</div>
				<div className="hero-stamp">
					<span>EST.</span>
					<strong>INDIGO</strong>
					<span>MILL</span>
				</div>
			</section>

			<main className="catalog">
				<div className="catalog-head">
					<h2>{category === "All" ? "The full rack" : category}</h2>
					<p>{filtered.length} pieces</p>
				</div>

				<div className="grid">
					{filtered.map((p) => (
						<article key={p.id} className="card">
							<button type="button" className="card-hit" onClick={() => setSelected(p)}>
								<div
									className="card-visual"
									style={{ background: `linear-gradient(160deg, ${p.accent} 0%, #121212 95%)` }}
								>
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
			</main>

			<section className="story">
				<h2>Why denim lasts</h2>
				<p>
					Every piece starts as jean cloth—mill ends, repaired legs, or full cuts of rigid indigo. We keep
					the hardware simple, the stitching strong, and the finish honest so your wallet, jacket, or
					keychain picks up the same character as a favorite pair of pants.
				</p>
			</section>

			<footer className="foot">
				<p>Indigo Archive · Wallets · Keychains · Jackets · Pants · Goods</p>
				<p className="muted">Vintage look, modern make · Demo storefront</p>
			</footer>
		</div>
	);
}

export default App;
