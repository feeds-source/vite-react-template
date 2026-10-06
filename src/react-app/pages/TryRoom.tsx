import { useState } from "react";
import { chartFor, defaultSize, PRODUCTS, sizesFor, type Product } from "../data/catalog";
import { recommendFit, type FitResult } from "../data/size-guide";
import { FitView } from "./FitView";

function num(raw: string) {
  const n = Number(raw);
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
  return fit.body ?? null;
}

export function TryRoom({ onOpen }: { onOpen: (product: Product, size: string) => void }) {
  const [product, setProduct] = useState<Product>(PRODUCTS[0]);
  const [size, setSize] = useState(defaultSize(PRODUCTS[0]));
  const [tape, setTape] = useState({ under: "", bust: "", waist: "", hip: "" });
  const [note, setNote] = useState("");
  const sizes = sizesFor(product);

  function choose(next: Product) {
    const run = sizesFor(next);
    setProduct(next);
    setSize(run.includes(size) ? size : defaultSize(next));
    setNote("");
  }

  function matchChart() {
    const fit = recommendFit({
      unit: "cm",
      under: num(tape.under),
      bust: num(tape.bust),
      waist: num(tape.waist),
      hip: num(tape.hip),
    });
    const picked = fromChart(product, fit);
    if (!picked) {
      setNote("Enter a bust, waist, or hip in centimetres.");
      return;
    }
    const run = sizesFor(product);
    setSize(run.includes(picked.size) ? picked.size : defaultSize(product));
    setNote(run.includes(picked.size) ? `${picked.size}. ${picked.note}` : `${picked.size} is not cut in this piece. Showing ${defaultSize(product)}. ${picked.note}`);
  }

  return (
    <section id="try">
      <p className="eyebrow">Virtual try room</p>
      <h2 className="section-title">Try a live piece</h2>
      <p className="lede">The same dress form as the product page, on the current collection. Match the tape to the chart, then open the piece.</p>
      <div className="try-layout">
        <div>
          <div className="try-tape">
            {([
              ["under", "Underbust"],
              ["bust", "Bust"],
              ["waist", "Waist"],
              ["hip", "Hip"],
            ] as const).map(([key, label]) => (
              <label key={key}>{label} cm
                <input inputMode="decimal" value={tape[key]} onChange={(e) => setTape((t) => ({ ...t, [key]: e.target.value }))} />
              </label>
            ))}
          </div>
          <button type="button" className="cta" onClick={matchChart}>Match the chart</button>
          {note && <p className="muted try-note">{note}</p>}
          <div className="try-products" aria-label="Live products">
            {PRODUCTS.map((p) => (
              <button key={p.id} type="button" className={p.id === product.id ? "on" : ""} onClick={() => choose(p)}>
                <img src={p.image} alt="" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <FitView product={product} size={size} sizes={sizes} onSize={setSize} />
          <button type="button" className="cta" onClick={() => onOpen(product, size)}>Open {product.name}</button>
        </div>
      </div>
    </section>
  );
}
