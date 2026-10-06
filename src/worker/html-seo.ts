import { buildLlmsTxt, resolveSeo, type SeoDoc } from "../react-app/data/seo";

function esc(value: string) {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/"/g, "\u0026quot;")
    .replace(/</g, "\u0026lt;");
}

function upsertMeta(html: string, attr: "name" | "property", key: string, content: string) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`, "i");
  if (re.test(html)) return html.replace(re, `$1${esc(content)}$2`);
  return html.replace("</head>", `<meta ${attr}="${key}" content="${esc(content)}">\n</head>`);
}

export function injectDocumentSeo(html: string, seo: SeoDoc) {
  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(seo.title)}</title>`);
  out = upsertMeta(out, "name", "description", seo.description);
  out = upsertMeta(out, "name", "keywords", seo.keywords);
  out = upsertMeta(out, "name", "robots", seo.robots);
  out = upsertMeta(out, "property", "og:title", seo.title);
  out = upsertMeta(out, "property", "og:description", seo.description);
  out = upsertMeta(out, "property", "og:type", seo.ogType);
  out = upsertMeta(out, "property", "og:url", seo.canonical);
  out = upsertMeta(out, "property", "og:image", seo.image);
  out = upsertMeta(out, "name", "twitter:title", seo.title);
  out = upsertMeta(out, "name", "twitter:description", seo.description);
  out = upsertMeta(out, "name", "twitter:image", seo.image);
  out = out.replace(/<link rel="canonical" href="[^"]*">/i, "");
  const graph = JSON.stringify({ "@context": "https://schema.org", "@graph": seo.jsonLd }).replace(/</g, "\\u003c");
  const block = `<link rel="canonical" href="${esc(seo.canonical)}">\n<script type="application/ld+json" id="femme-ld">${graph}</script>\n`;
  return out.replace("</head>", `${block}</head>`);
}

export function seoForRequest(url: URL) {
  return resolveSeo(url);
}

export { buildLlmsTxt };
