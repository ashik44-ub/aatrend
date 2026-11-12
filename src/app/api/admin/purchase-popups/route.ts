import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

const DEFAULT_INTERVAL_MINUTES = 5;
const WINDOW_DAYS = 30;

function cleanPopup(v: unknown, stored: Record<string, unknown>) {
  const b = (v ?? {}) as Record<string, unknown>;
  const interval =
    b.intervalMinutes !== undefined && b.intervalMinutes !== null && b.intervalMinutes !== ""
      ? Math.min(60, Math.max(1, Math.round(Number(b.intervalMinutes)) || DEFAULT_INTERVAL_MINUTES))
      : Math.min(
          60,
          Math.max(1, Math.round(Number(stored.intervalMinutes ?? DEFAULT_INTERVAL_MINUTES)) || DEFAULT_INTERVAL_MINUTES)
        );
  return {
    enabled: b.enabled !== undefined ? !!b.enabled : stored.enabled !== undefined ? !!stored.enabled : true,
    intervalMinutes: interval,
  };
}

/**
 * Purchase-popup settings (Admin → Purchase Popups). Staff roles (admin +
 * administration, like the shipping pages) may read and write ONLY this
 * one block — every other setting stays behind the admin-only settings API.
 */
export async function GET() {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const [doc, recentOrderCount] = await Promise.all([
      SiteSettings.findOne({ key: "site" }).lean(),
      Order.countDocuments({
        status: { $ne: "Cancelled" },
        createdAt: { $gte: new Date(Date.now() - WINDOW_DAYS * 86400000) },
      }),
    ]);
    const stored = ((doc?.purchasePopup ?? {}) as Record<string, unknown>);
    return NextResponse.json({
      purchasePopup: cleanPopup(undefined, stored),
      recentOrderCount,
    });
  } catch (e) {
    console.error("admin purchase-popup get error", e);
    return NextResponse.json({ error: "Failed to load purchase popup settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    if (!body.purchasePopup) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    await connectDB();
    const stored = await SiteSettings.findOne({ key: "site" }).lean();
    const storedPopup = ((stored?.purchasePopup ?? {}) as Record<string, unknown>);
    const purchasePopup = cleanPopup(body.purchasePopup, storedPopup);
    const doc = await SiteSettings.findOneAndUpdate(
      { key: "site" },
      { $set: { purchasePopup } },
      { upsert: true, new: true }
    ).lean();
    const recentOrderCount = await Order.countDocuments({
      status: { $ne: "Cancelled" },
      createdAt: { $gte: new Date(Date.now() - WINDOW_DAYS * 86400000) },
    });
    return NextResponse.json({
      ok: true,
      purchasePopup: cleanPopup((doc?.purchasePopup ?? {}) as unknown as Record<string, unknown>, {}),
      recentOrderCount,
    });
  } catch (e) {
    console.error("admin purchase-popup put error", e);
    return NextResponse.json({ error: "Failed to save purchase popup settings." }, { status: 500 });
  }
}
