import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

/** Public order lookup by order number (the number is a random token). */
export async function GET(_req: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params;
    await connectDB();
    const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    console.error("order lookup error", e);
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 });
  }
}
