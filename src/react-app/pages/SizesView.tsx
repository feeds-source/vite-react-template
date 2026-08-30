import {
  ALPHA_ROWS,
  BRA_BANDS_CUT,
  BRA_CUPS_CUT,
  BRA_DETAIL,
  braIsCut,
  CHART_COPY,
  CORSET_ROWS,
  GOWN_ROWS,
  GUIDE_NAV,
  GUIDE_STEPS,
  HOSE_ROWS,
  INT_BAND,
  INT_CUP,
  MEASURE_MARKS,
  NIGHTY_ROWS,
  PANTIES_ROWS,
  spanIn,
  SWIM_ROWS,
} from "../data/size-guide";

function Chart({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="table-wrap">
      <table className="chart">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SizesView() {
  return (
    <>
      <section className="page-hero">
        <img className="ken" src="/banners/measure-front.jpg" alt="" />
        <div className="hero-veil" />
        <div className="page-hero-copy">
          <p className="eyebrow">Atelier fittings</p>
          <h1 className="page-title">Size charts</h1>
          <p className="lede">
            Find a size from the tape, then read the maps — bra heat, body ranges, corset lacing, hose, gowns.
          </p>
          <button type="button" className="pill" onClick={() => window.print()}>
            Print charts
          </button>
        </div>
      </section>

      <nav className="guide-nav">
        <div className="guide-nav-inner">
          {GUIDE_NAV.map((c) => (
            <a key={c.id} className="pill" href={`#${c.id}`}>
              {c.kicker}
            </a>
          ))}
        </div>
      </nav>

      <main className="page">
        <section id="finder">
          <p className="eyebrow">Fit lab</p>
          <h2 className="section-title">Find your size</h2>
          <p className="lede">
            Underbust and bust give the bra. Waist and hip vote on body, nighty, gown, and corset. Height and thigh set
            the hose.
          </p>
          <ol className="guide-steps">
            {GUIDE_STEPS.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <p className="muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="visuals">
          <p className="eyebrow">Visual charts</p>
          <h2 className="section-title">Where the tape sits</h2>
          <div className="measure-grid">
            {[
              { src: "/banners/measure-front.jpg", cap: "Front: where the tape sits" },
              { src: "/banners/measure-side.jpg", cap: "Side: bust, waist, hip" },
            ].map((fig) => (
              <figure key={fig.src} className="measure-fig">
                <img src={fig.src} alt={fig.cap} />
                {MEASURE_MARKS.map((m) => (
                  <div key={m.id} className="measure-mark" style={{ top: m.top }}>
                    <div className="gold-rule" />
                    <span>{m.label}</span>
                  </div>
                ))}
                <figcaption>{fig.cap}</figcaption>
              </figure>
            ))}
          </div>

          <p className="eyebrow" style={{ marginTop: "3rem" }}>
            Cups we cut
          </p>
          <h2 className="section-title">Bra map</h2>
          <div className="bra-heat">
            <div className="lab" />
            {BRA_CUPS_CUT.map((c) => (
              <div key={c} className="lab">
                {c}
              </div>
            ))}
            {BRA_BANDS_CUT.flatMap((band) => [
              <div key={`${band}-lab`} className="lab">{band}</div>,
              ...BRA_CUPS_CUT.map((cup) =>
                braIsCut(band, cup) ? (
                  <div key={`${band}${cup}`} className="heat-on">{band}{cup}</div>
                ) : (
                  <div key={`${band}${cup}`} className="heat-off">—</div>
                ),
              ),
            ])}
          </div>
        </section>

        <section id="convert">
          <p className="eyebrow">UK · US · EU · FR · IT · AU · PK</p>
          <h2 className="section-title">International conversion</h2>
          <p className="lede">House labels are UK/US band and XS–XXL. Match a label from another market here before you order.</p>
          <p className="eyebrow">Band</p>
          <Chart
            columns={["UK / US", "EU", "FR / ES / BE", "IT", "AU / NZ", "PK"]}
            rows={INT_BAND.map((r) => [r.ukus, r.eu, r.fr, r.it, r.au, r.pk])}
          />
          <p className="eyebrow">Cup</p>
          <Chart
            columns={["UK", "US", "EU", "FR", "Gap cm", "Gap in"]}
            rows={INT_CUP.map((r) => [r.uk, r.us, r.eu, r.fr, r.gapCm, r.gapIn])}
          />
        </section>

        <section id="bras">
          <p className="eyebrow">{CHART_COPY.bra.kicker}</p>
          <h2 className="section-title">{CHART_COPY.bra.title}</h2>
          <p className="lede">{CHART_COPY.bra.body}</p>
          <Chart
            columns={["Size", "Underbust cm", "Underbust in", "Bust cm", "Bust in", "EU", "FR", "Sisters"]}
            rows={BRA_DETAIL.map((r) => [r.size, r.underCm, r.underIn, r.bustCm, r.bustIn, r.eu, r.fr, r.sisters])}
          />
        </section>

        <section id="body">
          <p className="eyebrow">{CHART_COPY.alpha.kicker}</p>
          <h2 className="section-title">{CHART_COPY.alpha.title}</h2>
          <p className="lede">{CHART_COPY.alpha.body}</p>
          <Chart
            columns={["Size", "Bust cm", "Waist cm", "Hip cm", "UK", "US", "EU"]}
            rows={ALPHA_ROWS.map((r) => [r.size, r.bust, r.waist, r.hip, r.uk, r.us, r.eu])}
          />
          <p className="eyebrow">Panties</p>
          <Chart
            columns={["Size", "Hip cm", "Hip in", "Waist cm", "Waist in"]}
            rows={PANTIES_ROWS.map((r) => [r.size, r.hip, spanIn(r.hip), r.waist, spanIn(r.waist)])}
          />
        </section>

        <section id="night">
          <p className="eyebrow">{CHART_COPY.nighty.kicker}</p>
          <h2 className="section-title">{CHART_COPY.nighty.title}</h2>
          <p className="lede">{CHART_COPY.nighty.body}</p>
          <Chart
            columns={["Size", "Bust", "Waist", "Hip", "Length", "Note"]}
            rows={NIGHTY_ROWS.map((r) => [r.size, r.bust, r.waist, r.hip, r.length, r.note])}
          />
        </section>

        <section id="gowns">
          <p className="eyebrow">{CHART_COPY.gown.kicker}</p>
          <h2 className="section-title">{CHART_COPY.gown.title}</h2>
          <p className="lede">{CHART_COPY.gown.body}</p>
          <Chart
            columns={["Size", "Bust", "Waist", "Hip", "Length", "Height", "Note"]}
            rows={GOWN_ROWS.map((r) => [r.size, r.bust, r.waist, r.hip, r.length, r.height, r.note])}
          />
        </section>

        <section id="corset">
          <p className="eyebrow">Waspie & bustier</p>
          <h2 className="section-title">Corsetry</h2>
          <p className="lede">Size to the open waist. Closed is after lacing. Hourglass, not squeeze.</p>
          <Chart
            columns={["Size", "Waist closed", "Waist open", "Rib", "Reduction"]}
            rows={CORSET_ROWS.map((r) => [r.size, r.waistClosed, r.waistOpen, r.rib, r.reduction])}
          />
        </section>

        <section id="hose">
          <p className="eyebrow">Hold-ups & seamed</p>
          <h2 className="section-title">Hosiery</h2>
          <p className="lede">Height first, then thigh for the welt. If between, take the larger.</p>
          <Chart
            columns={["Size", "Height", "Inseam", "Thigh", "Foot"]}
            rows={HOSE_ROWS.map((r) => [r.size, r.height, r.inseam, r.thigh, r.foot])}
          />
        </section>

        <section id="swim">
          <p className="eyebrow">Bikini</p>
          <h2 className="section-title">Swim</h2>
          <p className="lede">Triangle tops follow hip for the brief, nearest cup for the top.</p>
          <Chart
            columns={["Size", "Bust", "Hip", "Nearest cup"]}
            rows={SWIM_ROWS.map((r) => [r.size, r.bust, r.hip, r.cup])}
          />
        </section>

        <section id="free">
          <p className="eyebrow">{CHART_COPY.free.kicker}</p>
          <h2 className="section-title">{CHART_COPY.free.title}</h2>
          <p className="lede">{CHART_COPY.free.body}</p>
          <Chart
            columns={["Piece", "Fits", "Bust cm", "Hip cm", "Note"]}
            rows={[
              ["Body stocking", "S–XL", "83–104", "91–112", "Stretch lace, one piece"],
              ["Sarong", "S–XXL", "—", "91–120", "Tie at the hip"],
              ["Silk mask", "All", "—", "—", "Adjustable strap"],
              ["Body chain", "S–L", "83–97", "—", "Clasp at the nape"],
            ]}
          />
        </section>

        <p className="muted">
          Between sizes? Write <a href="mailto:info@silkmoments.com">info@silkmoments.com</a>. Returns are not offered on
          worn pieces — measure first.
        </p>
      </main>
    </>
  );
}
