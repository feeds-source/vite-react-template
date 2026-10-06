import type { Category } from "./catalog";

export const FOOTER_AISLES: { title: string; cats: Category[] }[] = [
  {
    title: "Sleep Room",
    cats: ["Babydoll", "Short Nighty", "Long Nighty", "Sleep Sets", "Slips", "Gowns", "Teddies", "Robes"],
  },
  {
    title: "Body Room",
    cats: ["Bras", "Bralettes", "Bra Sets", "Panties", "Seamless", "Leakproof", "Active", "Camisole", "Corsetry", "Hosiery", "Body Stockings", "Shapewear"],
  },
  {
    title: "Lounge Room",
    cats: ["Bridal", "Swim", "Loungewear", "Resort", "Thermal", "Accessories"],
  },
];

export const ROOMS = {
  Sleep: FOOTER_AISLES[0].cats,
  Lingerie: FOOTER_AISLES[1].cats,
  Lounge: FOOTER_AISLES[2].cats,
} as const;

export type Room = keyof typeof ROOMS;
