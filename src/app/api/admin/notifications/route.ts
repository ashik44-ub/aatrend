import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

/**
 * Sidebar badge counts: unread contact messages + new (not yet opened) orders.
 * - admin sees both counts.
 * - administration sees the orders count only (Messages is admin-only, so
 *   unreadMessages is 0 for them and no badge is shown).
 * `viewed: { $ne: true }` counts both false and missing, so orders created
 * before the `viewed` field existed still count as new until opened.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext();
    if (!ctx || (ctx.role !== "admin" && ctx.role !== "administration")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const [newOrders, unreadMessages] = await Promise.all([
      Order.countDocuments({ viewed: { $ne: true } }),
      ctx.role === "admin" ? ContactMessage.countDocuments({ read: false }) : Promise.resolve(0),
    ]);
    return NextResponse.json({ unreadMessages, newOrders });
  } catch (e) {
    console.error("admin notifications error", e);
    return NextResponse.json({ error: "Failed to load counts." }, { status: 500 });
  }
}
