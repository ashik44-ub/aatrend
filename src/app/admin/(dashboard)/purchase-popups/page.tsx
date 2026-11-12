"use client";

import { useEffect, useState } from "react";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

export default function AdminPurchasePopupsPage() {
  const [form, setForm] = useState({ enabled: true, intervalMinutes: 5 });
  const [recentOrderCount, setRecentOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/purchase-popups")
      .then((r) => r.json())
      .then((d) => {
        if (d.purchasePopup) {
          setForm({
            enabled: !!d.purchasePopup.enabled,
            intervalMinutes: Math.min(60, Math.max(1, Math.round(Number(d.purchasePopup.intervalMinutes) || 5))),
          });
        }
        if (typeof d.recentOrderCount === "number") setRecentOrderCount(d.recentOrderCount);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const intervalMinutes = Math.min(60, Math.max(1, Math.round(Number(form.intervalMinutes) || 5)));
    const res = await fetch("/api/admin/purchase-popups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchasePopup: { enabled: form.enabled, intervalMinutes } }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setForm({ enabled: !!data.purchasePopup.enabled, intervalMinutes: data.purchasePopup.intervalMinutes });
      if (typeof data.recentOrderCount === "number") setRecentOrderCount(data.recentOrderCount);
      setMsg("Purchase popup settings saved.");
    } else {
      setMsg(data.error ?? "Failed to save.");
    }
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Purchase Popups</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Show visitors a small popup at the bottom-right of the store whenever someone buys — social
        proof that real people are shopping here. The first popup appears about 15 seconds after a
        page loads, then repeats every few minutes.
      </p>
      <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="h-5 w-5 accent-orange-600"
          />
          Purchase popup is ON
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">Show a popup every (minutes)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={form.intervalMinutes}
            onChange={(e) => setForm({ ...form, intervalMinutes: Number(e.target.value) })}
            className={input}
          />
          <p className="mt-1 text-xs text-zinc-500">Between 1 and 60 minutes. Default is 5 minutes.</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-4 text-sm text-zinc-700">
          <p className="font-bold">What visitors will see</p>
          <p className="mt-1">
            {recentOrderCount === null
              ? "Loading order count…"
              : recentOrderCount === 0
                ? "No orders in the last 30 days yet — the popup stays hidden until the first real order comes in."
                : `${recentOrderCount} real order(s) from the last 30 days will rotate in the popup (buyer first name + area, product name + photo, and how long ago).`}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Only real orders are ever shown — no fake buyers or made-up purchases. Cancelled orders are skipped.
          </p>
        </div>
        {msg && <p className={`text-sm ${msg === "Purchase popup settings saved." ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Purchase Popup"}
        </button>
      </form>
    </div>
  );
}
