"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

interface Row {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  expiresAt: string;
  usageLimit: string | number;
  usedCount: number;
  active: boolean;
}

const EMPTY = {
  code: "",
  type: "percent" as "percent" | "fixed",
  value: "",
  minOrder: "",
  expiresAt: "",
  usageLimit: "",
  active: true,
};

export default function AdminCouponsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((d) => setRows(d.coupons ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const body = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrder: form.minOrder === "" ? 0 : Number(form.minOrder),
      expiresAt: form.expiresAt || undefined,
      usageLimit: form.usageLimit === "" ? undefined : Number(form.usageLimit),
      active: form.active,
    };
    const res = await fetch(editing ? `/api/admin/coupons/${editing}` : "/api/admin/coupons", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to save coupon.");
      return;
    }
    setForm(EMPTY);
    setEditing(null);
    setMsg(editing ? "Coupon updated." : "Coupon created.");
    load();
  };

  const edit = (r: Row) => {
    setEditing(r._id);
    setForm({
      code: r.code,
      type: r.type,
      value: String(r.value),
      minOrder: r.minOrder ? String(r.minOrder) : "",
      expiresAt: r.expiresAt ?? "",
      usageLimit: r.usageLimit === "" ? "" : String(r.usageLimit),
      active: r.active,
    });
    setMsg("");
  };

  const del = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  };

  const toggle = async (r: Row) => {
    await fetch(`/api/admin/coupons/${r._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !r.active }),
    });
    load();
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Coupons ({rows.length})</h1>
      <p className="mt-1 text-sm text-zinc-500">Customers apply these codes at checkout. Percent takes % off, fixed takes a $ amount off.</p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <p className="font-bold">{editing ? `Edit ${form.code}` : "+ New Coupon"}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="FLASH20"
              disabled={!!editing}
              className={`${input} uppercase disabled:bg-zinc-100`}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Discount type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })} className={input}>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed amount (৳)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{form.type === "fixed" ? "Amount (৳)" : "Percent (%)"}</label>
            <input type="number" min="1" max={form.type === "percent" ? 90 : undefined} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "fixed" ? "10" : "20"} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Minimum order (৳) — optional</label>
            <input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="0" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Expires on — optional</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Usage limit — optional</label>
            <input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" className={input} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-orange-600" />
            Active
          </label>
          <button disabled={busy} className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {busy ? "Saving…" : editing ? "Update Coupon" : "Create Coupon"}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="rounded-full border px-5 py-2.5 text-sm font-bold">
              Cancel
            </button>
          )}
          {msg && <p className={`text-sm ${msg.includes("Failed") || msg.includes("already") || msg.includes("required") || msg.includes("exceed") ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-b last:border-0">
                <td className="px-4 py-3 font-bold">{r.code}</td>
                <td className="px-4 py-3">{r.type === "fixed" ? formatPrice(r.value) : `${r.value}%`}</td>
                <td className="px-4 py-3">{r.minOrder > 0 ? formatPrice(r.minOrder) : "—"}</td>
                <td className="px-4 py-3">{r.expiresAt || "—"}</td>
                <td className="px-4 py-3">{r.usedCount}{r.usageLimit !== "" ? ` / ${r.usageLimit}` : ""}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(r)} className={`rounded-full px-3 py-1 text-xs font-bold ${r.active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {r.active ? "Active" : "Off"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(r)} className="mr-3 font-bold text-orange-600 hover:underline">Edit</button>
                  <button onClick={() => del(r._id, r.code)} className="font-bold text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-500">No coupons yet — create one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
