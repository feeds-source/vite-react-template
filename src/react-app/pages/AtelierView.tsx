import type { Category } from "../data/catalog";
import { ATELIER_CRAFT, ATELIER_LOOK, ATELIER_ROOMS } from "../data/house";

export function AtelierView({
  onShop,
  onSizes,
}: {
  onShop: (cat?: Category | "All") => void;
  onSizes: () => void;
}) {
  return (
    <>
      <section className="page-hero cine-page">
        <img className="ken" src="/banners/hero.jpg" alt="" />
        <video className="motion-video" autoPlay muted loop playsInline poster="/banners/hero.jpg">
          <source src="/banners/hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-veil" />
        <div className="page-hero-copy">
          <p className="eyebrow">House</p>
          <h1 className="page-title">The atelier</h1>
          <p className="lede">Exotic silk, cut for the body. Emerald, champagne, ruby — still-life, then motion.</p>
          <button type="button" className="cta" onClick={() => onShop()}>
            Shop the house
          </button>
        </div>
      </section>

      <section className="page split-intro">
        <div>
          <p className="eyebrow">Femme</p>
          <h2 className="page-title">An adult house of jewel silk.</h2>
        </div>
        <div>
          <p className="lede">
            Femme is Silk Moments after dusk: lingerie, night, and lounge. Banners that breathe, fabric that moves.
            Every still is shot as a painting, then the film starts.
          </p>
          <p className="lede">
            Pieces are cut for 30B–42C and Free Size to XXL. Cash on delivery worldwide. A printable receipt at every
            order.
          </p>
          <p className="muted">
            Returns are not offered on worn pieces — measure first, then write{" "}
            <a className="text-link" href="mailto:info@silkmoments.com">
              info@silkmoments.com
            </a>
            .
          </p>
        </div>
      </section>

      <section className="page">
        <p className="eyebrow">Three rooms</p>
        <h2 className="page-title">Walk the house</h2>
        <div className="room-grid">
          {ATELIER_ROOMS.map((room) => (
            <article key={room.title} className="room-card">
              <div className="room-media">
                <img className="ken" src={room.image} alt="" />
                {"video" in room && room.video ? (
                  <video className="motion-video" autoPlay muted loop playsInline poster={room.image}>
                    <source src={room.video} type="video/mp4" />
                  </video>
                ) : null}
                <div className="hero-veil" />
                <div className="room-copy">
                  <p className="eyebrow">{room.kicker}</p>
                  <h3>{room.title}</h3>
                </div>
              </div>
              <p className="muted">{room.body}</p>
              <div className="nav-cats">
                {room.cats.map((c) => (
                  <button key={c} type="button" className="pill" onClick={() => onShop(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page">
        <p className="eyebrow">How we cut</p>
        <h2 className="page-title">Silk, lace, gold</h2>
        <div className="craft-grid">
          {ATELIER_CRAFT.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="account-actions" style={{ marginTop: "2rem" }}>
          <button type="button" className="cta ghost" onClick={onSizes}>
            Size charts
          </button>
          <p className="muted">Tape snug, stand easy. Charts are the atelier starting point.</p>
        </div>
      </section>

      <section className="page">
        <p className="eyebrow">Lookbook</p>
        <h2 className="page-title">Still-life, then motion</h2>
        <div className="lookbook">
          {ATELIER_LOOK.map((shot) => (
            <figure key={shot.src} className="look-card">
              <img className="ken" src={shot.src} alt="" />
              {"video" in shot && shot.video ? (
                <video className="motion-video" autoPlay muted loop playsInline poster={shot.src}>
                  <source src={shot.video} type="video/mp4" />
                </video>
              ) : null}
              <figcaption>{shot.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="page-hero cine-page">
        <img className="ken" src="/banners/lounge.jpg" alt="" />
        <div className="hero-veil" />
        <div className="page-hero-copy">
          <p className="eyebrow">Cash on delivery</p>
          <h2 className="page-title">Worldwide. A receipt you can print.</h2>
          <p className="lede">
            Confirm the bag, we pack in a gift box, you pay when it arrives. Tracking once the atelier dispatches.
          </p>
          <button type="button" className="cta" onClick={() => onShop()}>
            Shop the house
          </button>
        </div>
      </section>
    </>
  );
}
