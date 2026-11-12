"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import Pagination from "@/components/Pagination";

interface Row {
  _id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") || 1);
  const [rows, setRows] = useState<Row[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/products?q=${encodeURIComponent(q)}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.products ?? []);
        setPages(d.pages ?? 1);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [q, page]);

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.refresh();
    setRows((prev) => prev.filter((r) => r._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Products ({total})</h1>
        <Link href="/admin/products/new" className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
          + Add Product
        </Link>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/admin/products?q=${encodeURIComponent(search)}`);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, slug or category..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500"
        />
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white">Search</button>
      </form>
      {loading ? (
        <p className="py-10 text-center text-zinc-500">Loading...</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.images?.[0] ?? ""} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-zinc-400">{r.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(r.price)}</td>
                  <td className="px-4 py-3">{r.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${r._id}/edit`} className="rounded-lg border px-3 py-1.5 text-xs font-bold hover:border-orange-600">Edit</Link>
                      <button onClick={() => del(r._id, r.name)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} href={(n) => `/admin/products?q=${encodeURIComponent(q)}&page=${n}`} />
    </div>
  );
}
