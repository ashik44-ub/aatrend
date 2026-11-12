"use client";

import { useEffect, useState } from "react";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

export default function AdminFlashSalePage() {
  const [form, setForm] = useState({
    active: true,
    title: "Flash Sale",
    subtitle: "",
    discountText: "Up To 70% Off",
    endsAt: "",
    buttonText: "Shop Sale Now",
    buttonLink: "/shop?onSale=1",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.flashSale) {
          setForm({
            active: d.flashSale.active,
            title: d.flashSale.title ?? "Flash Sale",
            subtitle: d.flashSale.subtitle ?? "",
            discountText: d.flashSale.discountText ?? "Up To 70% Off",
            endsAt: d.flashSaleEndsAtLocal ?? "",
            buttonText: d.flashSale.buttonText ?? "Shop Sale Now",
            buttonLink: d.flashSale.buttonLink ?? "/shop?onSale=1",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flashSale: {
          active: form.active,
          title: form.title,
          subtitle: form.subtitle,
          discountText: form.discountText,
          endsAt: form.endsAt || undefined,
          buttonText: form.buttonText,
          buttonLink: form.buttonLink,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Flash sale saved — it shows on the home page right away." : data.error ?? "Failed to save.");
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Flash Sale</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The orange flash-sale banner on the home page. Turn it off, or set a past end time, and the banner disappears.
      </p>
      <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-5 w-5 accent-orange-600"
          />
          Show flash sale banner on the home page
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">Small label (e.g. Flash Sale)</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Discount text (big headline)</label>
          <input value={form.discountText} onChange={(e) => setForm({ ...form, discountText: e.target.value })} placeholder="Up To 70% Off" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subtitle (optional)</label>
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Limited time only" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Sale ends at (date + time)</label>
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className={input}
          />
          <p className="mt-1 text-xs text-zinc-500">The countdown ticks down to this time. After it passes, the banner hides itself.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Button text</label>
            <input value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Button link</label>
            <input value={form.buttonLink} onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} placeholder="/shop?onSale=1" className={input} />
          </div>
        </div>
        {msg && <p className={`text-sm ${msg.startsWith("Flash sale saved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Flash Sale"}
        </button>
      </form>
    </div>
  );
}
