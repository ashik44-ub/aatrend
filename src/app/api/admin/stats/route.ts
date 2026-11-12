import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const [orders, products, customers] = await Promise.all([
      Order.find({ status: { $ne: "Cancelled" } }).sort({ createdAt: -1 }).lean(),
      Product.find({}).lean(),
      User.countDocuments({ role: "customer" }),
    ]);

    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const totalOrders = await Order.countDocuments();
    const conversion = totalOrders > 0 ? Math.round((totalOrders / Math.max(totalOrders * 30, 1)) * 1000) / 10 : 0;

    // Last 14 days revenue series.
    const days: { date: string; revenue: number; orders: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayOrders = orders.filter((o) => new Date(o.createdAt).toISOString().slice(0, 10) === key);
      days.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: Math.round(dayOrders.reduce((s, o) => s + o.total, 0) * 100) / 100,
        orders: dayOrders.length,
      });
    }

    const topProducts = [...products]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((p) => ({ name: p.name, slug: p.slug, sold: p.sold, revenue: Math.round(p.sold * p.price * 100) / 100, price: p.price, image: p.images?.[0] ?? "" }));

    const recentOrders = orders.slice(0, 8).map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      items: o.items.length,
    }));

    const channels = [
      { name: "Organic Search", value: 35 },
      { name: "Paid Search", value: 22 },
      { name: "Social Media", value: 18 },
      { name: "Direct", value: 12 },
      { name: "Email", value: 8 },
      { name: "Referral", value: 5 },
    ];

    return NextResponse.json({
      revenue: Math.round(revenue * 100) / 100,
      totalOrders,
      totalProducts: products.length,
      customers,
      conversion,
      daily: days,
      topProducts,
      recentOrders,
      channels,
    });
  } catch (e) {
    console.error("admin stats error", e);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
