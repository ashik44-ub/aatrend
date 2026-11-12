"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, formatTaka, DELIVERY_AREA_LABELS, type DeliveryArea } from "@/lib/utils";

interface OrderDetail {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; image: string; price: number; quantity: number; variant?: string }[];
  subtotal: number;
  discount: number;
  shipping: number;
  deliveryArea?: DeliveryArea;
  /** True when this order shipped free under the free-shipping campaign. */
  freeShipping?: boolean;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  status: string;
  shippingAddress: { address: string; city: string; zip: string; country: string; phone?: string };
  createdAt: string;
}

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const [num, setNum] = useState("");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchParams.then(({ order }) => {
      if (!order) {
        setLoading(false);
        return;
      }
      setNum(order);
      fetch(`/api/orders/${encodeURIComponent(order)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.order) setOrder(d.order);
        })
        .finally(() => setLoading(false));
    });
  }, [searchParams]);

  const a = order?.shippingAddress;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">✓</div>
        <h1 className="mt-6 text-3xl font-black">Thank you! Your order is placed.</h1>
        {num && (
          <p className="mt-3 text-lg">
            Order number: <b className="text-orange-600">{num}</b>
          </p>
        )}
        <p className="mt-2 text-zinc-600">
          We&apos;ll send order updates to your email. You can track your order from your account.
        </p>
      </div>

      {loading && <p className="py-10 text-center text-zinc-500">Loading order details…</p>}

      {!loading && order && (
        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {it.image && <img src={it.image} alt={it.name} className="h-12 w-12 rounded-lg object-cover" />}
                  <span className="flex-1">
                    {it.name}
                    {it.variant ? ` (${it.variant})` : ""} × {it.quantity}
                  </span>
                  <b>{formatPrice(it.price * it.quantity)}</b>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Shipping{order.deliveryArea ? ` (${DELIVERY_AREA_LABELS[order.deliveryArea]})` : ""}</span><span>{order.shipping === 0 ? "FREE" : formatTaka(order.shipping)}</span></div>
              {order.freeShipping && (
                <p className="text-xs text-emerald-600">🎁 Free shipping campaign applied to this order.</p>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total</span><span>{formatPrice(order.total)}</span></div>
              <div className="flex justify-between"><span>Payment</span><span>{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span>Status</span><span>{order.status}</span></div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Shipping to</h2>
            <p className="mt-2 text-sm text-zinc-700">
              {order.customerName}
              <br />
              {a?.address}
              <br />
              {[a?.city, a?.zip, a?.country].filter(Boolean).join(", ")}
              {a?.phone ? <><br />Phone: {a.phone}</> : null}
            </p>
          </section>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/orders" className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">
          Track My Orders
        </Link>
        <Link href="/shop" className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-bold hover:border-orange-600">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
