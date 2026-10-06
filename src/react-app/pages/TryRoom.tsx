import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, chartFor, defaultSize, PRODUCTS, sizesFor, type Category, type Product } from "../data/catalog";
import { recommendFit, type FitResult, type FitUnit } from "../data/size-guide";
import { FitView } from "./FitView";

const FIELDS = [
  ["under", "Underbust"],
  ["bust", "Bust"],
  ["waist", "Waist"],
  ["hip", "Hip"],
  ["height", "Height"],
  ["thigh", "Thigh"],
] as const;

type TapeKey = (typeof FIELDS)[number][0];
type Tape = Record<TapeKey, string>;

const EMPTY: Tape = { under: "", bust: "", waist: "", hip: "", height: "", thigh: "" };
const LADDER = ["XS", "S", "M", "L", "XL", "XXL"];

function num(raw: string) {
  const n = Number(raw.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function fromChart(product: Product, fit: FitResult) {
  const chart = chartFor(product);
  if (chart === "bra") return fit.bra ?? null;
  if (chart === "nighty") return fit.nighty ?? null;
  if (chart === "gown") return fit.gown ?? null;
  if (chart === "free") return { size: "Free Size", note: "One cut. It drapes S–XL." };
  if (product.category === "Corsetry") return fit.corset ?? fit.body ?? null;
  if (product.category === "Hosiery") return fit.hose ?? fit.body ?? null;
  if (product.category === "Swim") return fit.body ?? null;
  return fit.body ?? null;
}

function snapSize(wanted: string, run: readonly string[]) {
  if (run.includes(wanted)) return wanted;
  const at = LADDER.indexOf(wanted);
  if (at < 0) return run.includes("Free Size") ? "Free Size" : run[0];
  let best = run[0];
  let dist = 99;
  for (const size of run) {
    const i = LADDER.indexOf(size);
    if (i < 0) continue;
    const gap = Math.abs(i - at);
    if (gap < dist) {
      dist = gap;
      best = size;
    }
  }
  return best;
}

export function sizeForProduct(product: Product, fit: FitResult | null) {
  if (!fit) return "—";
  const picked = fromChart(product, fit);
  if (!picked) return "—";
  return snapSize(picked.size, sizesFor(product));
}

const LINES = CATEGORIES.filter((cat): cat is Exclude<Category, "All"> => cat !== "All")
  .map((cat) => ({ cat, products: PRODUCTS.filter((p) => p.category === cat) }))
  .filter((line) => line.products.length > 0);

export function SizeFinder({ onFit, onPick }: { onFit: (fit: FitResult | null) => void; onPick: (product: Product) => void }) {
  const [unit, setUnit] = useState<FitUnit>("cm");
  const [tape, setTape] = useState<Tape>(EMPTY);

  const fit = useMemo(() => {
    const input = {
      unit,
      under: num(tape.under),
      bust: num(tape.bust),
      waist: num(tape.waist),
      hip: num(tape.hip),
      height: num(tape.height),
      thigh: num(tape.thigh),
    };
    if (!input.under && !input.bust && !input.waist && !input.hip && !input.height && !input.thigh) return null;
    return recommendFit(input);
  }, [tape, unit]);

  useEffect(() => { onFit(fit); }, [fit, onFit]);

  const hint = fit && ((num(tape.under) && !num(tape.bust)) || (!num(tape.under) && num(tape.bust)))
    ? "Bra and bridal sizes need both underbust and bust. The other lines use what you have entered."
    : "";

  return (
    <form className="finder" onSubmit={(e) => e.preventDefault()}>
      <div className="finder-units">
        <button type="button" className={unit === "cm" ? "on" : ""} onClick={() => setUnit("cm")}>cm</button>
        <button type="button" className={unit === "in" ? "on" : ""} onClick={() => setUnit("in")}>in</button>
      </div>
      <div className="try-tape">
        {FIELDS.map(([key, label]) => (
          <label key={key}>{label}
            <input inputMode="decimal" value={tape[key]} onChange={(e) => setTape((t) => ({ ...t, [key]: e.target.value }))} />
          </label>
        ))}
      </div>
      <p className="muted try-note">Sizes update as you type, for every category and every piece.</p>
      {hint && <p className="muted try-note">{hint}</p>}
      <ul className="finder-lines">
        {LINES.map((line) => (
          <li key={line.cat}>
            <div className="finder-line-head">
              <strong>{line.cat}</strong>
              <span>{sizeForProduct(line.products[0], fit)}</span>
            </div>
            <ul>
              {line.products.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => onPick(p)}>
                    <img className="ken" src={p.image} alt="" />
                    <span>{p.name}</span>
                    <strong>{sizeForProduct(p, fit)}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </form>
  );
}

export function TryRoom({ fit, focusId, onOpen }: { fit: FitResult | null; focusId: string; onOpen: (product: Product, size: string) => void }) {
  const [product, setProduct] = useState<Product>(PRODUCTS[0]);
  const [size, setSize] = useState(defaultSize(PRODUCTS[0]));
  const [note, setNote] = useState("");
  const sizes = sizesFor(product);

  useEffect(() => {
    const next = PRODUCTS.find((p) => p.id === focusId);
    if (next) setProduct(next);
  }, [focusId]);

  useEffect(() => {
    if (!fit) return;
    const picked = fromChart(product, fit);
    if (!picked) {
      setNote("This piece needs a measurement you have not entered yet.");
      return;
    }
    const worn = snapSize(picked.size, sizesFor(product));
    setSize(worn);
    setNote(worn === picked.size ? `${worn}. ${picked.note}` : `${picked.size} is not cut here. Nearest is ${worn}.`);
  }, [fit, product]);

  return (
    <section id="try">
      <p className="eyebrow">Virtual try room</p>
      <h2 className="section-title">Try a live piece</h2>
      <p className="lede">The size on each piece is the one Find size just calculated.</p>
      <div className="try-layout">
        <div>
          {note && <p className="try-note">{note}</p>}
          <div className="try-products" aria-label="Live products">
            {PRODUCTS.map((p) => (
              <button key={p.id} type="button" className={p.id === product.id ? "on" : ""} onClick={() => setProduct(p)}>
                <span className="try-still">
                  <img className="ken" src={p.image} alt="" />
                  {p.id === product.id && p.video ? (
                    <video className="motion-video" autoPlay muted loop playsInline poster={p.image}>
                      <source src={p.video} type="video/mp4" />
                    </video>
                  ) : null}
                </span>
                <span>{p.name}</span>
                <em>{sizeForProduct(p, fit)}</em>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="pdp-frame">
            <img className="ken" src={product.image} alt={product.name} />
            {product.video ? (
              <video className="motion-video" autoPlay muted loop playsInline poster={product.image}>
                <source src={product.video} type="video/mp4" />
              </video>
            ) : null}
          </div>
          <FitView product={product} size={size} sizes={sizes} onSize={setSize} />
          <button type="button" className="cta" onClick={() => onOpen(product, size)}>Open {product.name}</button>
        </div>
      </div>
    </section>
  );
}
