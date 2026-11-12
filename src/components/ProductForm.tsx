"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, FASHION_SUBCATEGORIES, colorHex } from "@/lib/categories";

interface Initial {
  _id?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  comparePrice?: number;
  priceTo?: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  images?: string[];
  stock?: number;
  sizes?: string;
  colors?: string;
  status?: string;
  badge?: string;
  dealEndsAt?: string;
  featured?: boolean;
  bestSeller?: boolean;
  isNewArrival?: boolean;
  onSale?: boolean;
  specifications?: string;
}

function parseColors(input: string) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, hex] = entry.split(":").map((x) => x.trim());
      return { name, hex: hex || colorHex(name) };
    });
}

function toDateTimeLocal(v?: string) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProductForm({ initial, isEdit }: { initial?: Initial; isEdit?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    shortDescription: initial?.shortDescription ?? "",
    price: String(initial?.price ?? ""),
    comparePrice: String(initial?.comparePrice ?? ""),
    priceTo: String(initial?.priceTo ?? ""),
    category: initial?.category ?? "Fashion",
    subcategory: initial?.subcategory ?? "",
    brand: initial?.brand ?? "",
    images: (initial?.images ?? [""]).join("\n"),
    stock: String(initial?.stock ?? 0),
    sizes: initial?.sizes ?? "",
    colors: initial?.colors ?? "",
    status: initial?.status ?? "in_stock",
    badge: initial?.badge ?? "",
    dealEndsAt: toDateTimeLocal(initial?.dealEndsAt),
    featured: initial?.featured ?? false,
    bestSeller: initial?.bestSeller ?? false,
    isNewArrival: initial?.isNewArrival ?? true,
    onSale: initial?.onSale ?? false,
    specifications: initial?.specifications ?? "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const splitList = (v: string) =>
      v
        .split(/[,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (/^[a-z]+$/i.test(s) ? s.toUpperCase() : s))
        .filter((s, i, a) => a.indexOf(s) === i);
    const variants = [
      ...splitList(form.sizes).map((value) => ({ type: "size", value })),
      ...form.colors.split(/[,|]/).map((s) => s.trim()).filter(Boolean).map((value) => ({ type: "color", value: value.split(":")[0].trim() })),
    ];
    const colors = parseColors(form.colors);
    const sizes = splitList(form.sizes);
    const specifications = form.specifications
      .split("\n")
      .map((l) => l.split(":"))
      .filter((p) => p[0]?.trim() && p[1]?.trim())
      .map(([label, ...rest]) => ({ label: label.trim(), value: rest.join(":").trim() }));
    const body = {
      name: form.name,
      description: form.description,
      shortDescription: form.shortDescription,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      priceTo: form.priceTo ? Number(form.priceTo) : undefined,
      category: form.category,
      subcategory: form.subcategory || undefined,
      brand: form.brand.trim() || undefined,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      stock: Number(form.stock),
      variants,
      colors,
      sizes,
      status: form.status,
      badge: form.badge || null,
      dealEndsAt: form.dealEndsAt ? new Date(form.dealEndsAt).toISOString() : undefined,
      featured: form.featured,
      bestSeller: form.bestSeller,
      isNewArrival: form.isNewArrival,
      onSale: form.onSale,
      specifications,
    };
    const url = isEdit ? `/api/admin/products/${initial?._id}` : "/api/admin/products";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save product.");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category *</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Price (৳) *</label>
          <input required type="number" step="1" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Compare price (৳) — for discount badge</label>
          <input type="number" step="1" min={0} value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Price to (৳) — range end, e.g. ৳11,760 – ৳11,880</label>
          <input type="number" step="1" min={0} value={form.priceTo} onChange={(e) => setForm({ ...form, priceTo: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Stock</label>
          <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Short description</label>
          <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className={input} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Brand</label>
          <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Nike, Adidas" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Sub-category (fashion shop tiles)</label>
          <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className={input}>
            <option value="">— None —</option>
            {FASHION_SUBCATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={input}>
            <option value="in_stock">In Stock</option>
            <option value="pre_order">Pre Order</option>
            <option value="sold_out">Sold Out</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Badge</label>
          <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={input}>
            <option value="">— None —</option>
            <option value="sale">Sale</option>
            <option value="hot">Hot</option>
            <option value="new">New</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Deal ends (countdown on sale items)</label>
          <input type="datetime-local" value={form.dealEndsAt} onChange={(e) => setForm({ ...form, dealEndsAt: e.target.value })} className={input} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description *</label>
        <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Image URLs (one per line)</label>
        <textarea rows={3} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://images.unsplash.com/..." className={input} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Sizes (comma separated, e.g. S, M, L, XL)</label>
          <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Colors (comma separated, e.g. Black, Blue:#3b82f6)</label>
          <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className={input} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Specifications (one per line, Label: Value)</label>
        <textarea rows={3} value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} placeholder={"Material: 100% Cotton\nWeight: 250g"} className={input} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {(
          [
            ["featured", "Featured (homepage hero)"],
            ["bestSeller", "Best Seller"],
            ["isNewArrival", "New Arrival"],
            ["onSale", "On Sale"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
            {label}
          </label>
        ))}
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="rounded-full bg-orange-600 px-8 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
        {busy ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
