import { CATALOG } from "./catalog";

const SITE = "https://www.silkmoments.com";
const ROOMS = ["Sleep", "Lingerie", "Lounge"];
const CATEGORIES = [
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
];

function escapeXml(value: string) {
  const amp = String.fromCharCode(38);
  return value
    .replace(/&/g, amp + "amp;")
    .replace(/</g, amp + "lt;")
    .replace(/>/g, amp + "gt;")
    .replace(/"/g, amp + "quot;");
}

function loc(path: string) {
  return escapeXml(`${SITE}${path}`);
}

export function buildSitemapXml(lastmod = new Date().toISOString().slice(0, 10)) {
  const urls: { path: string; changefreq: string; priority: string }[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/shop", changefreq: "daily", priority: "0.9" },
    { path: "/atelier", changefreq: "monthly", priority: "0.5" },
    { path: "/size-guide", changefreq: "monthly", priority: "0.6" },
    { path: "/contact", changefreq: "yearly", priority: "0.3" },
  ];
  for (const room of ROOMS) urls.push({ path: `/shop?room=${encodeURIComponent(room)}`, changefreq: "weekly", priority: "0.8" });
  for (const cat of CATEGORIES) urls.push({ path: `/shop?cat=${encodeURIComponent(cat)}`, changefreq: "weekly", priority: "0.7" });
  for (const p of CATALOG) urls.push({ path: `/shop/${p.id}`, changefreq: "weekly", priority: "0.8" });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (e) => `  <url>
    <loc>${loc(e.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

export function buildRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /cart
Disallow: /checkout
Disallow: /login
Disallow: /register
Disallow: /account
Disallow: /admin
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`;
}
