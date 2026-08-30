import { type FormEvent, useEffect, useRef, useState } from "react";
import { searchHouse, type HouseHit, type PageHit } from "../data/search";
import type { Category, Product } from "../data/catalog";

export function SearchModal({
  open,
  initialQuery,
  onClose,
  onProduct,
  onAisle,
  onPage,
  onSubmit,
}: {
  open: boolean;
  initialQuery?: string;
  onClose: () => void;
  onProduct: (p: Product) => void;
  onAisle: (cat: Category) => void;
  onPage: (href: PageHit["href"]) => void;
  onSubmit: (q: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [hits, setHits] = useState<HouseHit>(() => searchHouse(initialQuery ?? ""));

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery ?? "");
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => setHits(searchHouse(query, 6)), 180);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(query.trim());
  }

  if (!open) return null;
  const typed = query.trim().length >= 2;
  const empty = typed && hits.products.length === 0 && hits.aisles.length === 0 && hits.pages.length === 0;

  return (
    <div id="predictive-search-modal" className="search-modal is-open" role="dialog" aria-modal="true" aria-label="Search the atelier">
      <button type="button" className="search-modal__overlay" aria-label="Close search" onClick={onClose} />
      <div className="search-modal__content">
        <div className="wrap">
          <div className="search-modal__header">
            <form role="search" className="search-form" onSubmit={submit}>
              <label htmlFor="Search-In-Modal" className="visually-hidden">
                Search products and collections
              </label>
              <div className="search-input-wrap">
                <span className="search-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  ref={inputRef}
                  id="Search-In-Modal"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search silk gowns, babydolls, bras, sizes..."
                  role="combobox"
                  aria-expanded="true"
                  aria-autocomplete="list"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="search-input"
                />
                {query ? (
                  <button
                    type="button"
                    className="search-reset"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </form>
            <button type="button" className="search-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="predictive-search-results">
            {empty ? (
              <p className="muted" style={{ padding: "1rem 0" }}>
                No pieces found matching “{query.trim()}”.
              </p>
            ) : (
              <>
                {hits.aisles.length ? (
                  <div style={{ marginBottom: "1.5rem" }}>
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
                  <div style={{ marginBottom: "1.5rem" }}>
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
                {hits.products.length ? (
                  <>
                    <p className="eyebrow">Pieces in the atelier</p>
                    <div className="predictive-grid">
                      {hits.products.map((p) => (
                        <button key={p.id} type="button" className="predictive-item" onClick={() => onProduct(p)}>
                          <img src={p.image} alt="" />
                          <span>
                            <strong>{p.name}</strong>
                            <em>${p.price.toFixed(2)}</em>
                          </span>
                        </button>
                      ))}
                    </div>
                    {typed ? (
                      <button type="button" className="text-link" style={{ marginTop: "1.25rem" }} onClick={() => onSubmit(query.trim())}>
                        See all results
                      </button>
                    ) : null}
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
