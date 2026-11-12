"use client";

import Link from "next/link";
import { useCart, useWishlist } from "@/lib/store";
import { discountPercent, formatPrice, stars } from "@/lib/utils";
import { colorHex } from "@/lib/categories";
import DealCountdown from "@/components/DealCountdown";

export interface CardProduct {
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  category: string;
  isNewArrival?: boolean;
  bestSeller?: boolean;
  status?: "in_stock" | "pre_order" | "sold_out";
  badge?: "sale" | "hot" | "new" | null;
  colors?: { name: string; hex: string }[];
  dealEndsAt?: string | null;
  /** True when this product ships free under the live free-shipping campaign. */
  freeShipping?: boolean;
}

export default function ProductCard({ p }: { p: CardProduct }) {
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const off = discountPercent(p.price, p.comparePrice);
  const soldOut = p.status === "sold_out" || p.stock <= 0;
  const preOrder = p.status === "pre_order";
  const showCountdown = !!p.dealEndsAt && new Date(p.dealEndsAt).getTime() > Date.now() && (p.badge === "sale" || off > 0);
  const badgeLabel =
    p.badge === "sale" && off > 0
      ? "Sale"
      : p.badge === "hot"
        ? "Hot"
        : p.badge === "new"
          ? "New"
          : p.isNewArrival
            ? "New"
            : p.bestSeller
              ? "Bestseller"
              : null;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-lg">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-zinc-100">
          <img
            src={p.images?.[0] ?? ""}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
            {soldOut ? (
              <span className="rounded-sm bg-zinc-600 px-2 py-1 text-xs font-bold text-white">Sold Out</span>
            ) : (
              <>
                {badgeLabel && (
                  <span className={`rounded-sm px-2 py-1 text-xs font-bold text-white ${badgeLabel === "Sale" ? "bg-red-500" : badgeLabel === "Hot" || badgeLabel === "Bestseller" ? "bg-amber-500" : "bg-emerald-500"}`}>
                    {badgeLabel}
                  </span>
                )}
                {preOrder && (
                  <span className="rounded-sm bg-orange-500 px-2 py-1 text-xs font-bold text-white">Pre Order</span>
                )}
                {p.freeShipping && (
                  <span className="rounded-sm bg-emerald-600 px-2 py-1 text-xs font-bold text-white">🚚 Free Shipping</span>
                )}
                {off > 0 && badgeLabel !== "Sale" && (
                  <span className="rounded-full bg-orange-600 px-2 py-1 text-xs font-bold text-white">-{off}%</span>
                )}
              </>
            )}
          </div>
          {showCountdown && p.dealEndsAt && <DealCountdown endsAt={p.dealEndsAt} />}
        </div>
      </Link>
      <button
        onClick={() => toggle(p.slug)}
        aria-label="Toggle wishlist"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
      >
        <span className={has(p.slug) ? "text-lg text-red-500" : "text-lg text-zinc-400"}>♥</span>
      </button>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{p.category}</p>
        <Link href={`/product/${p.slug}`}>
          <h3 className="mt-1 line-clamp-1 font-semibold text-zinc-900 hover:text-orange-600">{p.name}</h3>
        </Link>
        <p className="mt-1 text-sm text-amber-500">
          {stars(p.rating)} <span className="text-xs text-zinc-400">({p.reviewCount})</span>
        </p>
        {(p.colors ?? []).length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {(p.colors ?? []).slice(0, 6).map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-4 w-4 rounded-full border border-zinc-200"
                style={{ backgroundColor: c.hex || colorHex(c.name) }}
              />
            ))}
          </div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-zinc-900">{formatPrice(p.price)}</span>
          {p.comparePrice && p.comparePrice > p.price && (
            <span className="text-sm text-zinc-400 line-through">{formatPrice(p.comparePrice)}</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() =>
              addItem({ slug: p.slug, name: p.name, image: p.images?.[0] ?? "", price: p.price, stock: p.stock })
            }
            disabled={soldOut}
            className="flex-1 whitespace-nowrap rounded-full bg-zinc-900 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-40 min-h-[44px]"
          >
            {soldOut ? "Sold Out" : preOrder ? "Pre Order" : "Add to Cart"}
          </button>
          <Link
            href={`/product/${p.slug}`}
            className="flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold hover:border-orange-600 hover:text-orange-600"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
