import Link from "next/link";
import { headers } from "next/headers";
import { ChannelsDonut, RevenueChart } from "@/components/AdminCharts";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const cookie = h.get("cookie") ?? "";
  const res = await fetch(`${proto}://${host}/api/admin/stats`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const cards = [
    { label: "Total Revenue", value: formatPrice(stats.revenue), delta: "↑ 12.5% vs last month", icon: "💰" },
    { label: "Total Orders", value: String(stats.totalOrders), delta: "↑ 8.3% vs last month", icon: "📦" },
    { label: "Products", value: String(stats.totalProducts), delta: "Across 6 categories", icon: "🛍️" },
    { label: "Conversion", value: `${stats.conversion}%`, delta: "Orders / visitors", icon: "📈" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-black">Marketing Dashboard</h1>
      <p className="text-sm text-zinc-500">Track performance, optimise campaigns, and grow your brand — all in one place.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">{c.label}</p>
              <span className="text-xl">{c.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-black">{c.value}</p>
            <p className="mt-1 text-xs text-green-600">{c.delta}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Revenue — Last 14 Days</h2>
          <p className="text-xs text-zinc-500">Revenue and orders over time</p>
          <div className="mt-4"><RevenueChart data={stats.daily} /></div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Traffic Channels</h2>
          <p className="text-xs text-zinc-500">Share of store traffic</p>
          <div className="mt-4"><ChannelsDonut data={stats.channels} /></div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Top Products</h2>
          <ul className="mt-4 space-y-3">
            {stats.topProducts.map((p: { name: string; slug: string; sold: number; revenue: number; image: string }) => (
              <li key={p.slug} className="flex items-center gap-3">
                <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                <span className="flex-1 truncate font-medium">{p.name}</span>
                <span className="text-sm text-zinc-500">{p.sold} sold</span>
                <b>{formatPrice(p.revenue)}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-orange-600">View All →</Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-500">
                  <th className="py-2">Order</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o: { orderNumber: string; customerName: string; total: number; status: string }) => (
                  <tr key={o.orderNumber} className="border-b last:border-0">
                    <td className="py-2 font-semibold">{o.orderNumber}</td>
                    <td className="py-2">{o.customerName}</td>
                    <td className="py-2 font-bold">{formatPrice(o.total)}</td>
                    <td className="py-2"><span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
