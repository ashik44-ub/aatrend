import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DEFAULT_FREE_SHIPPING, DEFAULT_SHIPPING_RATES } from "@/lib/utils";
import { SiteSettings } from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

/** Public delivery rates (Taka) + the live free-shipping campaign — read by
 *  checkout/cart so the totals always match the admin-managed settings.
 *  No auth needed: rates and campaign scope are public. */
export async function GET() {
  try {
    await connectDB();
    const doc = await SiteSettings.findOne({ key: "site" }).lean();
    const sh = (doc?.shipping ?? {}) as { insideDhaka?: unknown; outsideDhaka?: unknown };
    const fr = (doc?.freeShipping ?? {}) as {
      active?: unknown;
      endsAt?: unknown;
      allProducts?: unknown;
      productIds?: unknown;
    };
    return NextResponse.json({
      insideDhaka: Math.max(0, Number(sh.insideDhaka ?? DEFAULT_SHIPPING_RATES.insideDhaka) || 0),
      outsideDhaka: Math.max(0, Number(sh.outsideDhaka ?? DEFAULT_SHIPPING_RATES.outsideDhaka) || 0),
      freeShipping: {
        active: !!fr.active,
        endsAt: fr.endsAt ? new Date(fr.endsAt as string).toISOString() : null,
        allProducts: !!fr.allProducts,
        productSlugs: Array.isArray(fr.productIds)
          ? (fr.productIds as unknown[]).map((s) => String(s)).filter(Boolean)
          : [],
      },
    });
  } catch (e) {
    console.error("shipping rates error", e);
    return NextResponse.json({ ...DEFAULT_SHIPPING_RATES, freeShipping: DEFAULT_FREE_SHIPPING });
  }
}
