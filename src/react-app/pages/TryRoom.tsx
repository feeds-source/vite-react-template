import { useEffect, useState, type FormEvent } from "react";
import { chartFor, defaultSize, PRODUCTS, sizesFor, type Product } from "../data/catalog";
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
  return fit.body ?? null;
}

const RESULT_ROWS: Array<{ key: keyof FitResult; label: string }> = [
  { key: "bra", label: "Bra" },
  { key: "body", label: "Body" },
  { key: "nighty", label: "Nighty" },
  { key: "gown", label: "Gown" },
  { key: "corset", label: "Corset" },
  { key: "hose", label: "Hose" },
];

export function SizeFinder({ onFit }: { onFit: (fit: FitResult | null) => void }) {
  const [unit, setUnit] = useState<FitUnit>("cm");
  const [tape, setTape] = useState<Tape>(EMPTY);
  const [fit, setFit] = useState<FitResult | null>(null);
  const [error, setError] = useState("");

  function find(e: FormEvent) {
    e.preventDefault();
    const input = {
      unit,
      under: num(tape.under),
      bust: num(tape.bust),
      waist: num(tape.waist),
      hip: num(tape.hip),
      height: num(tape.height),
      thigh: num(tape.thigh),
    };
    if (!input.under && !input.bust && !input.waist && !input.hip && !input.height && !input.thigh) {
      setFit(null);
      onFit(null);
      setError("Enter at least one measurement.");
      return;
    }
    if ((input.under && !input.bust) || (!input.under && input.bust)) {
      setError("A bra size needs both underbust and bust. Body, nighty, gown, and corset still use whatever else you entered.");
    } else {
      setError("");
    }
    const next = recommendFit(input);
    setFit(next);
    onFit(next);
  }

  return (
    <form className="finder" onSubmit={find}>
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
      <button type="submit" className="cta">Find my size</button>
      {error && <p className="muted try-note">{error}</p>}
      {fit && (
        <ul className="finder-results">
          {RESULT_ROWS.map((row) => {
            const piece = fit[row.key];
            return (
              <li key={row.key}>
                <span>{row.label}</span>
                <strong>{piece?.size ?? "—"}</strong>
                <em>{piece?.note ?? "Add the measurement this chart uses."}</em>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}

export function TryRoom({ fit, onOpen }: { fit: FitResult | null; onOpen: (product: Product, size: string) => void }) {
  const [product, setProduct] = useState<Product>(PRODUCTS[0]);
  const [size, setSize] = useState(defaultSize(PRODUCTS[0]));
  const [note, setNote] = useState("");
  const sizes = sizesFor(product);

  useEffect(() => {
    if (!fit) return;
    const picked = fromChart(product, fit);
    if (!picked) {
      setNote("Find size did not have the measurements for this piece.");
      return;
    }
    const run = sizesFor(product);
    if (run.includes(picked.size)) {
      setSize(picked.size);
      setNote(`${picked.size}. ${picked.note}`);
    } else {
      setSize(defaultSize(product));
      setNote(`${picked.size} is not cut in this piece. Showing ${defaultSize(product)}.`);
    }
  }, [fit, product]);

  function choose(next: Product) {
    const run = sizesFor(next);
    setProduct(next);
    if (!fit) setSize(run.includes(size) ? size : defaultSize(next));
  }

  return (
    <section id="try">
      <p className="eyebrow">Virtual try room</p>
      <h2 className="section-title">Try a live piece</h2>
      <p className="lede">Uses the size Find size just returned, on a live piece.</p>
      <div className="try-layout">
        <div>
          {note && <p className="try-note">{note}</p>}
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
