import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const order = await Order.findById(id).lean();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    console.error("admin order get error", e);
    return NextResponse.json({ error: "Failed to load order." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    // Marking an order as viewed (admin opened the detail page) is separate
    // from its fulfilment status — a viewed order can still be Pending.
    if (body.viewed === true) {
      const order = await Order.findByIdAndUpdate(id, { viewed: true }, { new: true }).lean();
      if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      return NextResponse.json({ ok: true, viewed: true });
    }
    const { status } = body;
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ ok: true, status: order.status });
  } catch (e) {
    console.error("admin order update error", e);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
