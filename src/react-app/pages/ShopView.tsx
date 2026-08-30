import type { ReactNode } from "react";
import { AISLES } from "../data/banners";
import { CATEGORIES } from "../data/catalog";
import { CAT_HERO } from "../data/house";

export function ShopView({
  category,
  count,
  productGrid,
  onCat,
  onSizes,
}: {
  category: (typeof CATEGORIES)[number];
  count: number;
  productGrid: ReactNode;
  onCat: (c: (typeof CATEGORIES)[number]) => void;
  onSizes: () => void;
}) {
  const hero = CAT_HERO[category];
  const title = category === "All" ? "Shop the house" : category;
  return (
    <>
      <section className="page-hero">
        <img className="ken" src={hero.image} alt="" />
        {hero.video ? (
          <video className="motion-video" autoPlay muted loop playsInline poster={hero.image}>
            <source src={hero.video} type="video/mp4" />
          </video>
        ) : null}
        <div className="hero-veil" />
        <div className="page-hero-copy">
          <p className="eyebrow">{hero.kicker}</p>
          <h1 className="page-title">{title}</h1>
          <p className="lede">{hero.body}</p>
        </div>
      </section>

      {category === "All" ? (
        <section className="page">
          <p className="eyebrow">Aisles</p>
          <h2 className="page-title">Walk the house</h2>
          <div className="aisle-grid">
            {AISLES.map((a) => (
              <button key={a.cat} type="button" className="aisle" onClick={() => onCat(a.cat)}>
                <img src={a.image} alt="" />
                <div className="hero-veil" />
                <span>
                  <em>{a.cat}</em>
                  <b>{a.title}</b>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <nav className="guide-nav">
        <div className="guide-nav-inner">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className={category === c ? "pill is-on" : "pill"} onClick={() => onCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </nav>

      <main className="page">
        <div className="catalog-head">
          <p className="muted">
            {count} {count === 1 ? "piece" : "pieces"}
            {category !== "All" ? ` in ${category}` : " in the atelier"}
          </p>
          <button type="button" className="text-link" onClick={onSizes}>
            Size charts
          </button>
        </div>
        {count === 0 ? <p className="muted">No pieces in this aisle yet.</p> : productGrid}
      </main>
    </>
  );
}
