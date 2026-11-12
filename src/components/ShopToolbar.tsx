"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type ShopView = "grid-2" | "grid-3" | "grid-4" | "list";

/** Toolbar: grid/list view toggle + sort dropdown. Preserves all other filters in the URL. */
export default function ShopToolbar({ view, sort, total, from, to }: { view: ShopView; sort: string; total: number; from: number; to: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const go = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    next.set(key, value);
    next.delete("page");
    router.push(`/shop?${next.toString()}`);
  };
  const views: { key: ShopView; label: string; icon: string }[] = [
    { key: "grid-2", label: "2 columns", icon: "▦" },
    { key: "grid-3", label: "3 columns", icon: "▦" },
    { key: "grid-4", label: "4 columns", icon: "▦" },
    { key: "list", label: "List view", icon: "☰" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1">
        {views.map((v) => (
          <button
            key={v.key}
            title={v.label}
            aria-label={v.label}
            aria-pressed={view === v.key}
            onClick={() => go("view", v.key)}
            className={`rounded-md px-2 py-1.5 text-base leading-none ${view === v.key ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"}`}
          >
            {v.icon}
          </button>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        Showing {total === 0 ? 0 : from}–{to} of {total} results
      </p>
      <div className="ml-auto flex items-center gap-2 text-sm">
        <label htmlFor="shop-sort" className="text-zinc-500">Sort by</label>
        <select
          id="shop-sort"
          value={sort}
          onChange={(e) => go("sort", e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="latest">Latest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
    </div>
  );
}
