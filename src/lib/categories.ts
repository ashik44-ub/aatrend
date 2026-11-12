export const CATEGORIES = [
  "Fashion",
  "Electronics",
  "Beauty",
  "Fitness",
  "Home Decor",
  "Accessories",
] as const;

/** Fashion sub-categories shown as tiles on the shop page (Hema-style). */
export const FASHION_SUBCATEGORIES = [
  "Women's",
  "Tshirts",
  "Top",
  "Shirts",
  "Jackets",
  "Hoodies",
  "Bag",
  "Accessories",
] as const;

export const BRANDS = [
  "Adidas",
  "Nike",
  "Baggit",
  "Bosh",
  "Campus",
  "Caprese",
  "D&G",
  "HeySweet",
  "Red Duck",
  "Rise Bar",
] as const;

/** Apparel sizes offered on fashion products. */
export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"] as const;

/** Hex swatch for a colour name (used for filter dots + card dots). */
export const COLOR_HEX: Record<string, string> = {
  Black: "#1f2937",
  White: "#f8fafc",
  Beige: "#d6c9b8",
  Grey: "#9ca3af",
  Gray: "#9ca3af",
  Blue: "#3b82f6",
  "Ocean Blue": "#2563eb",
  Navy: "#1e3a5f",
  Brown: "#7c4a21",
  Tan: "#c19a6b",
  Green: "#4ade80",
  Sage: "#a8b8a0",
  Red: "#ef4444",
  Pink: "#f9a8d4",
  "Floral Pink": "#f9a8d4",
  "Floral Blue": "#93c5fd",
  Purple: "#a855f7",
  Teal: "#14b8a6",
  Yellow: "#facc15",
  Mustard: "#d9a441",
  Orange: "#f97316",
  Gold: "#d4af37",
  Silver: "#c0c0c0",
  Multi: "#a78bfa",
  "Matte Black": "#111827",
  "Gold / Green": "#d4af37",
  "Silver / Grey": "#c0c0c0",
  "Brown Leather": "#7c4a21",
  "Black Leather": "#1f2937",
  "Black / Red": "#7f1d1d",
  "Nude Set": "#e8c39e",
  "Bold Set": "#be123c",
  Rose: "#fb7185",
};

export function colorHex(name: string): string {
  return COLOR_HEX[name] ?? "#9ca3af";
}
