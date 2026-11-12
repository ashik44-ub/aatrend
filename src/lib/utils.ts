/** All store prices are in Bangladeshi Taka (৳), whole amounts, no decimals. */
export function formatPrice(n: number): string {
  return `৳${Math.round(n).toLocaleString("en-US")}`;
}

/** Delivery charges are in Bangladeshi Taka (whole amounts, no decimals). */
export function formatTaka(n: number): string {
  return formatPrice(n);
}

export type DeliveryArea = "inside-dhaka" | "outside-dhaka";

export const DELIVERY_AREA_LABELS: Record<DeliveryArea, string> = {
  "inside-dhaka": "Inside Dhaka",
  "outside-dhaka": "Outside Dhaka",
};

export interface ShippingRates {
  insideDhaka: number;
  outsideDhaka: number;
}

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  insideDhaka: 70,
  outsideDhaka: 120,
};

/** Charge for a delivery area from the admin-managed rates (with safe fallbacks). */
export function shippingChargeFor(
  area: string | undefined,
  rates?: Partial<ShippingRates> | null
): number {
  const inside = Number(rates?.insideDhaka ?? DEFAULT_SHIPPING_RATES.insideDhaka) || 0;
  const outside = Number(rates?.outsideDhaka ?? DEFAULT_SHIPPING_RATES.outsideDhaka) || 0;
  return area === "outside-dhaka" ? outside : inside;
}

/** Admin-managed free-shipping campaign (SiteSettings.freeShipping). */
export interface FreeShippingCampaign {
  active: boolean;
  /** ISO string or null — null means the campaign has no end date. */
  endsAt?: string | null;
  /** When true, every product ships free (productSlugs ignored). */
  allProducts: boolean;
  /** Slugs of the products that ship free (used when allProducts is false). */
  productSlugs: string[];
}

export const DEFAULT_FREE_SHIPPING: FreeShippingCampaign = {
  active: false,
  endsAt: null,
  allProducts: false,
  productSlugs: [],
};

/** Campaign is switched on and (if it has an end time) not yet expired. */
export function isFreeShippingLive(c: Partial<FreeShippingCampaign> | null | undefined): boolean {
  if (!c?.active) return false;
  if (!c.endsAt) return true;
  const t = new Date(c.endsAt).getTime();
  return !isNaN(t) && t > Date.now();
}

/**
 * Is shipping FREE for this cart? Only when the campaign is live AND every
 * item is covered — either "all products" is on, or every cart slug is among
 * the selected products. One non-covered item means normal Dhaka rates.
 */
export function cartCoveredByFreeShipping(
  slugs: string[],
  c: Partial<FreeShippingCampaign> | null | undefined
): boolean {
  if (!isFreeShippingLive(c)) return false;
  if (slugs.length === 0) return false;
  if (c?.allProducts) return true;
  const set = new Set((c?.productSlugs ?? []).filter(Boolean));
  return slugs.every((s) => set.has(s));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function discountPercent(price: number, comparePrice?: number): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function stars(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

/** Minimum gap (৳1) between the two price-filter handles — they can never meet. */
export const PRICE_GAP = 1;

/** Clamp the min price handle: never below the floor, never within GAP of max. */
export function clampPriceMin(value: number, lo: number, currentMax: number, gap = PRICE_GAP): number {
  return Math.max(lo, Math.min(Math.round(value), currentMax - gap));
}

/** Clamp the max price handle: never above the ceiling, never within GAP of min. */
export function clampPriceMax(value: number, currentMin: number, hi: number, gap = PRICE_GAP): number {
  return Math.min(hi, Math.max(Math.round(value), currentMin + gap));
}

/**
 * Normalize sizes from any source (admin form, API, seed): split entries
 * joined with "," or "|" (e.g. "m | xl" -> ["M", "XL"]), trim, dedupe.
 */
export function normalizeSizesInput(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : [];
  const out: string[] = [];
  for (const raw of arr) {
    for (const part of String(raw).split(/[,|]/)) {
      const s = part.trim();
      if (!s) continue;
      const val = /^[a-z]+$/i.test(s) ? s.toUpperCase() : s;
      if (!out.includes(val)) out.push(val);
    }
  }
  return out;
}

/**
 * Make a Mongoose `.lean()` result safe to pass from a Server Component to a
 * Client Component. `.lean()` still returns ObjectId instances — including
 * the auto-generated `_id` on every color / specification / variant
 * subdocument — and Date objects, which React Server Components cannot
 * serialize ("Only plain objects can be passed to Client Components").
 * A JSON round-trip converts ObjectIds to their hex strings and Dates to
 * ISO strings, leaving only plain JSON values. Apply it to any lean query
 * result before it crosses the server → client boundary.
 */
export function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
