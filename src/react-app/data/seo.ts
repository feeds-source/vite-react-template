import { CATEGORIES, PRODUCTS, categoryFromSlug, categoryPath, type Product } from "./catalog";

export const SITE_NAME = "Femme — Silk Moments";
export const SITE_URL = "https://www.silkmoments.com";

export const HOUSE_KEYWORDS =
  "silk lingerie, jewel tone lingerie, wireless bralette, seamless underwear, leakproof brief, sleep set, half slip, silk robe, silk babydoll, lace teddy, silk nightgown, bridal lingerie, t-shirt bra, balconette set, silk slip, satin gown, silk bustier, lace waspie, seamed stockings, shapewear, silk kaftan, cashmere wrap, silk sleep mask, cash on delivery lingerie, Femme Silk Moments, exotic silk";

export const HOUSE_DESCRIPTION =
  "Femme by Silk Moments — jewel-tone silk lingerie, lace babydolls, teddies, bridal robes, and lounge. Cash on delivery worldwide with discreet packaging.";

export const HOUSE_TITLE = "Femme — Silk Moments | Silk lingerie, night & lounge";

/** Shopper queries — not OEM / factory terms. */
export const PRODUCT_KEYWORDS: Record<string, string> = {
  "everyday-soft-bra": "wireless soft cup bra, t-shirt wireless bra, modal microfiber everyday bra",
  "ultimate-tshirt-bra": "molded cup t-shirt bra, seamless tshirt bra, one-piece molded bra",
  "first-fit-teen-bra": "stretch lace bralette, first bra wireless bralette, lace bralette",
  "lace-balconette-set": "lace balconette bra and panty set, 2 piece lingerie set, eyelash lace balconette",
  "daily-hipster": "modal hipster panty, mid rise brief, modal jersey underwear",
  "seamless-thong": "seamless thong, laser cut panty, no-show thong",
  "ruby-brazilian": "silk brazilian panty, satin brief gold trim, jewel tone silk underwear",
  "lace-camisole": "stretch lace camisole, lace cami top, champagne lace undershirt",
  "ruby-babydoll": "ruby lace babydoll set, short lace chemise, 2 piece babydoll",
  "satin-night-set": "satin cami shorts pajama set, satin tap short night set, 2 piece satin sleepwear",
  "short-lace-nighty": "sheer lace nightgown, short lace chemise, transparent lace nighty",
  "silk-night-slip": "silk night slip, floor length silk chemise, champagne silk nightdress",
  "satin-gown": "black satin nightgown, floor length satin gown, long satin sleep gown",
  "noir-teddy": "black lace teddy, one piece lace bodysuit lingerie, eyelash lace teddy",
  "emerald-teddy": "silk teddy, emerald silk bodysuit, gold lace trim teddy",
  "mesh-bodysuit": "mesh contour bodysuit, sculpting mesh teddy, power mesh lingerie bodysuit",
  "ivory-bridal-set": "ivory bridal lingerie set, pearl clasp lace bra panty, wedding night lingerie set",
  "getting-ready-robe": "ivory silk bridal robe, getting ready robe, satin charmeuse wedding robe",
  "emerald-bustier": "silk bustier, boned bustier corset, lace up silk corset",
  "ruby-waspie": "lace waspie corset, short underbust corset, waspie with gold hardware",
  "seamed-stockings": "seamed stockings, back seam silk look hosiery, vintage seamed stockings",
  "lace-holdups": "lace hold ups, silicone welt stay-up stockings, lace top holdups",
  "lace-garter": "lace garter belt, 4 strap garter, gold hardware garter belt",
  "body-stocking": "lace body stocking, sheer bodystocking, one piece lace catsuit",
  "high-waist-shaper": "high waist shaper, light control shapewear brief, power mesh tummy shaper",
  "slip-short": "anti chafe slip short, dress short liner, shapewear slip shorts",
  "sculpt-midi": "midi shapewear slip, smoothing half slip, champagne underdress slip",
  "silk-bikini": "silk bikini set, padded satin bikini, jewel tone two piece swimwear",
  "cloud-robe": "knit lounge robe, mid weight dressing gown, self tie knit robe",
  "lounge-wide-pant": "modal wide leg lounge pant, draped palazzo lounge, modal sleep pant",
  "silk-kaftan": "silk kaftan, jewel tone caftan, silk resort cover up",
  "orchid-sarong": "silk sarong, satin wrap skirt, resort sarong",
  "thermal-set": "brushed thermal pajama set, waffle thermal lounge set, winter layering set",
  "plum-wrap": "cashmere wrap, merino cashmere shawl, knitted wrap",
  "silk-eye-mask": "silk sleep mask, embroidered eye mask, mulberry silk sleep mask",
  "gold-body-chain": "gold body chain, body jewelry, gold plated body chain",
  "cloud-bralette": "wireless bralette, comfort bralette, unwired lace bra",
  "invisible-brief": "seamless brief, no show underwear, invisible panty",
  "champagne-sleep-set": "satin pajama set, sleep set cami shorts, matching lounge set",
  "atelier-slip": "half slip, strapless slip, slip dress underdress",
  "silk-leakproof": "leakproof underwear, period brief, stay dry panty",
  "studio-bra": "wireless sports bra, studio bra, light support active bra",
  "noir-robe": "silk robe, lounge robe, dressing gown",
};

export function keywordsFor(id: string) {
  return PRODUCT_KEYWORDS[id] ?? HOUSE_KEYWORDS;
}

export function productTitle(name: string) {
  return `${name} | ${SITE_NAME}`;
}

export function productDescription(p: Pick<Product, "name" | "description" | "category">) {
  return `${p.name} — ${p.description} ${p.category} in jewel silk and lace. Cash on delivery worldwide.`;
}

export function shopTitle(aisle?: string) {
  if (!aisle || aisle === "All") return `Shop silk lingerie | ${SITE_NAME}`;
  return `${aisle} | ${SITE_NAME}`;
}

export function shopDescription(aisle?: string) {
  if (!aisle || aisle === "All") {
    return "Shop the house: silk bras, lace babydolls, teddies, nightgowns, bridal robes, and lounge. Cash on delivery worldwide.";
  }
  return `${aisle} from Femme by Silk Moments — jewel-tone silk and lace. Cash on delivery worldwide.`;
}

export function productJsonLd(p: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: productDescription(p),
    image: `${SITE_URL}${p.image}`,
    sku: p.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: p.category,
    keywords: keywordsFor(p.id),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${p.id}`,
      priceCurrency: "USD",
      price: p.price.toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };
}

export function houseJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: SITE_NAME,
    url: SITE_URL,
    description: HOUSE_DESCRIPTION,
    keywords: HOUSE_KEYWORDS,
    brand: SITE_NAME,
  };
}

export function productHead(p: Product | undefined) {
  if (!p) {
    return {
      meta: [
        { title: `Piece not found | ${SITE_NAME}` },
        { name: "description", content: HOUSE_DESCRIPTION },
        { name: "robots", content: "noindex" },
      ],
    };
  }
  const title = productTitle(p.name);
  const description = productDescription(p);
  const keywords = keywordsFor(p.id);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { property: "og:image", content: `${SITE_URL}${p.image}` },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  };
}

const FAQ = [
  {
    q: "What is Femme by Silk Moments?",
    a: "Femme is the Silk Moments house of jewel-tone silk lingerie, lace babydolls, teddies, bridal robes, and lounge.",
  },
  {
    q: "Does Femme offer cash on delivery?",
    a: "Yes. Femme ships cash on delivery worldwide, packed discreetly.",
  },
  {
    q: "What sizes does Femme cut?",
    a: "Bras are cut 30B–42C. Night, lounge, robes, and slips run XS–XXL. Charts are at https://www.silkmoments.com/size-guide.",
  },
  {
    q: "How do I contact the atelier?",
    a: "Write to info@silkmoments.com or use https://www.silkmoments.com/contact.",
  },
];

export type SeoDoc = {
  title: string;
  description: string;
  keywords: string;
  robots: string;
  canonical: string;
  ogType: string;
  image: string;
  jsonLd: Record<string, unknown>[];
};

function faqLd() {
  return {
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function websiteLd() {
  return {
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: HOUSE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function storeLd() {
  return {
    "@type": "ClothingStore",
    name: SITE_NAME,
    url: SITE_URL,
    description: HOUSE_DESCRIPTION,
    email: "info@silkmoments.com",
    image: `${SITE_URL}/og.jpg`,
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card",
    areaServed: "Worldwide",
  };
}

function crumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

function productLd(p: Product) {
  return {
    "@type": "Product",
    name: p.name,
    description: productDescription(p),
    image: `${SITE_URL}${p.image}`,
    sku: p.id,
    category: p.category,
    brand: { "@type": "Brand", name: "Femme — Silk Moments" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/shop/${p.id}`,
      priceCurrency: "USD",
      price: p.price.toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

export function resolveSeo(url: URL): SeoDoc {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const room = url.searchParams.get("room") || "";
  const q = url.searchParams.get("q") || "";
  const privatePath = ["/cart", "/checkout", "/login", "/register", "/account", "/admin"].includes(path);
  const image = `${SITE_URL}/og.jpg`;
  const base: SeoDoc = {
    title: HOUSE_TITLE,
    description: HOUSE_DESCRIPTION,
    keywords: HOUSE_KEYWORDS,
    robots: privatePath ? "noindex, nofollow" : "index, follow",
    canonical: `${SITE_URL}${path === "/" ? "/" : path}`,
    ogType: "website",
    image,
    jsonLd: [storeLd(), websiteLd(), faqLd()],
  };
  if (privatePath) return base;

  if (path === "/search") {
    base.title = q ? `Search: ${q} | ${SITE_NAME}` : `Search the house | ${SITE_NAME}`;
    base.description = q
      ? `Pieces in the Femme house matching “${q}”. Silk lingerie, night, and lounge.`
      : "Search silk gowns, babydolls, bras, and the size studio.";
    base.canonical = q ? `${SITE_URL}/search?q=${encodeURIComponent(q)}` : `${SITE_URL}/search`;
    return base;
  }
  if (path === "/size-guide" || path === "/sizes") {
    base.title = `Size charts | ${SITE_NAME}`;
    base.description = "Bra, nighty, gown, and corset size charts. Find 30B–42C and XS–XXL with sister sizes.";
    base.keywords = "lingerie size chart, bra size guide, 30B 32B 34C, sister size, nighty size chart";
    base.canonical = `${SITE_URL}/size-guide`;
    return base;
  }
  if (path === "/atelier" || path === "/about") {
    base.title = `The Atelier | ${SITE_NAME}`;
    base.description = "The Femme atelier — exotic silk, cut for the body. Emerald, champagne, and ruby lingerie, night, and lounge.";
    base.keywords = "silk atelier, femme silk moments, jewel silk, exotic silk lingerie";
    base.canonical = `${SITE_URL}/atelier`;
    return base;
  }
  if (path === "/contact") {
    base.title = `Contact | ${SITE_NAME}`;
    base.description = "Write to the Femme atelier. Orders, fit, and house notes — info@silkmoments.com.";
    base.keywords = "contact silk moments, femme atelier email, silk lingerie support";
    return base;
  }
  if (path === "/shop" || path.startsWith("/shop/")) {
    const slug = path.startsWith("/shop/") ? decodeURIComponent(path.slice("/shop/".length)) : "";
    const product = slug ? PRODUCTS.find((p) => p.id === slug) : undefined;
    if (product) {
      base.title = productTitle(product.name);
      base.description = productDescription(product);
      base.keywords = keywordsFor(product.id);
      base.ogType = "product";
      base.image = `${SITE_URL}${product.image}`;
      base.canonical = `${SITE_URL}/shop/${product.id}`;
      base.jsonLd = [
        productLd(product),
        crumbs([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: product.category, path: categoryPath(product.category) },
          { name: product.name, path: `/shop/${product.id}` },
        ]),
      ];
      return base;
    }
    const fromSlug = slug ? categoryFromSlug(slug) : null;
    const aisle = fromSlug || (room && ["Sleep", "Lingerie", "Lounge"].includes(room) ? room : "All");
    base.title = shopTitle(aisle);
    base.description = shopDescription(aisle);
    base.keywords = `${aisle}, silk lingerie, Femme Silk Moments, cash on delivery lingerie`;
    base.canonical = fromSlug ? `${SITE_URL}${categoryPath(fromSlug)}` : room ? `${SITE_URL}/shop?room=${encodeURIComponent(room)}` : `${SITE_URL}/shop`;
    const pieces = PRODUCTS.filter((p) => (fromSlug ? p.category === fromSlug : room ? p.category && CATEGORIES.includes(p.category) : true)).slice(0, 24);
    const inAisle = fromSlug
      ? PRODUCTS.filter((p) => p.category === fromSlug)
      : room === "Sleep"
        ? PRODUCTS.filter((p) => ["Babydoll", "Short Nighty", "Long Nighty", "Sleep Sets", "Slips", "Gowns", "Teddies", "Robes"].includes(p.category))
        : room === "Lingerie"
          ? PRODUCTS.filter((p) => ["Bras", "Bralettes", "Bra Sets", "Panties", "Seamless", "Leakproof", "Active", "Camisole", "Corsetry", "Hosiery", "Body Stockings", "Shapewear"].includes(p.category))
          : room === "Lounge"
            ? PRODUCTS.filter((p) => ["Bridal", "Swim", "Loungewear", "Resort", "Thermal", "Accessories"].includes(p.category))
            : pieces;
    base.jsonLd = [
      {
        "@type": "CollectionPage",
        name: base.title,
        description: base.description,
        url: base.canonical,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: inAisle.slice(0, 24).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/shop/${p.id}`,
            name: p.name,
          })),
        },
      },
      crumbs([
        { name: "Home", path: "/" },
        { name: aisle === "All" ? "Shop" : aisle, path: fromSlug ? categoryPath(fromSlug) : "/shop" },
      ]),
    ];
    return base;
  }
  if (path !== "/") {
    base.robots = "noindex, follow";
    base.title = HOUSE_TITLE;
  }
  return base;
}

export function buildLlmsTxt() {
  const cats = CATEGORIES.filter((c) => c !== "All");
  const lines = [
    "# Femme — Silk Moments",
    "",
    "> Jewel-tone silk lingerie, lace babydolls, teddies, bridal robes, and lounge. Cash on delivery worldwide, in discreet packaging.",
    "",
    "Femme is an adult house. Bras are cut 30B–42C. Night, lounge, and robes run XS–XXL. Prices are in USD.",
    "",
    "## Answers",
    ...FAQ.flatMap((item) => [`- ${item.q}`, `  ${item.a}`]),
    "",
    "## House",
    `- [Home](${SITE_URL}/): the house`,
    `- [Shop](${SITE_URL}/shop): every piece`,
    `- [The Atelier](${SITE_URL}/atelier): how the house is cut`,
    `- [Size guide](${SITE_URL}/size-guide): 30B–42C and XS–XXL`,
    `- [Contact](${SITE_URL}/contact): info@silkmoments.com`,
    "",
    "## Categories",
    ...cats.map((c) => `- [${c}](${SITE_URL}${categoryPath(c)})`),
    "",
    "## Pieces",
    ...PRODUCTS.map((p) => `- [${p.name}](${SITE_URL}/shop/${p.id}): $${p.price} — ${p.category}. ${p.description}`),
    "",
  ];
  return lines.join("\n");
}
