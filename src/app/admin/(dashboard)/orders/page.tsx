"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import Pagination from "@/components/Pagination";

interface OrderRow {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  shippingAddress?: { phone?: string };
  items: { name: string; quantity: number }[];
}

const STATUSES = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrdersPage() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get("status") ?? "All";
  const page = Number(params.get("page") || 1);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/orders?status=${status}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.orders ?? []);
        setPages(d.pages ?? 1);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  const setStatus = async (id: string, s: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-black">Orders ({total})</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => router.push(`/admin/orders?status=${s}`)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${status === s ? "bg-orange-600 text-white" : "border bg-white"}`}
          >
            {s}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="py-10 text-center text-zinc-500">Loading...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o._id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/orders/${o._id}`} className="text-orange-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.customerName}</p>
                    <p className="text-xs text-zinc-400">{o.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3">{o.shippingAddress?.phone || "—"}</td>
                  <td className="px-4 py-3">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3">{o.paymentMethod}</td>
                  <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o._id, e.target.value)}
                      className="rounded-lg border px-2 py-1.5 text-xs font-bold"
                    >
                      {STATUSES.slice(1).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} href={(n) => `/admin/orders?status=${status}&page=${n}`} />
    </div>
  );
}
