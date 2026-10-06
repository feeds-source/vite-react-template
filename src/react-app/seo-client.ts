import type { Product } from "./data/catalog";
import { resolveSeo } from "./data/seo";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function applyDocumentSeo(opts: {
  view: string;
  product: Product | null;
  category?: string;
  room?: string;
}) {
  const url = new URL(window.location.href);
  if (opts.view === "product" && opts.product && !url.pathname.endsWith(`/${opts.product.id}`)) {
    url.pathname = `/shop/${opts.product.id}`;
    url.search = "";
  }
  const seo = resolveSeo(url);
  document.title = seo.title;
  setMeta("name", "description", seo.description);
  setMeta("name", "keywords", seo.keywords);
  setMeta("name", "robots", seo.robots);
  setMeta("property", "og:title", seo.title);
  setMeta("property", "og:description", seo.description);
  setMeta("property", "og:type", seo.ogType);
  setMeta("property", "og:url", seo.canonical);
  setMeta("property", "og:image", seo.image);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", seo.title);
  setMeta("name", "twitter:description", seo.description);
  setMeta("name", "twitter:image", seo.image);
  setCanonical(seo.canonical);
  const graph = { "@context": "https://schema.org", "@graph": seo.jsonLd };
  let script = document.head.querySelector("script#femme-ld");
  if (!script) {
    script = document.createElement("script");
    script.id = "femme-ld";
    script.setAttribute("type", "application/ld+json");
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(graph).replace(/</g, "\\u003c");
}
