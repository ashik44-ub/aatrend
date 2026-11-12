"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
}
interface OrderRow {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return <p className="mx-auto max-w-7xl px-4 py-16 text-center text-zinc-500">Loading your orders...</p>;
  }
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-zinc-500">Please sign in to see your orders.</p>
        <Link href="/login?callbackUrl=/orders" className="mt-4 inline-block rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">My Orders</h1>
      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-500">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white">Start Shopping →</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{o.orderNumber}</p>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{o.status}</span>
                <span className="text-sm text-zinc-500">{new Date(o.createdAt).toLocaleDateString()} · {o.paymentMethod}</span>
                <span className="font-black">{formatPrice(o.total)}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {o.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <img src={it.image} alt={it.name} className="h-10 w-10 rounded-lg object-cover" />
                    <span className="flex-1">{it.name} {it.variant ? `(${it.variant})` : ""} × {it.quantity}</span>
                    <span>{formatPrice(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
