import { CHART_FOR, SIZE_CHARTS, type Category, type SizeChart } from "./catalog";

export const GUIDE_STEPS = [
  {
    title: "Underbust",
    body: "Tape snug around the ribcage, just under the breasts. Exhale. This is the band.",
  },
  {
    title: "Bust",
    body: "Tape around the fullest point, level, not tight. The gap from underbust is the cup.",
  },
  {
    title: "Waist",
    body: "Narrowest point of the torso, usually above the navel. Stand easy — no cinch.",
  },
  {
    title: "Hip",
    body: "Fullest seat and outer thigh, tape parallel to the floor.",
  },
] as const;

export const BRA_BANDS = [
  { band: "30", cm: "63–67", inch: "25–26.5" },
  { band: "32", cm: "68–72", inch: "27–28.5" },
  { band: "34", cm: "73–77", inch: "29–30.5" },
  { band: "36", cm: "78–82", inch: "31–32.5" },
  { band: "38", cm: "83–87", inch: "33–34.5" },
  { band: "40", cm: "88–92", inch: "35–36.5" },
  { band: "42", cm: "93–97", inch: "37–38.5" },
] as const;

export const BRA_CUPS = [
  { cup: "A", deltaCm: "12–14", deltaIn: "1" },
  { cup: "B", deltaCm: "14–16", deltaIn: "2" },
  { cup: "C", deltaCm: "16–18", deltaIn: "3" },
  { cup: "D", deltaCm: "18–20", deltaIn: "4" },
] as const;

const BAND_MID: Record<string, number> = { "30": 65, "32": 70, "34": 75, "36": 80, "38": 85, "40": 90, "42": 95 };
const CUP_ADD: Record<string, { lo: number; hi: number }> = {
  A: { lo: 12, hi: 14 },
  B: { lo: 14, hi: 16 },
  C: { lo: 16, hi: 18 },
  D: { lo: 18, hi: 20 },
};

function cmIn(lo: number, hi: number) {
  const inch = (n: number) => (n / 2.54).toFixed(1).replace(/\.0$/, "");
  return { cm: `${lo}–${hi}`, inch: `${inch(lo)}–${inch(hi)}` };
}

export function parseSpan(s: string): [number, number] {
  const parts = s.split("–").map((n) => Number(n));
  return [parts[0] ?? 0, parts[1] ?? parts[0] ?? 0];
}

export function spanIn(cm: string): string {
  if (!cm.includes("–")) {
    const n = Number(cm);
    if (!Number.isFinite(n)) return cm;
    return (n / 2.54).toFixed(1).replace(/\.0$/, "");
  }
  const [lo, hi] = parseSpan(cm);
  return cmIn(lo, hi).inch;
}

export const BRA_MATRIX = SIZE_CHARTS.bra.map((size) => {
  const band = size.slice(0, -1);
  const cup = size.slice(-1);
  const mid = BAND_MID[band] ?? 75;
  const add = CUP_ADD[cup] ?? CUP_ADD.B;
  const bust = cmIn(mid + add.lo - 2, mid + add.hi + 2);
  const under = BRA_BANDS.find((b) => b.band === band);
  return {
    size,
    band,
    cup,
    underCm: under?.cm ?? "—",
    underIn: under?.inch ?? "—",
    bustCm: bust.cm,
    bustIn: bust.inch,
  };
});

export const BRA_CUPS_CUT = ["A", "B", "C", "D"] as const;
export const BRA_BANDS_CUT = ["30", "32", "34", "36", "38", "40", "42"] as const;

export function braIsCut(band: string, cup: string) {
  return SIZE_CHARTS.bra.includes(`${band}${cup}`);
}

export const SISTER_SIZES = [
  ["32A", "30B"],
  ["32B", "30C", "34A"],
  ["32C", "34B", "36A"],
  ["32D", "34C", "36B"],
  ["34D", "36C", "38B"],
  ["36D", "38C", "40B"],
  ["38D", "40C", "42B"],
  ["40C", "42B"],
  ["42C", "40D"],
] as const;

export function volumeSisters(size: string): string[] {
  const band = Number(size.slice(0, -1));
  const cup = size.slice(-1);
  const ci = BRA_CUPS_CUT.indexOf(cup as (typeof BRA_CUPS_CUT)[number]);
  if (!Number.isFinite(band) || ci < 0) return [];
  const vol = (band - 30) / 2 + ci;
  const out: string[] = [];
  for (const b of BRA_BANDS_CUT) {
    const cupI = vol - (Number(b) - 30) / 2;
    if (Number.isInteger(cupI) && cupI >= 0 && cupI < BRA_CUPS_CUT.length) {
      out.push(`${b}${BRA_CUPS_CUT[cupI]}`);
    }
  }
  return out;
}

export function sistersOf(size: string): string[] {
  return volumeSisters(size).filter((s) => s !== size);
}

export const BRA_DETAIL = BRA_MATRIX.map((r) => ({
  ...r,
  sisters: sistersOf(r.size).filter((s) => SIZE_CHARTS.bra.includes(s)).join(" · ") || "—",
  eu: String(Number(r.band) + 35),
  fr: String(Number(r.band) + 50),
}));

export const ALPHA_ROWS = [
  { size: "XS", bust: "78–82", waist: "60–64", hip: "86–90", bustIn: "30.5–32.5", waistIn: "23.5–25", hipIn: "34–35.5", uk: "4–6", us: "0–2", eu: "32–34", au: "4–6", pk: "30–32" },
  { size: "S", bust: "83–87", waist: "65–69", hip: "91–95", bustIn: "32.5–34.5", waistIn: "25.5–27", hipIn: "36–37.5", uk: "8–10", us: "4–6", eu: "36–38", au: "8–10", pk: "32–34" },
  { size: "M", bust: "88–92", waist: "70–74", hip: "96–100", bustIn: "34.5–36", waistIn: "27.5–29", hipIn: "38–39.5", uk: "12–14", us: "8–10", eu: "40–42", au: "12–14", pk: "34–36" },
  { size: "L", bust: "93–97", waist: "75–79", hip: "101–105", bustIn: "36.5–38", waistIn: "29.5–31", hipIn: "40–41.5", uk: "16–18", us: "12–14", eu: "44–46", au: "16–18", pk: "36–38" },
  { size: "XL", bust: "98–104", waist: "80–86", hip: "106–112", bustIn: "38.5–41", waistIn: "31.5–34", hipIn: "41.5–44", uk: "20–22", us: "16–18", eu: "48–50", au: "20–22", pk: "38–40" },
  { size: "XXL", bust: "105–112", waist: "87–94", hip: "113–120", bustIn: "41.5–44", waistIn: "34.5–37", hipIn: "44.5–47", uk: "24–26", us: "20–22", eu: "52–54", au: "24–26", pk: "40–42" },
] as const;

export const NIGHTY_ROWS = [
  { size: "Free Size", bust: "83–97", waist: "65–79", hip: "91–105", length: "78–86", note: "Drapes S–L" },
  { size: "S", bust: "83–87", waist: "65–69", hip: "91–95", length: "82", note: "Short hem above the knee" },
  { size: "M", bust: "88–92", waist: "70–74", hip: "96–100", length: "84", note: "House default" },
  { size: "L", bust: "93–97", waist: "75–79", hip: "101–105", length: "86", note: "Ease through the hip" },
  { size: "XL", bust: "98–104", waist: "80–86", hip: "106–112", length: "88", note: "Longer strap drop" },
] as const;

export const GOWN_ROWS = [
  { size: "M", bust: "88–92", waist: "70–74", hip: "96–100", length: "145", height: "165–170", note: "Floor on 165–170 cm height" },
  { size: "L", bust: "93–97", waist: "75–79", hip: "101–105", length: "147", height: "168–173", note: "Floor on 168–173 cm" },
  { size: "XL", bust: "98–104", waist: "80–86", hip: "106–112", length: "149", height: "170–176", note: "Take XL if between L/XL at the hip" },
  { size: "XXL", bust: "105–112", waist: "87–94", hip: "113–120", length: "151", height: "172–178", note: "Fuller seat, same hem drop" },
] as const;

export const CORSET_ROWS = [
  { size: "XS", waistClosed: "58–62", waistOpen: "64–68", rib: "70–74", reduction: "4–6" },
  { size: "S", waistClosed: "63–67", waistOpen: "69–73", rib: "75–79", reduction: "4–6" },
  { size: "M", waistClosed: "68–72", waistOpen: "74–78", rib: "80–84", reduction: "4–6" },
  { size: "L", waistClosed: "73–77", waistOpen: "79–83", rib: "85–89", reduction: "4–6" },
  { size: "XL", waistClosed: "78–84", waistOpen: "84–90", rib: "90–96", reduction: "4–6" },
  { size: "XXL", waistClosed: "85–92", waistOpen: "91–98", rib: "97–104", reduction: "4–6" },
] as const;

export const HOSE_ROWS = [
  { size: "XS", height: "150–158", inseam: "70–74", thigh: "48–52", foot: "22–23.5" },
  { size: "S", height: "155–163", inseam: "73–77", thigh: "50–54", foot: "23–24.5" },
  { size: "M", height: "160–168", inseam: "76–80", thigh: "53–57", foot: "24–25.5" },
  { size: "L", height: "165–173", inseam: "79–83", thigh: "56–61", foot: "25–26.5" },
  { size: "XL", height: "170–178", inseam: "82–86", thigh: "60–66", foot: "26–27.5" },
  { size: "XXL", height: "173–182", inseam: "84–88", thigh: "65–72", foot: "27–29" },
] as const;

export const PANTIES_ROWS = [
  { size: "XS", hip: "86–90", waist: "60–64" },
  { size: "S", hip: "91–95", waist: "65–69" },
  { size: "M", hip: "96–100", waist: "70–74" },
  { size: "L", hip: "101–105", waist: "75–79" },
  { size: "XL", hip: "106–112", waist: "80–86" },
  { size: "XXL", hip: "113–120", waist: "87–94" },
] as const;

export const SWIM_ROWS = [
  { size: "XS", bust: "78–82", hip: "86–90", cup: "30B / 32A" },
  { size: "S", bust: "83–87", hip: "91–95", cup: "32B / 32C" },
  { size: "M", bust: "88–92", hip: "96–100", cup: "34B / 34C" },
  { size: "L", bust: "93–97", hip: "101–105", cup: "36C / 36D" },
  { size: "XL", bust: "98–104", hip: "106–112", cup: "38C / 38D" },
  { size: "XXL", bust: "105–112", hip: "113–120", cup: "40C / 42C" },
] as const;

export const INT_BAND = [
  { ukus: "30", eu: "65", fr: "80", it: "0", au: "8", pk: "30" },
  { ukus: "32", eu: "70", fr: "85", it: "1", au: "10", pk: "32" },
  { ukus: "34", eu: "75", fr: "90", it: "2", au: "12", pk: "34" },
  { ukus: "36", eu: "80", fr: "95", it: "3", au: "14", pk: "36" },
  { ukus: "38", eu: "85", fr: "100", it: "4", au: "16", pk: "38" },
  { ukus: "40", eu: "90", fr: "105", it: "5", au: "18", pk: "40" },
  { ukus: "42", eu: "95", fr: "110", it: "6", au: "20", pk: "42" },
] as const;

export const INT_CUP = [
  { uk: "A", us: "A", eu: "A", fr: "A", gapCm: "12–14", gapIn: "1" },
  { uk: "B", us: "B", eu: "B", fr: "B", gapCm: "14–16", gapIn: "2" },
  { uk: "C", us: "C", eu: "C", fr: "C", gapCm: "16–18", gapIn: "3" },
  { uk: "D", us: "D", eu: "D", fr: "D", gapCm: "18–20", gapIn: "4" },
  { uk: "DD", us: "DD / E", eu: "E", fr: "E", gapCm: "20–22", gapIn: "5" },
] as const;

export const CHART_COPY: Record<SizeChart, { id: string; title: string; kicker: string; body: string }> = {
  bra: {
    id: "bras",
    title: "Bras & bridal sets",
    kicker: "Band + cup",
    body: "Match underbust to the band, then the gap to the cup. We cut the cups listed — empty cells are not in this house.",
  },
  alpha: {
    id: "body",
    title: "Body & lounge",
    kicker: "XS–XXL",
    body: "Panties, teddies, camisoles, lounge, thermal, shapewear. Centimetres and inches, plus UK / US / EU / AU / PK.",
  },
  nighty: {
    id: "night",
    title: "Nighties & babydolls",
    kicker: "Free Size · S–XL",
    body: "Short and long nighties, babydolls, getting-ready robes. Length is centre-back.",
  },
  gown: {
    id: "gowns",
    title: "Gowns",
    kicker: "M–XXL",
    body: "Floor-length satin. Length is centre-back. Between sizes at the hip — take the larger.",
  },
  free: {
    id: "free",
    title: "Free size",
    kicker: "One cut",
    body: "Body stockings, sarongs, masks, chains. One size, made to drape S–XL.",
  },
};

export const EXTRA_NAV = [
  { id: "corset", kicker: "Corsetry" },
  { id: "hose", kicker: "Hosiery" },
  { id: "swim", kicker: "Swim" },
] as const;

export const GUIDE_NAV = [
  { id: "finder", kicker: "Find size" },
  { id: "visuals", kicker: "Visuals" },
  { id: "convert", kicker: "Convert" },
  ...Object.values(CHART_COPY),
  ...EXTRA_NAV,
] as const;

export const AISLE_CHARTS = (Object.entries(CHART_FOR) as [Category, SizeChart][]).map(([aisle, chart]) => ({
  aisle,
  chart: CHART_COPY[chart].title,
  href: `#${CHART_COPY[chart].id}`,
}));

export const BODY_RANGE = ALPHA_ROWS.map((r) => {
  const bust = parseSpan(r.bust);
  const waist = parseSpan(r.waist);
  const hip = parseSpan(r.hip);
  return {
    size: r.size,
    bustOff: bust[0],
    bust: bust[1] - bust[0],
    bustHi: bust[1],
    waistOff: waist[0],
    waist: waist[1] - waist[0],
    waistHi: waist[1],
    hipOff: hip[0],
    hip: hip[1] - hip[0],
    hipHi: hip[1],
  };
});

export function bodyRangeFor(unit: "cm" | "in") {
  if (unit === "cm") return BODY_RANGE;
  const conv = (n: number) => Number((n / 2.54).toFixed(1));
  return BODY_RANGE.map((r) => ({
    size: r.size,
    bustOff: conv(r.bustOff),
    bust: conv(r.bustHi) - conv(r.bustOff),
    bustHi: conv(r.bustHi),
    waistOff: conv(r.waistOff),
    waist: conv(r.waistHi) - conv(r.waistOff),
    waistHi: conv(r.waistHi),
    hipOff: conv(r.hipOff),
    hip: conv(r.hipHi) - conv(r.hipOff),
    hipHi: conv(r.hipHi),
  }));
}

export const CUP_VOLUME = BRA_CUPS.map((c) => {
  const [lo, hi] = parseSpan(c.deltaCm);
  return { cup: c.cup, lo, hi, mid: (lo + hi) / 2 };
});

export const BAND_VOLUME = BRA_BANDS.map((b) => {
  const [lo, hi] = parseSpan(b.cm);
  return { band: b.band, lo, hi, mid: (lo + hi) / 2 };
});

export const BODY_LINE = ALPHA_ROWS.map((r) => {
  const bust = parseSpan(r.bust);
  const waist = parseSpan(r.waist);
  const hip = parseSpan(r.hip);
  return {
    size: r.size,
    bust: (bust[0] + bust[1]) / 2,
    waist: (waist[0] + waist[1]) / 2,
    hip: (hip[0] + hip[1]) / 2,
  };
});

export const INT_DRESS = ALPHA_ROWS.map((r) => {
  const mid = (s: string) => {
    const [a, b] = parseSpan(s);
    return (a + b) / 2;
  };
  return { size: r.size, UK: mid(r.uk), US: mid(r.us), EU: mid(r.eu), AU: mid(r.au) };
});

export const CORSET_CHART = CORSET_ROWS.map((r) => {
  const closed = parseSpan(r.waistClosed);
  const open = parseSpan(r.waistOpen);
  const rib = parseSpan(r.rib);
  return {
    size: r.size,
    closed: (closed[0] + closed[1]) / 2,
    open: (open[0] + open[1]) / 2,
    rib: (rib[0] + rib[1]) / 2,
    reduction: (open[0] + open[1]) / 2 - (closed[0] + closed[1]) / 2,
  };
});

export const HOSE_CHART = HOSE_ROWS.map((r) => {
  const height = parseSpan(r.height);
  const thigh = parseSpan(r.thigh);
  const inseam = parseSpan(r.inseam);
  return {
    size: r.size,
    heightOff: height[0],
    height: height[1] - height[0],
    heightHi: height[1],
    thighOff: thigh[0],
    thigh: thigh[1] - thigh[0],
    thighHi: thigh[1],
    inseam: (inseam[0] + inseam[1]) / 2,
  };
});

export const GOWN_CHART = GOWN_ROWS.map((r) => {
  const height = parseSpan(r.height);
  return {
    size: r.size,
    length: Number(r.length),
    heightLo: height[0],
    heightHi: height[1],
    height: (height[0] + height[1]) / 2,
  };
});

export const NIGHTY_CHART = NIGHTY_ROWS.filter((r) => r.size !== "Free Size").map((r) => ({
  size: r.size,
  length: Number(r.length),
  bust: (parseSpan(r.bust)[0] + parseSpan(r.bust)[1]) / 2,
}));

export const MEASURE_MARKS = [
  { id: "bust", label: "Bust", top: "38%" },
  { id: "under", label: "Underbust", top: "44%" },
  { id: "waist", label: "Waist", top: "51%" },
  { id: "hip", label: "Hip", top: "63%" },
] as const;

export type FitUnit = "cm" | "in";

export type FitInput = {
  unit: FitUnit;
  under?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  height?: number;
  thigh?: number;
};

export type FitPiece = { size: string; note: string; sisters?: string[] };

export type FitResult = {
  bra?: FitPiece;
  body?: FitPiece;
  nighty?: FitPiece;
  gown?: FitPiece;
  corset?: FitPiece;
  hose?: FitPiece;
};

function toCm(n: number | undefined, unit: FitUnit): number | undefined {
  if (n == null || Number.isNaN(n) || n <= 0) return undefined;
  return unit === "in" ? n * 2.54 : n;
}

function pickBand(under: number): string {
  let bestBand: string = BRA_BANDS[0]!.band;
  let bestDist = Infinity;
  for (const b of BRA_BANDS) {
    const [lo, hi] = parseSpan(b.cm);
    if (under >= lo && under <= hi) return b.band;
    const mid = (lo + hi) / 2;
    const dist = Math.abs(under - mid);
    if (dist < bestDist) {
      bestBand = b.band;
      bestDist = dist;
    }
  }
  return bestBand;
}

function pickCup(gap: number): string {
  if (gap < 14) return "A";
  if (gap < 16) return "B";
  if (gap < 18) return "C";
  return "D";
}

function inSpan(value: number, span: string) {
  const [lo, hi] = parseSpan(span);
  return value >= lo && value <= hi;
}

function pickByField<T extends { size: string }>(rows: readonly T[], field: keyof T, value: number): T {
  const hit = rows.find((r) => inSpan(value, String(r[field])));
  if (hit) return hit;
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  const [lo] = parseSpan(String(first[field]));
  return value < lo ? first : last;
}

function majority(sizes: string[]): string {
  const counts = new Map<string, number>();
  for (const s of sizes) counts.set(s, (counts.get(s) ?? 0) + 1);
  const order = ["XS", "S", "M", "L", "XL", "XXL"];
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || order.indexOf(b[0]) - order.indexOf(a[0]))[0]![0];
}

export function recommendFit(input: FitInput): FitResult {
  const under = toCm(input.under, input.unit);
  const bust = toCm(input.bust, input.unit);
  const waist = toCm(input.waist, input.unit);
  const hip = toCm(input.hip, input.unit);
  const height = toCm(input.height, input.unit);
  const thigh = toCm(input.thigh, input.unit);
  const out: FitResult = {};

  if (under && bust) {
    const band = pickBand(under);
    const cup = pickCup(bust - under);
    const theoretical = `${band}${cup}`;
    const chain = volumeSisters(theoretical);
    const cut = chain.find((s) => SIZE_CHARTS.bra.includes(s));
    const size = SIZE_CHARTS.bra.includes(theoretical) ? theoretical : (cut ?? theoretical);
    const sisters = sistersOf(size).filter((s) => SIZE_CHARTS.bra.includes(s));
    const note = SIZE_CHARTS.bra.includes(theoretical)
      ? `Underbust ${Math.round(under)} cm, gap ${Math.round(bust - under)} cm.`
      : `${theoretical} is not cut. Nearest house size ${size}.`;
    out.bra = { size, note, sisters };
  }

  if (bust || waist || hip) {
    const votes: string[] = [];
    if (bust) votes.push(pickByField(ALPHA_ROWS, "bust", bust).size);
    if (waist) votes.push(pickByField(ALPHA_ROWS, "waist", waist).size);
    if (hip) votes.push(pickByField(ALPHA_ROWS, "hip", hip).size);
    const size = majority(votes);
    const spread = new Set(votes);
    out.body = {
      size,
      note: spread.size > 1 ? `Between ${[...spread].join(" / ")} — hip ${hip ? "leads" : "unset"}, take the larger if between.` : "Matches bust, waist, and hip.",
    };

    const nightRows = NIGHTY_ROWS.filter((r) => r.size !== "Free Size");
    const nSize = hip ? pickByField(nightRows, "hip", hip).size : size === "XS" ? "S" : size === "XXL" ? "XL" : size;
    const freeOk = bust ? inSpan(bust, "83–97") : false;
    out.nighty = {
      size: nSize,
      note: freeOk ? `Also drapes in Free Size.` : "Free Size is cut for S–L busts.",
    };

    const gownSize = hip ? pickByField(GOWN_ROWS, "hip", hip).size : size === "XS" || size === "S" ? "M" : size;
    out.gown = {
      size: gownSize,
      note: gownSize === "M" && (size === "XS" || size === "S") ? "Gowns start at M — the satin eases through a smaller frame." : "Hem is centre-back; taller frames take the next length.",
    };
  }

  if (waist) {
    const row = pickByField(CORSET_ROWS, "waistOpen", waist);
    out.corset = {
      size: row.size,
      note: "Size to the open waist, then lace 4–6 cm. Do not size down more than one step.",
    };
  }

  if (height) {
    const row = pickByField(HOSE_ROWS, "height", height);
    let note = `Height ${Math.round(height)} cm.`;
    if (thigh && !inSpan(thigh, row.thigh)) {
      const byThigh = pickByField(HOSE_ROWS, "thigh", thigh);
      if (byThigh.size !== row.size) {
        note = `Height suggests ${row.size}, thigh suggests ${byThigh.size} — take ${byThigh.size} for the welt.`;
        out.hose = { size: byThigh.size, note };
      } else {
        out.hose = { size: row.size, note };
      }
    } else {
      out.hose = { size: row.size, note };
    }
  }

  return out;
}

export function silhouetteFor(size: string) {
  const row = BODY_LINE.find((r) => r.size === size) ?? BODY_LINE[2]!;
  const house = BODY_LINE.find((r) => r.size === "M")!;
  return [
    { metric: "Bust", size: row.bust, house: house.bust },
    { metric: "Waist", size: row.waist, house: house.waist },
    { metric: "Hip", size: row.hip, house: house.hip },
  ];
}
