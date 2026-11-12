"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

interface PickProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  images: string[];
}

export default function AdminFreeShippingPage() {
  const [form, setForm] = useState({
    active: false,
    endsAt: "",
    allProducts: false,
    productIds: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  // Product picker
  const [pq, setPq] = useState("");
  const [results, setResults] = useState<PickProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PickProduct[]>([]);

  useEffect(() => {
    fetch("/api/admin/shipping")
      .then((r) => r.json())
      .then((d) => {
        if (d.freeShipping) {
          const fs = d.freeShipping;
          setForm({
            active: !!fs.active,
            endsAt: d.freeShippingEndsAtLocal ?? "",
            allProducts: !!fs.allProducts,
            productIds: Array.isArray(fs.productIds) ? fs.productIds : [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Load the selected products' details (names/prices) for display.
  useEffect(() => {
    if (form.productIds.length === 0) {
      setSelected([]);
      return;
    }
    const load = async () => {
      const found: PickProduct[] = [];
      for (const slug of form.productIds) {
        try {
          const r = await fetch(`/api/admin/products?q=${encodeURIComponent(slug)}&page=1`);
          const d = await r.json();
          const p = (d.products ?? []).find((x: PickProduct) => x.slug === slug);
          if (p) found.push(p);
        } catch {
          /* keep going */
        }
      }
      setSelected(found);
    };
    load();
  }, [form.productIds]);

  const searchProducts = async () => {
    setSearching(true);
    try {
      const r = await fetch(`/api/admin/products?q=${encodeURIComponent(pq)}&page=1`);
      const d = await r.json();
      setResults((d.products ?? []).slice(0, 10));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleProduct = (p: PickProduct) => {
    const has = form.productIds.includes(p.slug);
    setForm({
      ...form,
      productIds: has ? form.productIds.filter((s) => s !== p.slug) : [...form.productIds, p.slug],
    });
    setSelected((prev) =>
      has ? prev.filter((x) => x.slug !== p.slug) : [...prev, p]
    );
  };

  const selectAllResults = () => {
    const slugs = results.map((p) => p.slug);
    const merged = Array.from(new Set([...form.productIds, ...slugs]));
    setForm({ ...form, productIds: merged });
    setSelected((prev) => {
      const known = new Set(prev.map((x) => x.slug));
      return [...prev, ...results.filter((p) => !known.has(p.slug))];
    });
  };

  const clearSelection = () => {
    setForm({ ...form, productIds: [] });
    setSelected([]);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/shipping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        freeShipping: {
          active: form.active,
          endsAt: form.endsAt || "",
          allProducts: form.allProducts,
          productIds: form.allProducts ? [] : form.productIds,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Free shipping campaign saved." : data.error ?? "Failed to save.");
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  const coveredNote = form.allProducts
    ? "Every product in the store ships free while the campaign is on."
    : form.productIds.length === 0
      ? "No products picked yet — pick products below, or tick “All products”."
      : `${form.productIds.length} product(s) ship free while the campaign is on.`;

  return (
    <div>
      <h1 className="text-2xl font-black">Free Shipping</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Run a free-delivery campaign whenever you like. Shipping is ৳0 only when the campaign is on and{" "}
        <b>every</b> item in the customer&apos;s cart is covered — one non-covered item and the normal
        Dhaka rates (৳70 inside / ৳120 outside) apply to the whole order.
      </p>
      <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-5 w-5 accent-orange-600"
          />
          Free shipping campaign is ON
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">Campaign ends at (date + time, optional)</label>
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className={input}
          />
          <p className="mt-1 text-xs text-zinc-500">Leave empty for no end date — the campaign runs until you switch it off. After this time passes, normal shipping rates apply again.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.allProducts}
            onChange={(e) => setForm({ ...form, allProducts: e.target.checked })}
            className="h-5 w-5 accent-emerald-600"
          />
          All products — every product in the store ships free
        </label>

        {!form.allProducts && (
          <div className="border-t pt-4">
            <p className="text-sm font-bold">Products with free shipping</p>
            <p className="mt-1 text-xs text-zinc-500">{coveredNote}</p>
            <div className="mt-3 flex gap-2">
              <input
                value={pq}
                onChange={(e) => setPq(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchProducts();
                  }
                }}
                placeholder="Search products by name…"
                className={input}
              />
              <button type="button" onClick={searchProducts} disabled={searching} className="shrink-0 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">
                {searching ? "…" : "Search"}
              </button>
            </div>
            {results.length > 0 && (
              <>
                <div className="mt-2 flex gap-2 text-xs">
                  <button type="button" onClick={selectAllResults} className="font-bold text-orange-600 hover:underline">
                    Select all {results.length} results
                  </button>
                  <button type="button" onClick={clearSelection} className="font-bold text-zinc-500 hover:underline">
                    Clear selection
                  </button>
                </div>
                <div className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl border p-2">
                  {results.map((p) => {
                    const on = form.productIds.includes(p.slug);
                    return (
                      <label key={p.slug} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-emerald-50">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleProduct(p)}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                        <span className="flex-1 font-medium">{p.name}</span>
                        <span className="text-xs text-zinc-500">{p.category}</span>
                        <span className="font-bold">{formatPrice(p.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
            {selected.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.map((p) => (
                  <span key={p.slug} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {p.name}
                    <button type="button" onClick={() => toggleProduct(p)} aria-label={`Remove ${p.name}`} className="ml-1 font-black hover:text-red-600">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {form.productIds.length > 0 && selected.length === 0 && (
              <p className="mt-2 text-xs text-zinc-500">{form.productIds.length} product(s) selected.</p>
            )}
          </div>
        )}

        {msg && <p className={`text-sm ${msg.startsWith("Free shipping campaign saved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Free Shipping"}
        </button>
      </form>
    </div>
  );
}
