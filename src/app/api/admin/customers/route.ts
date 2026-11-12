import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const users = await User.find({ role: "customer" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const customers = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.find({ customerEmail: u.email }).lean();
        const joined = u.createdAt ? new Date(u.createdAt) : null;
        return {
          name: u.name,
          email: u.email,
          joined: joined && !isNaN(joined.getTime()) ? joined.toISOString() : null,
          orders: orders.length,
          spent: Math.round(orders.reduce((s, o) => s + o.total, 0) * 100) / 100,
        };
      })
    );
    return NextResponse.json({ customers });
  } catch (e) {
    console.error("admin customers error", e);
    return NextResponse.json({ error: "Failed to load customers." }, { status: 500 });
  }
}
