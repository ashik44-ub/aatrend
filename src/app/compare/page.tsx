"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCompare } from "@/lib/store";
import { formatPrice, stars } from "@/lib/utils";

interface Row {
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  category: string;
  brand?: string;
}

export default function ComparePage() {
  const { slugs, toggle, clear } = useCompare();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugs.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      slugs.map((s) => fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null)))
    )
      .then((list) => setRows(list.filter(Boolean).map((d) => d.product as Row)))
      .finally(() => setLoading(false));
  }, [slugs]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">Compare Products</h1>
      {loading ? (
        <p className="mt-6 text-zinc-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-zinc-500">
          No products to compare yet. Add products from any product page with the Compare button.{" "}
          <Link href="/shop" className="font-semibold text-orange-600 hover:underline">Browse the shop →</Link>
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="w-32 p-3 font-bold text-zinc-500">Product</td>
                  {rows.map((r) => (
                    <td key={r.slug} className="p-3 align-top">
                      <Link href={`/product/${r.slug}`}>
                        <img src={r.images[0] ?? ""} alt={r.name} className="h-36 w-full rounded-xl object-cover" />
                        <p className="mt-2 font-bold hover:text-orange-600">{r.name}</p>
                      </Link>
                      <button onClick={() => toggle(r.slug)} className="mt-1 text-xs font-semibold text-red-500 hover:underline">
                        Remove
                      </button>
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-bold text-zinc-500">Price</td>
                  {rows.map((r) => (
                    <td key={r.slug} className="p-3">
                      <span className="text-base font-bold">{formatPrice(r.price)}</span>{" "}
                      {r.comparePrice && r.comparePrice > r.price && (
                        <span className="text-zinc-400 line-through">{formatPrice(r.comparePrice)}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-bold text-zinc-500">Rating</td>
                  {rows.map((r) => (
                    <td key={r.slug} className="p-3 text-amber-500">
                      {stars(r.rating)} <span className="text-xs text-zinc-400">({r.reviewCount})</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-bold text-zinc-500">Category</td>
                  {rows.map((r) => (
                    <td key={r.slug} className="p-3">{r.category}</td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-bold text-zinc-500">Brand</td>
                  {rows.map((r) => (
                    <td key={r.slug} className="p-3">{r.brand ?? "—"}</td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-bold text-zinc-500">Availability</td>
                  {rows.map((r) => (
                    <td key={r.slug} className="p-3">
                      <span className={r.stock > 0 ? "font-semibold text-green-600" : "font-semibold text-red-500"}>
                        {r.stock > 0 ? `In Stock (${r.stock})` : "Out of Stock"}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-3" />
                  {rows.map((r) => (
                    <td key={r.slug} className="p-3">
                      <Link href={`/product/${r.slug}`} className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600">
                        View Product
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={clear} className="mt-6 rounded-full border px-5 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-500">
            Clear comparison
          </button>
        </>
      )}
    </div>
  );
}
