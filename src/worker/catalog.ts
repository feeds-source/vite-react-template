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

/** Gift box $2.95 plus $0.85 for each extra piece. */
export function packagingCents(itemCount: number): number {
	if (itemCount <= 0) return 0;
	return 295 + Math.max(0, itemCount - 1) * 85;
}

export function shippingCents(subtotalCents: number): number {
	return subtotalCents >= 10000 ? 0 : 800;
}

export function taxForDestination(address: string, country: string): { rate: number; label: string } {
	const blob = `${country} ${address}`.toLowerCase();
	if (/(^|\b)(ae|uae|united arab|dubai|abu dhabi)(\b|$)/.test(blob)) return { rate: 0.05, label: "UAE VAT 5%" };
	if (/(^|\b)(gb|uk|united kingdom|england|scotland|wales)(\b|$)/.test(blob)) return { rate: 0.2, label: "UK VAT 20%" };
	if (/(germany|france|italy|spain|netherlands|ireland|belgium|austria|sweden)/.test(blob)) {
		return { rate: 0.2, label: "EU VAT 20%" };
	}
	if (/(^|\b)(pk|pakistan)(\b|$)/.test(blob)) return { rate: 0, label: "Duties & taxes (not charged)" };
	return { rate: 0, label: "Duties & taxes (not charged)" };
}

export function taxCents(subtotalCents: number, address: string, country: string): number {
	const { rate } = taxForDestination(address, country);
	return Math.round(subtotalCents * rate);
}

/** Cash-on-delivery handling. */
export function otherCents(): number {
	return 150;
}

export function quoteOrder(subtotalCents: number, itemCount: number, address: string, country: string) {
	const taxInfo = taxForDestination(address, country);
	const packaging = packagingCents(itemCount);
	const shipping = shippingCents(subtotalCents);
	const tax = Math.round(subtotalCents * taxInfo.rate);
	const other = otherCents();
	return {
		packaging,
		shipping,
		tax,
		taxLabel: taxInfo.label,
		other,
		total: subtotalCents + packaging + shipping + tax + other,
	};
}
