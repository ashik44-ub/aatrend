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

interface PickCategory {
  _id: string;
  name: string;
  group: string;
  active: boolean;
}

export default function AdminSummerSalePage() {
  const [form, setForm] = useState({
    active: true,
    title: "Summer Sale",
    subtitle: "Beat the heat with fresh summer styles",
    discountText: "Up To 50% Off",
    endsAt: "",
    buttonText: "Shop Summer Sale",
    buttonLink: "/shop?sale=summer",
    bannerImage: "",
    themeColor: "#f59e0b",
    productIds: [] as string[],
    categories: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  // Product picker
  const [pq, setPq] = useState("");
  const [results, setResults] = useState<PickProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PickProduct[]>([]);
  // Category picker
  const [allCats, setAllCats] = useState<PickCategory[]>([]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.summerSale) {
          const ss = d.summerSale;
          setForm({
            active: ss.active,
            title: ss.title ?? "Summer Sale",
            subtitle: ss.subtitle ?? "",
            discountText: ss.discountText ?? "Up To 50% Off",
            endsAt: d.summerSaleEndsAtLocal ?? "",
            buttonText: ss.buttonText ?? "Shop Summer Sale",
            buttonLink: ss.buttonLink ?? "/shop?sale=summer",
            bannerImage: ss.bannerImage ?? "",
            themeColor: ss.themeColor ?? "#f59e0b",
            productIds: Array.isArray(ss.productIds) ? ss.productIds : [],
            categories: Array.isArray(ss.categories) ? ss.categories : [],
          });
        }
      })
      .finally(() => setLoading(false));
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setAllCats(Array.isArray(d.categories) ? d.categories : []))
      .catch(() => setAllCats([]));
  }, []);

  // Load the selected products' details (names/prices) for display.
  useEffect(() => {
    if (form.productIds.length === 0) {
      setSelected([]);
      return;
    }
    // Resolve names via the admin products search (matches name/slug/category).
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

  const toggleCategory = (name: string) => {
    setForm({
      ...form,
      categories: form.categories.includes(name)
        ? form.categories.filter((c) => c !== name)
        : [...form.categories, name],
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summerSale: {
          active: form.active,
          title: form.title,
          subtitle: form.subtitle,
          discountText: form.discountText,
          endsAt: form.endsAt || undefined,
          buttonText: form.buttonText,
          buttonLink: form.buttonLink,
          bannerImage: form.bannerImage,
          themeColor: form.themeColor,
          productIds: form.productIds,
          categories: form.categories,
        },
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Summer sale saved — it shows on the home page right away." : data.error ?? "Failed to save.");
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Summer Sale</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The sunny summer-sale banner on the home page. Turn it off, or set a past end time, and the banner disappears.
      </p>
      <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-5 w-5 accent-orange-600"
          />
          Show summer sale banner on the home page
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">Small label (e.g. Summer Sale)</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Discount text (big headline)</label>
          <input value={form.discountText} onChange={(e) => setForm({ ...form, discountText: e.target.value })} placeholder="Up To 50% Off" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subtitle (optional)</label>
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Beat the heat with fresh summer styles" className={input} />
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
            <input value={form.buttonLink} onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} placeholder="/shop?sale=summer" className={input} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Banner image URL (optional)</label>
          <input
            value={form.bannerImage}
            onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
            placeholder="https://images.unsplash.com/…"
            className={input}
          />
          {form.bannerImage && (
            <img src={form.bannerImage} alt="Summer sale banner preview" className="mt-2 h-36 w-full rounded-xl object-cover" />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Theme color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.themeColor}
              onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-lg border"
              aria-label="Summer sale theme color"
            />
            <input
              value={form.themeColor}
              onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
              className={input}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-bold">Products in this sale</p>
          <p className="mt-1 text-xs text-zinc-500">
            Pick products below, or tick whole categories. If any products are picked, only those are in the sale; otherwise the ticked categories are used.
          </p>
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
            <div className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl border p-2">
              {results.map((p) => {
                const on = form.productIds.includes(p.slug);
                return (
                  <label key={p.slug} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-orange-50">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleProduct(p)}
                      className="h-4 w-4 accent-orange-600"
                    />
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="text-xs text-zinc-500">{p.category}</span>
                    <span className="font-bold">{formatPrice(p.price)}</span>
                  </label>
                );
              })}
            </div>
          )}
          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.map((p) => (
                <span key={p.slug} className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
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

        <div className="border-t pt-4">
          <p className="text-sm font-bold">Whole categories (used when no products are picked)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allCats.filter((c) => c.active).map((c) => {
              const on = form.categories.includes(c.name);
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => toggleCategory(c.name)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold ${on ? "border-orange-600 bg-orange-600 text-white" : "bg-white text-zinc-600 hover:border-orange-600"}`}
                >
                  {c.name} <span className="opacity-70">({c.group === "subcategory" ? "sub" : "main"})</span>
                </button>
              );
            })}
            {allCats.length === 0 && <p className="text-xs text-zinc-500">No categories yet — add some in Categories first.</p>}
          </div>
        </div>

        {msg && <p className={`text-sm ${msg.startsWith("Summer sale saved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Summer Sale"}
        </button>
      </form>
    </div>
  );
}
