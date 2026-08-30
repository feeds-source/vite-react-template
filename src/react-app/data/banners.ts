import type { Category } from "./catalog";

export const HERO = {
  poster: "/banners/hero.jpg",
  video: "/banners/hero.mp4",
  kicker: "Night Atelier · Pure Silk & Lace",
  title: "Exotic silk, cut for the body.",
  body: "Jewel-tone lounge, sleep, and lingerie in emerald, champagne, and ruby. Cash on delivery worldwide with signature atelier presentation.",
};

export const CAMPAIGNS = [
  {
    id: "sleep",
    poster: "/banners/sleep.jpg",
    video: "/banners/sleep.mp4",
    kicker: "Sleep",
    title: "Moonlit satin",
    cat: "Short Nighty",
  },
  {
    id: "lingerie",
    poster: "/banners/lingerie.jpg",
    video: "/banners/lingerie.mp4",
    kicker: "Lingerie",
    title: "Ruby lace night",
    cat: "Babydoll",
  },
  {
    id: "lounge",
    poster: "/banners/lounge.jpg",
    video: null,
    kicker: "Lounge",
    title: "Emerald after dusk",
    cat: "Loungewear",
  },
] as const;

export const MARQUEE = [
  { src: "/banners/tile-emerald.jpg", alt: "Emerald silk" },
  { src: "/banners/tile-ribbon.jpg", alt: "Champagne ribbon" },
  { src: "/banners/tile-peacock.jpg", alt: "Peacock and ruby silk" },
  { src: "/banners/hero.jpg", alt: "Atelier silk" },
  { src: "/banners/sleep.jpg", alt: "Satin night" },
  { src: "/banners/lounge.jpg", alt: "Moroccan lounge" },
];

export const AISLES: { cat: Category; title: string; image: string }[] = [
  { cat: "Babydoll", title: "Short lace night", image: "/products/ruby-babydoll.jpg" },
  { cat: "Bra Sets", title: "Balconette pairs", image: "/products/lace-balconette-set.jpg" },
  { cat: "Gowns", title: "Satin after dusk", image: "/products/satin-gown.jpg" },
  { cat: "Swim", title: "Jewel bikini", image: "/products/silk-bikini.jpg" },
  { cat: "Corsetry", title: "Boning & gold", image: "/products/emerald-bustier.jpg" },
  { cat: "Body Stockings", title: "Sheer noir", image: "/products/body-stocking.jpg" },
] as const;

export const TRUST = [
  { icon: "📐", title: "30B–42C & XS–XXL", desc: "Cut to the tape with interactive sister size matrix" },
  { icon: "📦", title: "Discreet Luxury Packaging", desc: "Signature noir and gold presentation box on all orders" },
  { icon: "💵", title: "Cash on Delivery", desc: "Doorstep payment worldwide with printable receipt" },
  { icon: "↺", title: "14-Day Free Exchange", desc: "Effortless fit guarantee on all unworn pieces" },
] as const;

export const STORY = {
  kicker: "The House",
  heading: "An adult house of jewel silk.",
  body: "Femme is Silk Moments after dusk: lingerie, night, and lounge. Banners that breathe, fabric that moves. Every still is shot as a painting, then the film starts. Cut for 30B–42C and XS to XXL with complimentary discreet packaging.",
};

export const ANNOUNCEMENT =
  "Complimentary discreet packaging · Cash on delivery worldwide · Free size exchanges within 14 days";
