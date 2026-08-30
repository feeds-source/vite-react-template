import { AISLES } from "./banners";
import { CATEGORIES, PRODUCTS, type Category, type Product } from "./catalog";
import { CAT_HERO } from "./house";

export type AisleHit = {
  cat: Category;
  title: string;
  image: string;
};

export type PageHit = {
  title: string;
  href: "/size-guide" | "/atelier" | "/contact";
  kicker: string;
};

export type HouseHit = {
  products: Product[];
  aisles: AisleHit[];
  pages: PageHit[];
};

const PAGES: Array<PageHit & { terms: string }> = [
  {
    title: "Size guide",
    href: "/size-guide",
    kicker: "Fit",
    terms: "size sizes fit chart measure band cup sister bra 30b 32b 34c",
  },
  {
    title: "The atelier",
    href: "/atelier",
    kicker: "House",
    terms: "atelier about house craft silk story femme",
  },
  {
    title: "Contact",
    href: "/contact",
    kicker: "House",
    terms: "contact email write atelier",
  },
];

const EXTRA: Record<string, string> = {
  bras: "bra bralette cup balconette t-shirt",
  "bra sets": "bra set balconette pair",
  panties: "panty brief thong hipster brazilian",
  camisole: "cami lace",
  babydoll: "baby doll nighty nightie short lace",
  "short nighty": "nightie night cami satin sleep",
  "long nighty": "nightie slip gown sleep silk",
  gowns: "gown robe satin floor",
  teddies: "teddy body",
  bridal: "ivory wedding robe getting ready",
  corsetry: "corset bustier waspie boning",
  hosiery: "stocking stayup holdup hose thigh",
  "body stockings": "bodystocking sheer body",
  shapewear: "shaper sculpt waist",
  swim: "bikini beach resort",
  loungewear: "lounge robe kimono pant",
  resort: "kaftan sarong wrap beach",
  thermal: "warm sleep set",
  accessories: "mask chain jewelry",
};

function fold(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function score(haystack: string, query: string, tokens: string[]) {
  const t = fold(haystack);
  if (!t) return 0;
  if (t === query) return 100;
  if (t.startsWith(query)) return 80;
  if (` ${t} `.includes(` ${query} `)) return 70;
  if (t.includes(query)) return 50;
  const hits = tokens.filter((tok) => t.includes(tok));
  if (hits.length === tokens.length && tokens.length > 0) return 32 + hits.length * 4;
  if (hits.length) return hits.length * 8;
  return 0;
}

export function searchHouse(raw: string, limit = 6): HouseHit {
  const query = fold(raw);
  if (query.length < 2) {
    return {
      products: [],
      aisles: AISLES.map((a) => ({ cat: a.cat as Category, title: a.title, image: a.image })),
      pages: [],
    };
  }
  const tokens = query.split(/\s+/).filter(Boolean);

  const products = PRODUCTS.map((p) => {
    const extra = EXTRA[fold(p.category)] ?? "";
    const s = Math.max(
      score(p.name, query, tokens) * 2,
      score(p.category, query, tokens),
      score(p.description, query, tokens),
      score(p.tag ?? "", query, tokens),
      score(p.id.replace(/-/g, " "), query, tokens),
      score(extra, query, tokens) * 0.6,
    );
    return { p, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);

  const seen = new Set<string>();
  const aisles: AisleHit[] = [];
  const pushAisle = (cat: Category, title: string, image: string, s: number) => {
    if (s <= 0 || seen.has(cat)) return;
    seen.add(cat);
    aisles.push({ cat, title, image });
  };

  for (const a of AISLES) {
    const hero = CAT_HERO[a.cat];
    const extra = EXTRA[fold(a.cat)] ?? "";
    const s = Math.max(
      score(a.cat, query, tokens) * 2,
      score(a.title, query, tokens),
      score(hero?.body ?? "", query, tokens),
      score(extra, query, tokens),
    );
    pushAisle(a.cat as Category, a.title, a.image, s);
  }
  for (const c of CATEGORIES) {
    if (c === "All") continue;
    const hero = CAT_HERO[c];
    const extra = EXTRA[fold(c)] ?? "";
    const s = Math.max(score(c, query, tokens) * 2, score(hero?.body ?? "", query, tokens), score(extra, query, tokens));
    pushAisle(c as Category, c, hero?.image ?? "", s);
  }

  const pages = PAGES.filter((p) => score(`${p.title} ${p.terms}`, query, tokens) > 0).map(
    ({ title, href, kicker }) => ({ title, href, kicker }),
  );

  return { products, aisles: aisles.slice(0, 8), pages };
}
