import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { searchHouse, type AisleHit, type PageHit } from "../data/search";

export function SearchView({
  query,
  onQuery,
  onAisle,
  onPage,
  children,
}: {
  query: string;
  onQuery: (q: string) => void;
  onAisle: (cat: AisleHit["cat"]) => void;
  onPage: (href: PageHit["href"]) => void;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState(query);
  const hits = searchHouse(query, 48);
  const typed = query.trim().length >= 2;
  const title = typed ? query.trim() : "The house";

  useEffect(() => {
    setDraft(query);
  }, [query]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onQuery(draft.trim());
  }

  return (
    <>
      <section className="page-hero">
        <img className="ken" src="/banners/lounge.jpg" alt="" />
        <div className="hero-veil" />
        <div className="page-hero-copy">
          <p className="eyebrow">Search</p>
          <h1 className="page-title">{title}</h1>
          <p className="lede">
            {typed
              ? `${hits.products.length} ${hits.products.length === 1 ? "piece" : "pieces"} matching the house.`
              : "Silk gowns, babydolls, bras, and the size studio."}
          </p>
        </div>
      </section>

      <main className="page">
        <form role="search" className="search-page-form" onSubmit={submit}>
          <label className="search-input-wrap">
            <span className="visually-hidden">Search the atelier</span>
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              className="search-input"
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search silk gowns, babydolls, bras, sizes..."
            />
          </label>
          <button type="submit" className="cta">
            Search
          </button>
        </form>

        {hits.aisles.length ? (
          <div className="search-block">
            <p className="eyebrow">Aisles & collections</p>
            <div className="search-pills">
              {hits.aisles.map((a) => (
                <button key={a.cat} type="button" className="pill" onClick={() => onAisle(a.cat)}>
                  {a.cat}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {hits.pages.length ? (
          <div className="search-block">
            <p className="eyebrow">House</p>
            <div className="search-pills">
              {hits.pages.map((p) => (
                <button key={p.href} type="button" className="pill" onClick={() => onPage(p.href)}>
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="catalog-head" style={{ marginTop: "2rem" }}>
          <p className="muted">
            {typed
              ? hits.products.length
                ? `${hits.products.length} ${hits.products.length === 1 ? "piece" : "pieces"}`
                : `No pieces found matching “${query.trim()}”.`
              : "Type two letters to search the atelier."}
          </p>
        </div>
        {children}
      </main>
    </>
  );
}
