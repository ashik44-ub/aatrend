import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/account");
  await connectDB();
  const orders = await Order.find({ customerEmail: session.user.email?.toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const isAdmin = (session.user as { role?: string }).role === "admin";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">My Account</h1>
      <p className="mt-1 text-zinc-500">
        Signed in as <b>{session.user.name}</b> ({session.user.email})
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Total Orders</p>
          <p className="mt-1 text-3xl font-black">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Total Spent</p>
          <p className="mt-1 text-3xl font-black">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Account Type</p>
          <p className="mt-1 text-3xl font-black capitalize">{isAdmin ? "Admin" : "Customer"}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/orders" className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">My Orders</Link>
        <Link href="/wishlist" className="rounded-full border px-6 py-3 text-sm font-bold hover:border-orange-600">Wishlist</Link>
        <Link href="/shop" className="rounded-full border px-6 py-3 text-sm font-bold hover:border-orange-600">Continue Shopping</Link>
        {isAdmin && (
          <Link href="/admin" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700">Admin Dashboard</Link>
        )}
      </div>
      <h2 className="mt-10 text-xl font-black">Recent Orders</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-zinc-500">No orders yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={String(o._id)} className="border-b last:border-0">
                  <td className="px-4 py-3 font-semibold">{o.orderNumber}</td>
                  <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{o.items.length}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
