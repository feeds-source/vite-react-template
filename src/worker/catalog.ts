export type CatalogItem = { id: string; name: string; category: string; price: number };

export const CATALOG: CatalogItem[] = [
	{ id: "everyday-soft-bra", name: "Everyday Soft Cup Bra", category: "Bras", price: 42 },
	{ id: "ultimate-tshirt-bra", name: "Ultimate T-Shirt Bra", category: "Bras", price: 48 },
	{ id: "first-fit-teen-bra", name: "First Fit Bralette", category: "Bras", price: 28 },
	{ id: "daily-hipster", name: "Daily Hipster Brief", category: "Panties", price: 16 },
	{ id: "seamless-thong", name: "Seamless Soft Thong", category: "Panties", price: 14 },
	{ id: "lace-balconette-set", name: "Lace Balconette Set", category: "Lingerie", price: 78 },
	{ id: "mesh-bodysuit", name: "Mesh Contour Bodysuit", category: "Lingerie", price: 88 },
	{ id: "high-waist-shaper", name: "High-Waist Soft Shaper", category: "Shapewear", price: 54 },
	{ id: "slip-short", name: "Everyday Slip Short", category: "Shapewear", price: 36 },
	{ id: "satin-night-set", name: "Satin Night Cami Set", category: "Sleepwear", price: 64 },
	{ id: "cloud-robe", name: "Cloud Knit Robe", category: "Loungewear", price: 72 },
	{ id: "lounge-wide-pant", name: "Wide-Leg Lounge Pant", category: "Loungewear", price: 58 },
	{ id: "thermal-set", name: "Soft Thermal Set", category: "Thermal", price: 68 },
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((p) => [p.id, p]));

export function dollarsToCents(n: number): number {
	return Math.round(n * 100);
}

export function shippingCents(subtotalCents: number): number {
	return subtotalCents >= 10000 ? 0 : 800;
}
