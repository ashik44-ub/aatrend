"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Customer {
  name: string;
  email: string;
  joined: string;
  orders: number;
  spent: number;
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setRows(d.customers ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-black">Customers ({rows.length})</h1>
      {loading ? (
        <p className="py-10 text-center text-zinc-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">No registered customers yet. Guest checkouts appear in Orders.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.email} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-zinc-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      if (!c.joined) return "—";
                      const d = new Date(c.joined);
                      return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
                    })()}
                  </td>
                  <td className="px-4 py-3">{c.orders}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(c.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
