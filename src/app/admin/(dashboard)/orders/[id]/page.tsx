"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, formatTaka, DELIVERY_AREA_LABELS, type DeliveryArea } from "@/lib/utils";

interface OrderDetail {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { productId: string; name: string; image: string; price: number; quantity: number; variant?: string }[];
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

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    params.then(({ id }) =>
      fetch(`/api/admin/orders/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.order) {
            setOrder(d.order);
            // Opening the detail page marks the order as seen, so it leaves
            // the "new orders" badge count in the sidebar.
            fetch(`/api/admin/orders/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ viewed: true }),
            }).catch(() => {});
          } else setError(d.error ?? "Order not found.");
        })
        .catch(() => setError("Failed to load order."))
        .finally(() => setLoading(false))
    );
  }, [params]);

  const setStatus = async (s: string) => {
    if (!order) return;
    const res = await fetch(`/api/admin/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder({ ...order, status: s });
      setMsg(`Status updated to ${s}.`);
    } else {
      setMsg(data.error ?? "Failed to update status.");
    }
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;
  if (error || !order) {
    return (
      <div>
        <Link href="/admin/orders" className="text-sm font-semibold text-orange-600 hover:underline">← Back to Orders</Link>
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error || "Order not found."}</p>
      </div>
    );
  }

  const a = order.shippingAddress ?? ({} as OrderDetail["shippingAddress"]);

  return (
    <div>
      {/* Screen view — hidden when printing */}
      <div className="print:hidden">
      <Link href="/admin/orders" className="text-sm font-semibold text-orange-600 hover:underline">← Back to Orders</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black">{order.orderNumber}</h1>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{order.status}</span>
        <span className="text-sm text-zinc-500">{new Date(order.createdAt).toLocaleString()}</span>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
        >
          🖨️ Print Invoice
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Customer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Name</dt><dd className="font-semibold">{order.customerName}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Email</dt><dd className="font-semibold">{order.customerEmail}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Phone</dt><dd className="font-semibold">{a.phone || "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Payment</dt><dd className="font-semibold">{order.paymentMethod}{order.couponCode ? ` · Coupon ${order.couponCode}` : ""}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Delivery area</dt><dd className="font-semibold">{order.deliveryArea ? DELIVERY_AREA_LABELS[order.deliveryArea] : "—"}</dd></div>
            {order.freeShipping && (
              <div className="flex justify-between gap-4"><dt className="text-zinc-500">Shipping campaign</dt><dd className="font-semibold text-emerald-600">🎁 Free shipping applied</dd></div>
            )}
          </dl>
          <h3 className="mt-5 text-sm font-bold">Shipping address</h3>
          <p className="mt-1 text-sm text-zinc-700">
            {a.address || "—"}
            <br />
            {[a.city, a.zip, a.country].filter(Boolean).join(", ") || "—"}
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Update status</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${order.status === s ? "bg-orange-600 text-white" : "border bg-white hover:border-orange-600"}`}
              >
                {s}
              </button>
            ))}
          </div>
          {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Items ({order.items.length})</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              {it.image && <img src={it.image} alt={it.name} className="h-12 w-12 rounded-lg object-cover" />}
              <span className="flex-1">
                <b>{it.name}</b>
                {it.variant ? <span className="text-zinc-500"> ({it.variant})</span> : null}
                <span className="text-zinc-500"> × {it.quantity}</span>
              </span>
              <span className="font-bold">{formatPrice(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between"><span>Shipping{order.deliveryArea ? ` (${DELIVERY_AREA_LABELS[order.deliveryArea]})` : ""}</span><span>{order.shipping === 0 ? "FREE" : formatTaka(order.shipping)}</span></div>
          {order.freeShipping && (
            <p className="text-xs text-emerald-600">🎁 Free shipping campaign applied to this order.</p>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </section>
      </div>

      {/* Printable invoice — only visible when printing (Print → Save as PDF also works) */}
      <div className="hidden text-black print:block">
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
          <div>
            <p className="text-2xl font-black">aatrend</p>
            <p className="text-sm text-zinc-600">Invoice</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">{order.orderNumber}</p>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
            <p>Status: {order.status}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
          <div>
            <h2 className="font-bold">Bill To</h2>
            <p>{order.customerName}</p>
            <p>{order.customerEmail}</p>
            <p>{a.phone || "—"}</p>
          </div>
          <div>
            <h2 className="font-bold">Ship To</h2>
            <p>{a.address || "—"}</p>
            <p>{[a.city, a.zip, a.country].filter(Boolean).join(", ") || "—"}</p>
            <p>Payment: {order.paymentMethod}{order.couponCode ? ` · Coupon ${order.couponCode}` : ""}</p>
          </div>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{it.name}{it.variant ? ` (${it.variant})` : ""}</td>
                <td className="py-2">{it.quantity}</td>
                <td className="py-2">{formatPrice(it.price)}</td>
                <td className="py-2 text-right">{formatPrice(it.price * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-4 w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between"><span>Shipping{order.deliveryArea ? ` (${DELIVERY_AREA_LABELS[order.deliveryArea]})` : ""}</span><span>{order.shipping === 0 ? "FREE" : formatTaka(order.shipping)}</span></div>
          {order.freeShipping && (
            <div className="flex justify-between"><span>Shipping campaign</span><span>Free shipping applied</span></div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
        <p className="mt-10 text-center text-xs text-zinc-500">Thank you for shopping with aatrend!</p>
      </div>
    </div>
  );
}
