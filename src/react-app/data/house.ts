import type { Category } from "./catalog";
import { FOOTER_AISLES } from "./footer";

export type ShopHero = {
  image: string;
  video?: string;
  kicker: string;
  body: string;
};

export const CAT_HERO: Record<"All" | Category, ShopHero> = {
  All: {
    image: "/banners/lounge.jpg",
    kicker: "Boutique",
    body: "Night, body, and after dusk — jewel silk, lace, and gold, cut for 30B–42C.",
  },
  Bras: {
    image: "/products/everyday-soft-bra.jpg",
    video: "/products/everyday-soft-bra.mp4",
    kicker: "Body",
    body: "Soft cups, T-shirt, first-fit. Band and cup as worn in atelier fittings.",
  },
  "Bra Sets": {
    image: "/products/lace-balconette-set.jpg",
    video: "/products/lace-balconette-set.mp4",
    kicker: "Body",
    body: "Balconette pairs. Midnight lace with a matching brief.",
  },
  Panties: {
    image: "/products/ruby-brazilian.jpg",
    kicker: "Body",
    body: "Hipster, thong, Brazilian — silk and modal against the hip.",
  },
  Camisole: {
    image: "/products/lace-camisole.jpg",
    kicker: "Body",
    body: "Stretch lace cami, second-skin under silk.",
  },
  Babydoll: {
    image: "/products/ruby-babydoll.jpg",
    video: "/products/ruby-babydoll.mp4",
    kicker: "Night",
    body: "Short lace night. Ruby, orchid, noir — hem above the knee.",
  },
  "Short Nighty": {
    image: "/banners/sleep.jpg",
    video: "/banners/sleep.mp4",
    kicker: "Night",
    body: "Satin cami sets and short lace for moonlit rooms.",
  },
  "Long Nighty": {
    image: "/products/silk-night-slip.jpg",
    kicker: "Night",
    body: "Floor-length silk slips. Length is centre-back.",
  },
  Gowns: {
    image: "/products/satin-gown.jpg",
    kicker: "Night",
    body: "Floor-length satin. Between sizes at the hip — take the larger.",
  },
  Teddies: {
    image: "/products/noir-teddy.jpg",
    video: "/products/noir-teddy.mp4",
    kicker: "Night",
    body: "One-piece lace and jewel silk, cut for candlelight.",
  },
  Bridal: {
    image: "/products/ivory-bridal-set.jpg",
    video: "/products/ivory-bridal-set.mp4",
    kicker: "After dusk",
    body: "Ivory lace, pearl clasps, getting-ready robes.",
  },
  Corsetry: {
    image: "/products/emerald-bustier.jpg",
    video: "/products/emerald-bustier.mp4",
    kicker: "Body",
    body: "Boning and gold. Hourglass, not squeeze — lace 4–6 cm.",
  },
  Hosiery: {
    image: "/products/seamed-stockings.jpg",
    kicker: "Body",
    body: "Seamed silk, hold-ups, garters. Height first, then thigh.",
  },
  "Body Stockings": {
    image: "/products/body-stocking.jpg",
    video: "/products/body-stocking.mp4",
    kicker: "Body",
    body: "Sheer noir lace, one piece. Free size, made to drape.",
  },
  Shapewear: {
    image: "/products/sculpt-midi.jpg",
    kicker: "Body",
    body: "Soft power mesh. Smooths under silk without squeeze.",
  },
  Swim: {
    image: "/products/silk-bikini.jpg",
    kicker: "After dusk",
    body: "Jewel bikini. Triangle top to the nearest cup, brief to the hip.",
  },
  Loungewear: {
    image: "/banners/lounge.jpg",
    kicker: "After dusk",
    body: "Knit robes and wide-leg ease. Emerald after dusk.",
  },
  Resort: {
    image: "/products/silk-kaftan.jpg",
    kicker: "After dusk",
    body: "Kaftans and sarongs for lantern-hour dressing.",
  },
  Thermal: {
    image: "/products/plum-wrap.jpg",
    kicker: "After dusk",
    body: "Brushed layers and cashmere wraps for cooler nights.",
  },
  Accessories: {
    image: "/products/gold-body-chain.jpg",
    kicker: "After dusk",
    body: "Masks and chains. One cut, made to drape S–L.",
  },
};

export const ATELIER_ROOMS = [
  {
    title: "Night",
    kicker: FOOTER_AISLES[0]!.title,
    image: "/banners/sleep.jpg",
    video: "/banners/sleep.mp4",
    body: "Babydolls, short and long nighties, gowns, teddies. Satin after dusk, lace in candlelight.",
    cats: FOOTER_AISLES[0]!.cats,
  },
  {
    title: "Body",
    kicker: FOOTER_AISLES[1]!.title,
    image: "/banners/lingerie.jpg",
    video: "/banners/lingerie.mp4",
    body: "Bras and sets, panties, camisole, corsetry, hose, body stockings, shapewear. Cut to the tape.",
    cats: FOOTER_AISLES[1]!.cats,
  },
  {
    title: "After dusk",
    kicker: FOOTER_AISLES[2]!.title,
    image: "/banners/lounge.jpg",
    body: "Bridal ivory, jewel swim, lounge, resort, thermal, and the small gold things worn last.",
    cats: FOOTER_AISLES[2]!.cats,
  },
] as const;

export const ATELIER_CRAFT = [
  {
    title: "Silk",
    body: "Jewel charmeuse in emerald, champagne, ruby. Cool to the hand, then motion on film.",
  },
  {
    title: "Lace",
    body: "Midnight, orchid, ivory. Stretch where the body turns, rigid where a neckline should hold.",
  },
  {
    title: "Gold",
    body: "Hardware, ribbon, seaming. A champagne line against noir — never costume gilt.",
  },
  {
    title: "Hourglass",
    body: "Waspie and bustier lace 4–6 cm. Size to the open waist. Hourglass, not squeeze.",
  },
] as const;

export const ATELIER_LOOK = [
  { src: "/banners/hero.jpg", video: "/banners/hero.mp4", label: "House film" },
  { src: "/banners/sleep.jpg", video: "/banners/sleep.mp4", label: "Moonlit satin" },
  { src: "/banners/lingerie.jpg", video: "/banners/lingerie.mp4", label: "Ruby lace night" },
  { src: "/banners/lounge.jpg", label: "Emerald after dusk" },
  { src: "/banners/tile-peacock.jpg", label: "Peacock silk" },
  { src: "/banners/tile-emerald.jpg", label: "Emerald still" },
] as const;
