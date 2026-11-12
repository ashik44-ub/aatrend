"use client";

import { useEffect, useState } from "react";
import { formatTaka } from "@/lib/utils";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

export default function AdminShippingPage() {
  const [form, setForm] = useState({ insideDhaka: 70, outsideDhaka: 120 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/shipping")
      .then((r) => r.json())
      .then((d) => {
        if (d.shipping) {
          setForm({
            insideDhaka: Number(d.shipping.insideDhaka ?? 70) || 0,
            outsideDhaka: Number(d.shipping.outsideDhaka ?? 120) || 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/shipping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipping: {
          insideDhaka: Math.max(0, Math.round(Number(form.insideDhaka)) || 0),
          outsideDhaka: Math.max(0, Math.round(Number(form.outsideDhaka)) || 0),
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Shipping charges saved — checkout uses the new rates right away." : data.error ?? "Failed to save.");
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">🚚 Shipping Charges</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Delivery charges in Taka. Customers pick their delivery area at checkout and the matching charge is added to the order.
      </p>
      <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Inside Dhaka (৳)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={form.insideDhaka}
            onChange={(e) => setForm({ ...form, insideDhaka: Number(e.target.value) })}
            className={input}
          />
          <p className="mt-1 text-xs text-zinc-500">Current charge shown at checkout: <b>{formatTaka(form.insideDhaka)}</b></p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Outside Dhaka (৳)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={form.outsideDhaka}
            onChange={(e) => setForm({ ...form, outsideDhaka: Number(e.target.value) })}
            className={input}
          />
          <p className="mt-1 text-xs text-zinc-500">Current charge shown at checkout: <b>{formatTaka(form.outsideDhaka)}</b></p>
        </div>
        <p className="rounded-xl bg-orange-50 p-3 text-xs text-zinc-600">
          The charge is added to every order — there is no free-shipping threshold. Orders placed before this change keep the shipping amount they were created with.
        </p>
        {msg && <p className={`text-sm ${msg.startsWith("Shipping charges saved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Shipping Charges"}
        </button>
      </form>
    </div>
  );
}
