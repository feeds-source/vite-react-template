import type { Category } from "./catalog";

export const FOOTER_AISLES: { title: string; cats: Category[] }[] = [
  {
    title: "Sleep Room",
    cats: ["Babydoll", "Short Nighty", "Long Nighty", "Gowns", "Teddies"],
  },
  {
    title: "Body Room",
    cats: ["Bras", "Bra Sets", "Panties", "Camisole", "Corsetry", "Hosiery", "Body Stockings", "Shapewear"],
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
