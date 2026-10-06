import { useRef, useState } from "react";
import { chartFor, type Product } from "../data/catalog";
import { ALPHA_ROWS, GOWN_ROWS, NIGHTY_ROWS } from "../data/size-guide";

type ShapeId = "petite" | "balanced" | "curvy" | "full";

const SHAPES: Array<{ id: ShapeId; label: string; bust: number; waist: number; hip: number; height: number }> = [
  { id: "petite", label: "Petite", bust: 82, waist: 63, hip: 88, height: 158 },
  { id: "balanced", label: "Balanced", bust: 90, waist: 72, hip: 98, height: 168 },
  { id: "curvy", label: "Curvy", bust: 98, waist: 76, hip: 108, height: 170 },
  { id: "full", label: "Full", bust: 108, waist: 90, hip: 118, height: 172 },
];

function mid(range: string) {
  const nums = range.split(/[–-]/).map((n) => Number(n.trim())).filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return nums.length === 1 ? nums[0] : (nums[0] + nums[1]) / 2;
}

function garmentOf(product: Product, size: string) {
  const chart = chartFor(product);
  if (chart === "gown") {
    const row = GOWN_ROWS.find((r) => r.size === size) ?? GOWN_ROWS[0];
    return { bust: mid(row.bust), waist: mid(row.waist), hip: mid(row.hip) };
  }
  if (chart === "nighty") {
    const row = NIGHTY_ROWS.find((r) => r.size === size) ?? NIGHTY_ROWS[0];
    return { bust: mid(row.bust), waist: mid(row.waist), hip: mid(row.hip) };
  }
  if (chart === "bra") {
    const band = Number(size.slice(0, 2));
    const cup = size.slice(2);
    const cupAdd = { A: 10, B: 12.5, C: 15, D: 17.5 }[cup] ?? 12.5;
    const bust = (Number.isFinite(band) ? band * 2.54 : 86) + cupAdd;
    const row = ALPHA_ROWS.find((r) => bust <= mid(r.bust) + 2) ?? ALPHA_ROWS[2];
    return { bust, waist: mid(row.waist), hip: mid(row.hip) };
  }
  if (chart === "free") return { bust: 92, waist: 74, hip: 100 };
  const row = ALPHA_ROWS.find((r) => r.size === size) ?? ALPHA_ROWS[2];
  return { bust: mid(row.bust), waist: mid(row.waist), hip: mid(row.hip) };
}

function easeWord(garment: number, model: number) {
  const gap = garment - model;
  if (gap < -4) return "tight";
  if (gap < 2) return "close";
  if (gap < 8) return "easy";
  return "relaxed";
}

export function FitView({
  product,
  size,
  sizes,
  onSize,
}: {
  product: Product;
  size: string;
  sizes: readonly string[];
  onSize: (size: string) => void;
}) {
  const [angle, setAngle] = useState(18);
  const [spin, setSpin] = useState(true);
  const [shapeId, setShapeId] = useState<ShapeId>("balanced");
  const drag = useRef<{ x: number; angle: number } | null>(null);
  const shape = SHAPES.find((s) => s.id === shapeId) ?? SHAPES[1];
  const garment = garmentOf(product, size);
  const ease = garment.hip / shape.hip;
  const points = [
    ["Bust", easeWord(garment.bust, shape.bust)],
    ["Waist", easeWord(garment.waist, shape.waist)],
    ["Hip", easeWord(garment.hip, shape.hip)],
  ] as const;

  return (
    <div className="fit-view">
      <div
        className="fit-stage"
        onPointerDown={(e) => {
          setSpin(false);
          drag.current = { x: e.clientX, angle };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setAngle(drag.current.angle + (e.clientX - drag.current.x) * 0.6);
        }}
        onPointerUp={() => { drag.current = null; }}
      >
        <div className="fit-scene">
          <div
            className={`fit-turn${spin && !drag.current ? " spinning" : ""}`}
            style={{
              transform: `rotateY(${angle}deg)`,
              ["--form-bust" as string]: `${shape.bust / 90}`,
              ["--form-waist" as string]: `${shape.waist / 72}`,
              ["--form-hip" as string]: `${shape.hip / 98}`,
              ["--garment" as string]: `${Math.min(1.16, Math.max(0.84, ease))}`,
            }}
          >
            <div className="fit-face front" style={{ backgroundImage: `url(${product.image})` }} />
            <div className="fit-face back" style={{ backgroundImage: `url(${product.image})` }} />
            <div className="fit-face side left" />
            <div className="fit-face side right" />
          </div>
        </div>
        <p className="fit-hint">Drag to turn · 360</p>
      </div>

      <div className="fit-controls">
        <div className="fit-row">
          <span>Size</span>
          <div className="fit-pills">
            {sizes.map((sz) => (
              <button key={sz} type="button" className={sz === size ? "on" : ""} onClick={() => onSize(sz)}>{sz}</button>
            ))}
          </div>
        </div>
        <div className="fit-row">
          <span>Model</span>
          <div className="fit-pills">
            {SHAPES.map((s) => (
              <button key={s.id} type="button" className={s.id === shapeId ? "on" : ""} onClick={() => setShapeId(s.id)}>{s.label}</button>
            ))}
          </div>
        </div>
        <button type="button" className="text-link" onClick={() => setSpin((v) => !v)}>{spin ? "Pause turn" : "Turn"}</button>
      </div>

      <ul className="fit-read">
        <li><span>Form</span><strong>{shape.label} · {shape.height} cm</strong></li>
        {points.map(([label, word]) => (
          <li key={label}><span>{label}</span><strong className={`fit-${word}`}>{word}</strong></li>
        ))}
      </ul>
    </div>
  );
}
