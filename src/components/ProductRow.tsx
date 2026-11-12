"use client";

import Link from "next/link";
import { useCart, useWishlist } from "@/lib/store";
import { discountPercent, formatPrice, stars } from "@/lib/utils";
import { colorHex } from "@/lib/categories";
import DealCountdown from "@/components/DealCountdown";
import type { CardProduct } from "@/components/ProductCard";

/** Horizontal list-view row for the shop page. */
export default function ProductRow({ p }: { p: CardProduct }) {
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const off = discountPercent(p.price, p.comparePrice);
  const soldOut = p.status === "sold_out" || p.stock <= 0;
  const preOrder = p.status === "pre_order";
  const showCountdown = !!p.dealEndsAt && new Date(p.dealEndsAt).getTime() > Date.now() && (p.badge === "sale" || off > 0);
  return (
    <div className="group relative flex gap-4 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:shadow-lg sm:gap-5 sm:p-4">
      <Link href={`/product/${p.slug}`} className="relative block w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:w-52">
        <img src={p.images?.[0] ?? ""} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
        {soldOut ? (
          <span className="absolute left-2 top-2 rounded-sm bg-zinc-600 px-2 py-1 text-xs font-bold text-white">Sold Out</span>
        ) : (
          p.badge === "sale" && off > 0 ? (
            <span className="absolute left-2 top-2 rounded-sm bg-red-500 px-2 py-1 text-xs font-bold text-white">Sale</span>
          ) : p.badge === "hot" ? (
            <span className="absolute left-2 top-2 rounded-sm bg-amber-500 px-2 py-1 text-xs font-bold text-white">Hot</span>
          ) : preOrder ? (
            <span className="absolute left-2 top-2 rounded-sm bg-orange-500 px-2 py-1 text-xs font-bold text-white">Pre Order</span>
          ) : null
        )}
        {p.freeShipping && !soldOut && (
          <span className="absolute bottom-2 left-2 rounded-sm bg-emerald-600 px-2 py-1 text-xs font-bold text-white">🚚 Free Shipping</span>
        )}
        {showCountdown && p.dealEndsAt && <DealCountdown endsAt={p.dealEndsAt} />}
      </Link>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{p.category}</p>
        <Link href={`/product/${p.slug}`}>
          <h3 className="mt-1 font-semibold text-zinc-900 hover:text-orange-600">{p.name}</h3>
        </Link>
        <p className="mt-1 text-sm text-amber-500">
          {stars(p.rating)} <span className="text-xs text-zinc-400">({p.reviewCount})</span>
        </p>
        {(p.colors ?? []).length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {(p.colors ?? []).slice(0, 6).map((c) => (
              <span key={c.name} title={c.name} className="h-4 w-4 rounded-full border border-zinc-200" style={{ backgroundColor: c.hex || colorHex(c.name) }} />
            ))}
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-zinc-900">{formatPrice(p.price)}</span>
          {p.comparePrice && p.comparePrice > p.price && (
            <span className="text-sm text-zinc-400 line-through">{formatPrice(p.comparePrice)}</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => addItem({ slug: p.slug, name: p.name, image: p.images?.[0] ?? "", price: p.price, stock: p.stock })}
            disabled={soldOut}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-40"
          >
            {soldOut ? "Sold Out" : preOrder ? "Pre Order" : "Add to Cart"}
          </button>
          <Link href={`/product/${p.slug}`} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold hover:border-orange-600 hover:text-orange-600">
            View
          </Link>
        </div>
      </div>
      <button
        onClick={() => toggle(p.slug)}
        aria-label="Toggle wishlist"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
      >
        <span className={has(p.slug) ? "text-lg text-red-500" : "text-lg text-zinc-400"}>♥</span>
      </button>
    </div>
  );
}
