import type { ReactNode } from "react";
import { AISLES, CAMPAIGNS } from "../data/banners";
import { CATEGORIES } from "../data/catalog";
import { ROOMS, type Room } from "../data/footer";
import { CAT_HERO } from "../data/house";

export function ShopView({
  category,
  room,
  count,
  productGrid,
  onCat,
  onRoom,
  onSizes,
}: {
  category: (typeof CATEGORIES)[number];
  room?: Room | "";
  count: number;
  productGrid: ReactNode;
  onCat: (c: (typeof CATEGORIES)[number]) => void;
  onRoom: (room: Room) => void;
  onSizes: () => void;
}) {
  const campaign = room ? CAMPAIGNS.find((c) => c.room === room) : null;
  const hero = category !== "All" ? CAT_HERO[category] : campaign
    ? { image: campaign.poster, video: campaign.video, kicker: campaign.kicker, body: campaign.title }
    : CAT_HERO.All;
  const title = category !== "All" ? category : room || "Shop the house";
  const activeRoom: Room | "" = room || (category !== "All" ? (Object.keys(ROOMS) as Room[]).find((r) => (ROOMS[r] as readonly string[]).includes(category)) ?? "" : "");
  const roomCats = activeRoom ? ROOMS[activeRoom] : [];
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

      {category === "All" && !room ? (
        <section className="page">
          <p className="eyebrow">The House</p>
          <h2 className="page-title">Walk the house</h2>
          <div className="aisle-grid">
            {AISLES.map((a) => (
              <button key={a.cat} type="button" className="aisle" onClick={() => onCat(a.cat)}>
                <img className="ken" src={a.image} alt="" />
                <video className="motion-video" autoPlay muted loop playsInline poster={a.image}>
                  <source src={a.image.replace(/\.jpg$/, ".mp4")} type="video/mp4" />
                </video>
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
          {(Object.keys(ROOMS) as Room[]).map((r) => (
            <button key={r} type="button" className={activeRoom === r && category === "All" ? "pill is-on" : "pill"} onClick={() => onRoom(r)}>
              {r === "Lingerie" ? "Lingerie" : r}
            </button>
          ))}
        </div>
      </nav>
      {roomCats.length > 0 && (
        <nav className="guide-nav">
          <div className="guide-nav-inner">
            {roomCats.map((c) => (
              <button key={c} type="button" className={category === c ? "pill is-on" : "pill"} onClick={() => onCat(c)}>
                {c}
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="page">
        <div className="catalog-head">
          <p className="muted">
            {count} {count === 1 ? "piece" : "pieces"}
            {category !== "All" ? ` in ${category}` : room ? ` in ${room}` : " in the atelier"}
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
