import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim();
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = 10;
    const filter: Record<string, unknown> = {};
    if (status && status !== "All") filter.status = status;
    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { customerName: { $regex: q, $options: "i" } },
        { customerEmail: { $regex: q, $options: "i" } },
      ];
    }
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("admin orders list error", e);
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}
