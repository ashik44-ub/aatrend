import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

const DEFAULT_INTERVAL_MINUTES = 5;
const MAX_ORDERS = 20;
const WINDOW_DAYS = 30;

/**
 * Public purchase-popup feed — REAL recent orders only, sanitized.
 *
 * The storefront popup shows one of these at a time ("Amena from Dhaka
 * just purchased …"). Only the buyer's first name, delivery area, product
 * name + thumbnail and the order time are exposed — never phone, email,
 * full address, or amounts. Cancelled orders are excluded (no purchase
 * happened). No auth needed: everything returned here is public-safe.
 */
export async function GET() {
  try {
    await connectDB();
    const [doc, orders] = await Promise.all([
      SiteSettings.findOne({ key: "site" }).lean(),
      Order.find({
        status: { $ne: "Cancelled" },
        createdAt: { $gte: new Date(Date.now() - WINDOW_DAYS * 86400000) },
      })
        .sort({ createdAt: -1 })
        .limit(MAX_ORDERS)
        .lean(),
    ]);
    const pp = (doc?.purchasePopup ?? {}) as {
      enabled?: unknown;
      intervalMinutes?: unknown;
    };
    const intervalMinutes = Math.min(
      60,
      Math.max(1, Math.round(Number(pp.intervalMinutes ?? DEFAULT_INTERVAL_MINUTES)) || DEFAULT_INTERVAL_MINUTES)
    );
    return NextResponse.json({
      enabled: pp.enabled !== undefined ? !!pp.enabled : true,
      intervalMinutes,
      orders: orders
        .map((o) => {
          const first = o.items?.[0];
          if (!first?.name) return null;
          const firstName = String(o.customerName ?? "Someone").trim().split(/\s+/)[0] || "Someone";
          return {
            firstName,
            area: o.deliveryArea === "outside-dhaka" ? "Outside Dhaka" : "Dhaka",
            productName: String(first.name),
            productImage: String(first.image ?? ""),
            orderedAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
          };
        })
        .filter(Boolean),
    });
  } catch (e) {
    console.error("purchase-popup feed error", e);
    // Storefront renders without the popup when the DB is unreachable.
    return NextResponse.json({
      enabled: true,
      intervalMinutes: DEFAULT_INTERVAL_MINUTES,
      orders: [],
    });
  }
}
