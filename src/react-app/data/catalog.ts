export type Category =
  | "Bras"
  | "Bra Sets"
  | "Panties"
  | "Camisole"
  | "Babydoll"
  | "Short Nighty"
  | "Long Nighty"
  | "Gowns"
  | "Teddies"
  | "Bridal"
  | "Corsetry"
  | "Hosiery"
  | "Body Stockings"
  | "Shapewear"
  | "Swim"
  | "Loungewear"
  | "Resort"
  | "Thermal"
  | "Accessories";

export type SizeChart = "bra" | "alpha" | "nighty" | "gown" | "free";

export const SIZE_CHARTS: Record<SizeChart, readonly string[]> = {
  bra: [
    "30B",
    "32A",
    "32B",
    "32C",
    "32D",
    "34A",
    "34B",
    "34C",
    "34D",
    "36B",
    "36C",
    "36D",
    "38B",
    "38C",
    "38D",
    "40B",
    "40C",
    "42B",
    "42C",
  ],
  alpha: ["XS", "S", "M", "L", "XL", "XXL"],
  nighty: ["Free Size", "S", "M", "L", "XL"],
  gown: ["M", "L", "XL", "XXL"],
  free: ["Free Size"],
};

export const CHART_FOR: Record<Category, SizeChart> = {
  Bras: "bra",
  "Bra Sets": "bra",
  Panties: "alpha",
  Camisole: "alpha",
  Babydoll: "nighty",
  "Short Nighty": "nighty",
  "Long Nighty": "nighty",
  Gowns: "gown",
  Teddies: "alpha",
  Bridal: "bra",
  Corsetry: "alpha",
  Hosiery: "alpha",
  "Body Stockings": "free",
  Shapewear: "alpha",
  Swim: "alpha",
  Loungewear: "alpha",
  Resort: "alpha",
  Thermal: "alpha",
  Accessories: "free",
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  tag?: string;
  image: string;
  video?: string;
  sizeChart?: SizeChart;
};

export const CATEGORIES = [
  "All",
  "Bras",
  "Bra Sets",
  "Panties",
  "Camisole",
  "Babydoll",
  "Short Nighty",
  "Long Nighty",
  "Gowns",
  "Teddies",
  "Bridal",
  "Corsetry",
  "Hosiery",
  "Body Stockings",
  "Shapewear",
  "Swim",
  "Loungewear",
  "Resort",
  "Thermal",
  "Accessories",
] as const;

export const COUNTRIES = [
  "United Arab Emirates",
  "United Kingdom",
  "Pakistan",
  "United States",
  "Other",
] as const;

const piece = (id: string) => ({
  image: `/products/${id}.jpg`,
  video: `/products/${id}.mp4`,
});

export function chartFor(p: Product): SizeChart {
  return p.sizeChart ?? CHART_FOR[p.category];
}

export function sizesFor(p: Product): readonly string[] {
  return SIZE_CHARTS[chartFor(p)];
}

export function defaultSize(p: Product): string {
  const sizes = sizesFor(p);
  if (sizes.includes("M")) return "M";
  if (sizes.includes("32B")) return "32B";
  return sizes[0] ?? "Free Size";
}

export const PRODUCTS: Product[] = [
  {
    id: "everyday-soft-bra",
    name: "Everyday Soft Cup Bra",
    category: "Bras",
    price: 42,
    description: "Wireless cups with a second-skin finish for all-day ease.",
    tag: "Best seller",
    ...piece("everyday-soft-bra"),
  },
  {
    id: "ultimate-tshirt-bra",
    name: "Ultimate T-Shirt Bra",
    category: "Bras",
    price: 48,
    description: "Smooth molded cups that disappear under knits.",
    tag: "New",
    ...piece("ultimate-tshirt-bra"),
  },
  {
    id: "first-fit-teen-bra",
    name: "First Fit Bralette",
    category: "Bras",
    price: 28,
    description: "A gentle first-fit bralette with stretch lace trim.",
    ...piece("first-fit-teen-bra"),
  },
  {
    id: "lace-balconette-set",
    name: "Lace Balconette Set",
    category: "Bra Sets",
    price: 78,
    description: "Midnight lace balconette with matching brief.",
    tag: "Set",
    ...piece("lace-balconette-set"),
  },
  {
    id: "daily-hipster",
    name: "Daily Hipster Brief",
    category: "Panties",
    price: 16,
    description: "Breathable mid-rise brief in modal jersey.",
    ...piece("daily-hipster"),
  },
  {
    id: "seamless-thong",
    name: "Seamless Soft Thong",
    category: "Panties",
    price: 14,
    description: "Nearly invisible edges. Cool, dry, barely-there.",
    ...piece("seamless-thong"),
  },
  {
    id: "ruby-brazilian",
    name: "Ruby Silk Brazilian",
    category: "Panties",
    price: 22,
    description: "Jewel-tone silk brief with gold-trim edges.",
    ...piece("ruby-brazilian"),
  },
  {
    id: "lace-camisole",
    name: "Champagne Lace Camisole",
    category: "Camisole",
    price: 36,
    description: "Stretch lace cami, second-skin under silk.",
    ...piece("lace-camisole"),
  },
  {
    id: "ruby-babydoll",
    name: "Ruby Lace Babydoll",
    category: "Babydoll",
    price: 88,
    description: "Short lace babydoll with matching thong.",
    tag: "Babydoll",
    ...piece("ruby-babydoll"),
  },
  {
    id: "satin-night-set",
    name: "Satin Night Cami Set",
    category: "Short Nighty",
    price: 64,
    description: "Cool-touch satin cami and tap short.",
    tag: "Night",
    ...piece("satin-night-set"),
  },
  {
    id: "short-lace-nighty",
    name: "Noir Short Lace Nighty",
    category: "Short Nighty",
    price: 72,
    description: "Transparent short lace nighty for candlelight.",
    ...piece("short-lace-nighty"),
  },
  {
    id: "silk-night-slip",
    name: "Champagne Night Slip",
    category: "Long Nighty",
    price: 86,
    description: "Floor-length silk slip for moonlit rooms.",
    ...piece("silk-night-slip"),
  },
  {
    id: "satin-gown",
    name: "Black Satin Gown",
    category: "Gowns",
    price: 96,
    description: "Floor-length satin gown, lantern-hour dressing.",
    ...piece("satin-gown"),
  },
  {
    id: "noir-teddy",
    name: "Noir Lace Teddy",
    category: "Teddies",
    price: 98,
    description: "Black lace one-piece, cut for candlelight.",
    tag: "Teddy",
    ...piece("noir-teddy"),
  },
  {
    id: "emerald-teddy",
    name: "Emerald Silk Teddy",
    category: "Teddies",
    price: 108,
    description: "Jewel silk with gold lace trim.",
    ...piece("emerald-teddy"),
  },
  {
    id: "mesh-bodysuit",
    name: "Mesh Contour Bodysuit",
    category: "Teddies",
    price: 88,
    description: "Sculpting mesh that maps the body without squeeze.",
    tag: "Exotic",
    ...piece("mesh-bodysuit"),
  },
  {
    id: "ivory-bridal-set",
    name: "Ivory Pearl Bridal Set",
    category: "Bridal",
    price: 148,
    description: "Ivory lace with a pearl clasp. For the night after.",
    tag: "Bridal",
    ...piece("ivory-bridal-set"),
  },
  {
    id: "getting-ready-robe",
    name: "Pearl Getting-Ready Robe",
    category: "Bridal",
    price: 118,
    description: "Ivory silk robe for jasmine and champagne.",
    sizeChart: "nighty",
    ...piece("getting-ready-robe"),
  },
  {
    id: "emerald-bustier",
    name: "Emerald Silk Bustier",
    category: "Corsetry",
    price: 128,
    description: "Gold boning and ribbon lacing. Hourglass, not squeeze.",
    tag: "Corset",
    ...piece("emerald-bustier"),
  },
  {
    id: "ruby-waspie",
    name: "Ruby Lace Waspie",
    category: "Corsetry",
    price: 96,
    description: "A short corset in ruby lace with gold hardware.",
    ...piece("ruby-waspie"),
  },
  {
    id: "seamed-stockings",
    name: "Champagne Seamed Stockings",
    category: "Hosiery",
    price: 32,
    description: "Seamed silk with a gold garter clip.",
    ...piece("seamed-stockings"),
  },
  {
    id: "lace-holdups",
    name: "Noir Lace Hold-Ups",
    category: "Hosiery",
    price: 28,
    description: "Black lace welt, stay-up silicone.",
    ...piece("lace-holdups"),
  },
  {
    id: "lace-garter",
    name: "Noir Lace Garter",
    category: "Hosiery",
    price: 48,
    description: "Black lace with gold hardware, cut for evening.",
    ...piece("lace-garter"),
  },
  {
    id: "body-stocking",
    name: "Noir Lace Body Stocking",
    category: "Body Stockings",
    price: 42,
    description: "Sheer black lace, one-piece. Free size.",
    ...piece("body-stocking"),
  },
  {
    id: "high-waist-shaper",
    name: "High-Waist Soft Shaper",
    category: "Shapewear",
    price: 54,
    description: "Light control from waist to hip. Soft power mesh.",
    ...piece("high-waist-shaper"),
  },
  {
    id: "slip-short",
    name: "Everyday Slip Short",
    category: "Shapewear",
    price: 36,
    description: "Anti-chafe shorts for dresses and summer heat.",
    ...piece("slip-short"),
  },
  {
    id: "sculpt-midi",
    name: "Sculpt Midi Slip",
    category: "Shapewear",
    price: 62,
    description: "Champagne midi slip that smooths under silk.",
    ...piece("sculpt-midi"),
  },
  {
    id: "silk-bikini",
    name: "Ruby Silk Bikini",
    category: "Swim",
    price: 58,
    description: "Padded silk bikini, jewel-tone.",
    ...piece("silk-bikini"),
  },
  {
    id: "cloud-robe",
    name: "Cloud Knit Robe",
    category: "Loungewear",
    price: 72,
    description: "Mid-weight knit robe with a self-tie waist.",
    tag: "Lounge",
    ...piece("cloud-robe"),
  },
  {
    id: "lounge-wide-pant",
    name: "Wide-Leg Lounge Pant",
    category: "Loungewear",
    price: 58,
    description: "Relaxed modal pant with a draped, fluid line.",
    ...piece("lounge-wide-pant"),
  },
  {
    id: "silk-kaftan",
    name: "Jewel Silk Kaftan",
    category: "Resort",
    price: 132,
    description: "Emerald and gold silk, lantern-hour dressing.",
    ...piece("silk-kaftan"),
  },
  {
    id: "orchid-sarong",
    name: "Orchid Silk Sarong",
    category: "Resort",
    price: 64,
    description: "A pool of orchid silk for mosaic nights.",
    sizeChart: "free",
    ...piece("orchid-sarong"),
  },
  {
    id: "thermal-set",
    name: "Soft Thermal Set",
    category: "Thermal",
    price: 68,
    description: "Brushed thermal layering set for cooler nights.",
    ...piece("thermal-set"),
  },
  {
    id: "plum-wrap",
    name: "Plum Cashmere Wrap",
    category: "Thermal",
    price: 94,
    description: "Deep-plum wrap for lantern-lit evenings.",
    ...piece("plum-wrap"),
  },
  {
    id: "silk-eye-mask",
    name: "Champagne Silk Mask",
    category: "Accessories",
    price: 24,
    description: "Gold-embroidered sleep mask.",
    ...piece("silk-eye-mask"),
  },
  {
    id: "gold-body-chain",
    name: "Gold Body Chain",
    category: "Accessories",
    price: 54,
    description: "A delicate chain for velvet and ruby silk.",
    ...piece("gold-body-chain"),
  },
];

export const PRODUCTS_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<
  string,
  Product
>;
