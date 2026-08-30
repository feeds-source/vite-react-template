export type CatalogItem = { id: string; name: string; category: string; price: number };

export const CATALOG: CatalogItem[] = [
	{ id: "everyday-soft-bra", name: "Everyday Soft Cup Bra", category: "Bras", price: 42 },
	{ id: "ultimate-tshirt-bra", name: "Ultimate T-Shirt Bra", category: "Bras", price: 48 },
	{ id: "first-fit-teen-bra", name: "First Fit Bralette", category: "Bras", price: 28 },
	{ id: "lace-balconette-set", name: "Lace Balconette Set", category: "Bra Sets", price: 78 },
	{ id: "daily-hipster", name: "Daily Hipster Brief", category: "Panties", price: 16 },
	{ id: "seamless-thong", name: "Seamless Soft Thong", category: "Panties", price: 14 },
	{ id: "ruby-brazilian", name: "Ruby Silk Brazilian", category: "Panties", price: 22 },
	{ id: "lace-camisole", name: "Champagne Lace Camisole", category: "Camisole", price: 36 },
	{ id: "ruby-babydoll", name: "Ruby Lace Babydoll", category: "Babydoll", price: 88 },
	{ id: "satin-night-set", name: "Satin Night Cami Set", category: "Short Nighty", price: 64 },
	{ id: "short-lace-nighty", name: "Noir Short Lace Nighty", category: "Short Nighty", price: 72 },
	{ id: "silk-night-slip", name: "Champagne Night Slip", category: "Long Nighty", price: 86 },
	{ id: "satin-gown", name: "Black Satin Gown", category: "Gowns", price: 96 },
	{ id: "noir-teddy", name: "Noir Lace Teddy", category: "Teddies", price: 98 },
	{ id: "emerald-teddy", name: "Emerald Silk Teddy", category: "Teddies", price: 108 },
	{ id: "mesh-bodysuit", name: "Mesh Contour Bodysuit", category: "Teddies", price: 88 },
	{ id: "ivory-bridal-set", name: "Ivory Pearl Bridal Set", category: "Bridal", price: 148 },
	{ id: "getting-ready-robe", name: "Pearl Getting-Ready Robe", category: "Bridal", price: 118 },
	{ id: "emerald-bustier", name: "Emerald Silk Bustier", category: "Corsetry", price: 128 },
	{ id: "ruby-waspie", name: "Ruby Lace Waspie", category: "Corsetry", price: 96 },
	{ id: "seamed-stockings", name: "Champagne Seamed Stockings", category: "Hosiery", price: 32 },
	{ id: "lace-holdups", name: "Noir Lace Hold-Ups", category: "Hosiery", price: 28 },
	{ id: "lace-garter", name: "Noir Lace Garter", category: "Hosiery", price: 48 },
	{ id: "body-stocking", name: "Noir Lace Body Stocking", category: "Body Stockings", price: 42 },
	{ id: "high-waist-shaper", name: "High-Waist Soft Shaper", category: "Shapewear", price: 54 },
	{ id: "slip-short", name: "Everyday Slip Short", category: "Shapewear", price: 36 },
	{ id: "sculpt-midi", name: "Sculpt Midi Slip", category: "Shapewear", price: 62 },
	{ id: "silk-bikini", name: "Ruby Silk Bikini", category: "Swim", price: 58 },
	{ id: "cloud-robe", name: "Cloud Knit Robe", category: "Loungewear", price: 72 },
	{ id: "lounge-wide-pant", name: "Wide-Leg Lounge Pant", category: "Loungewear", price: 58 },
	{ id: "silk-kaftan", name: "Jewel Silk Kaftan", category: "Resort", price: 132 },
	{ id: "orchid-sarong", name: "Orchid Silk Sarong", category: "Resort", price: 64 },
	{ id: "thermal-set", name: "Soft Thermal Set", category: "Thermal", price: 68 },
	{ id: "plum-wrap", name: "Plum Cashmere Wrap", category: "Thermal", price: 94 },
	{ id: "silk-eye-mask", name: "Champagne Silk Mask", category: "Accessories", price: 24 },
	{ id: "gold-body-chain", name: "Gold Body Chain", category: "Accessories", price: 54 },
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
