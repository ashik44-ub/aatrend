"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart, useCompare, useWishlist } from "@/lib/store";
import { discountPercent, formatPrice, stars } from "@/lib/utils";
import { colorHex } from "@/lib/categories";
import ReviewForm from "@/components/ReviewForm";
import DealCountdown from "@/components/DealCountdown";

export interface DetailReview {
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export interface DetailProduct {
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  priceTo?: number;
  images: string[];
  stock: number;
  status: "in_stock" | "pre_order" | "sold_out";
  badge?: "sale" | "hot" | "new" | null;
  dealEndsAt?: string | null;
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewCount: number;
  sold: number;
  category: string;
  subcategory?: string;
  brand?: string;
  /** True when this product ships free under the live free-shipping campaign. */
  freeShipping?: boolean;
  shortDescription?: string;
  description: string;
  specifications: { label: string; value: string }[];
  reviews: DetailReview[];
}

/**
 * Split sizes saved as one joined entry (e.g. "m | xl" typed in the admin
 * form) into separate sizes, so each renders its own button.
 */
function normalizeSizes(sizes: string[]): string[] {
  const out: string[] = [];
  for (const raw of sizes ?? []) {
    for (const part of String(raw).split(/[,|]/)) {
      const s = part.trim();
      if (!s) continue;
      const v = /^[a-z]+$/i.test(s) ? s.toUpperCase() : s;
      if (!out.includes(v)) out.push(v);
    }
  }
  return out;
}

/** Stable pseudo-random number from a string (same on every render). */
function hashNum(s: string, min: number, max: number) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return min + (h % (max - min + 1));
}

export function Stars({ rating }: { rating: number }) {
  return <span className="text-amber-500">{stars(rating)}</span>;
}

type Tab = "description" | "additional" | "reviews" | "shipping";

export default function ProductDetailClient({ p }: { p: DetailProduct }) {
  const [img, setImg] = useState(p.images[0] ?? "");
  const [zoom, setZoom] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("description");
  const [copied, setCopied] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const { toggle: toggleWish, has: hasWish } = useWishlist();
  const { toggle: toggleCompare, has: hasCompare, slugs: compareSlugs } = useCompare();
  const router = useRouter();

  const soldOut = p.status === "sold_out" || p.stock <= 0;
  const preOrder = p.status === "pre_order" && !soldOut;
  const off = discountPercent(p.price, p.comparePrice);
  const hasRange = !!p.priceTo && p.priceTo > p.price;
  const sizes = normalizeSizes(p.sizes);
  const sizeIdx = size ? sizes.indexOf(size) : -1;
  const unitPrice =
    hasRange && sizeIdx >= 0 && sizes.length > 1
      ? p.price + ((p.priceTo! - p.price) * sizeIdx) / (sizes.length - 1)
      : p.price;
  const variant = [size, color].filter(Boolean).join(" / ");
  const sku = `NT-${p.slug.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  const tags = [p.category, p.subcategory, p.brand].filter(Boolean) as string[];
  const soldLast5h = hashNum(p.slug, 3, 18);
  const lookingNow = hashNum(p.slug + "looking", 5, 32);
  // Estimated delivery is computed from "now" — it must only render after
  // mount, otherwise the server (UTC) and the client (local timezone) can
  // format different dates and break hydration.
  const [delivery, setDelivery] = useState("");
  useEffect(() => {
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const from = new Date(Date.now() + 3 * 86400000);
    const to = new Date(Date.now() + 7 * 86400000);
    setDelivery(`${fmt(from)} – ${fmt(to)}`);
  }, []);

  const goTab = (t: Tab) => {
    setTab(t);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const add = (buyNow: boolean) => {
    addItem(
      { slug: p.slug, name: p.name, image: p.images[0] ?? "", price: unitPrice, stock: p.stock, variant: variant || undefined },
      qty
    );
    if (buyNow) router.push("/checkout");
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "description", label: "DESCRIPTION" },
    { key: "additional", label: "ADDITIONAL INFORMATION" },
    { key: "reviews", label: `REVIEWS (${p.reviewCount})` },
    { key: "shipping", label: "SHIPPING & RETURN" },
  ];

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery — mobile: main image + thumbnails in a column on the RIGHT
            (first 3 + a "+N more" tile); desktop: all thumbnails on the left. */}
        <div className="flex gap-3">
          {p.images.length > 1 && (
            <>
              <div className="order-2 flex w-14 shrink-0 flex-col gap-2 lg:hidden">
                {p.images.slice(0, 3).map((src) => (
                  <button
                    key={src}
                    onClick={() => setImg(src)}
                    className={`overflow-hidden rounded-lg border-2 ${img === src ? "border-orange-600" : "border-zinc-100"}`}
                  >
                    <img src={src} alt="" className="h-14 w-14 object-cover" />
                  </button>
                ))}
                {p.images.length > 3 && (
                  <button
                    onClick={() => setImg(p.images[3])}
                    className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-zinc-100 bg-zinc-50 text-sm font-bold text-zinc-600"
                  >
                    +{p.images.length - 3}
                  </button>
                )}
              </div>
              <div className="order-1 hidden w-20 shrink-0 flex-col gap-3 lg:flex">
                {p.images.map((src) => (
                  <button
                    key={src}
                    onClick={() => setImg(src)}
                    className={`overflow-hidden rounded-xl border-2 ${img === src ? "border-orange-600" : "border-zinc-100"}`}
                  >
                    <img src={src} alt="" className="h-20 w-20 object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="group relative order-1 flex-1 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 lg:order-2">
            <button onClick={() => setZoom(true)} className="block w-full" aria-label="Zoom image">
              <img
                src={img}
                alt={p.name}
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110"
              />
            </button>
            {/* Mobile overlay actions (Vellora-style): back / wishlist / share. */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 lg:hidden">
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg font-bold shadow"
              >
                ‹
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleWish(p.slug)}
                  aria-label="Toggle wishlist"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg shadow"
                >
                  <span className={hasWish(p.slug) ? "text-red-500" : "text-zinc-500"}>♥</span>
                </button>
                <button
                  onClick={share}
                  aria-label="Share"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg shadow"
                >
                  ↗
                </button>
              </div>
            </div>
            {off > 0 && (
              <span className="absolute left-4 top-16 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white lg:top-4">
                {off}% off
              </span>
            )}
            <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-600 shadow">
              🔍 Click to zoom
            </span>
            {p.dealEndsAt && new Date(p.dealEndsAt).getTime() > Date.now() && (p.badge === "sale" || off > 0) && (
              <DealCountdown endsAt={p.dealEndsAt} />
            )}
          </div>
        </div>

        {/* Buy box */}
        <div>
          <h1 className="text-2xl font-black leading-tight md:text-3xl">{p.name}</h1>
          {/* Mobile rating row: real rating when reviews exist, honest "New" otherwise. */}
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm md:hidden">
            {p.reviewCount > 0 ? (
              <>
                <Stars rating={p.rating} />
                <span className="font-semibold">{p.rating.toFixed(1)}</span>
                <span className="text-zinc-400">({p.reviewCount} reviews)</span>
              </>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">🆕 New</span>
            )}
          </p>
          <p className="mt-2 hidden flex-wrap items-center gap-2 text-sm md:flex">
            <Stars rating={p.rating} />
            <span className="font-semibold">{p.rating.toFixed(1)}</span>
            <span className="text-zinc-400">({p.reviewCount} reviews)</span>
            <button onClick={() => goTab("reviews")} className="font-semibold text-orange-600 hover:underline">
              Write a Review
            </button>
          </p>

          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-semibold text-zinc-500">Availability:</dt>
              <dd className={soldOut ? "font-semibold text-red-500" : preOrder ? "font-semibold text-orange-600" : "font-semibold text-green-600"}>
                {soldOut ? "Out of Stock" : preOrder ? "Pre Order" : `In Stock (${p.stock} available)`}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-semibold text-zinc-500">SKU:</dt>
              <dd className="text-zinc-700">{sku}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 font-semibold text-zinc-500">Categories:</dt>
              <dd className="text-zinc-700">
                <Link href={`/shop?cat=${encodeURIComponent(p.subcategory || p.category)}`} className="hover:text-orange-600 hover:underline">
                  {p.subcategory || p.category}
                </Link>
                {p.subcategory && (
                  <>
                    {", "}
                    <Link href={`/shop?cat=${encodeURIComponent(p.category)}`} className="hover:text-orange-600 hover:underline">
                      {p.category}
                    </Link>
                  </>
                )}
              </dd>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-semibold text-zinc-500">Tags:</dt>
                <dd className="text-zinc-700">{tags.join(", ")}</dd>
              </div>
            )}
            {p.brand && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-semibold text-zinc-500">Brand:</dt>
                <dd className="font-semibold text-zinc-800">{p.brand}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            {hasRange ? (
              <span className="text-3xl font-black text-orange-600">
                {formatPrice(p.price)} – {formatPrice(p.priceTo!)}
              </span>
            ) : (
              <>
                <span className="text-3xl font-black text-orange-600">{formatPrice(unitPrice)}</span>
                {p.comparePrice && p.comparePrice > p.price && (
                  <>
                    <span className="text-lg text-zinc-400 line-through">{formatPrice(p.comparePrice)}</span>
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">Save {off}%</span>
                  </>
                )}
              </>
            )}
          </div>
          {hasRange && size && (
            <p className="mt-1 text-sm text-zinc-500">
              Selected variant price: <span className="font-bold text-zinc-900">{formatPrice(unitPrice)}</span>
            </p>
          )}
          <p className="mt-2 text-sm text-zinc-500">
            🔥 <span className="font-semibold text-zinc-800">{soldLast5h} sold</span> in last 5 hours
          </p>

          {p.shortDescription && <p className="mt-4 text-zinc-600">{p.shortDescription}</p>}

          {p.colors.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-bold">
                Color: <span className="font-normal">{color || "—"}</span>
              </p>
              <div className="mt-2 flex gap-2">
                {p.colors.map((c) => (
                  <button
                    key={c.name}
                    title={c.name}
                    aria-label={`Color ${c.name}`}
                    onClick={() => setColor(color === c.name ? "" : c.name)}
                    className={`h-10 w-10 rounded-full border-2 md:h-9 md:w-9 ${color === c.name ? "border-orange-600 ring-2 ring-orange-200" : "border-zinc-200"}`}
                    style={{ backgroundColor: c.hex || "#9ca3af" }}
                  />
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-bold">
                Size: <span className="font-normal">{size || "—"}</span>
                {(size || color) && (
                  <button onClick={() => { setSize(""); setColor(""); }} className="ml-3 text-xs font-semibold text-orange-600 hover:underline">
                    Clear
                  </button>
                )}
                <button onClick={() => goTab("additional")} className="float-right text-xs font-semibold text-zinc-500 underline decoration-zinc-300 underline-offset-2 md:hidden">
                  📏 Size Guide
                </button>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(size === s ? "" : s)}
                    className={`h-11 min-w-11 rounded-full border px-2 text-sm font-bold ${size === s ? "border-orange-600 bg-orange-600 text-white" : "border-zinc-200 hover:border-orange-600"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <div className="flex items-center self-start rounded-full border border-zinc-200">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2.5 text-lg" aria-label="Decrease quantity">−</button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock || 99, qty + 1))} className="px-4 py-2.5 text-lg" aria-label="Increase quantity">+</button>
            </div>
            <button
              onClick={() => add(false)}
              disabled={soldOut}
              className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40 md:flex-1 md:bg-zinc-900 md:py-3 md:hover:bg-orange-600"
            >
              {soldOut ? "Sold Out" : preOrder ? "Pre Order" : "ADD TO CART"}
            </button>
            <button
              onClick={() => add(true)}
              disabled={soldOut}
              className="w-full rounded-full bg-orange-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40 md:flex-1 md:py-3"
            >
              BUY IT NOW
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <button onClick={() => toggleWish(p.slug)} className={`font-semibold hover:text-orange-600 ${hasWish(p.slug) ? "text-red-500" : "text-zinc-700"}`}>
              ♥ {hasWish(p.slug) ? "Added to Wishlist" : "Add to Wishlist"}
            </button>
            <button onClick={() => toggleCompare(p.slug)} className={`font-semibold hover:text-orange-600 ${hasCompare(p.slug) ? "text-orange-600" : "text-zinc-700"}`}>
              ⇄ {hasCompare(p.slug) ? "Added to Compare" : "Compare"}
            </button>
            <button onClick={() => goTab("shipping")} className="font-semibold text-zinc-700 hover:text-orange-600">
              🚚 Delivery &amp; Returns
            </button>
            <Link href="/contact" className="font-semibold text-zinc-700 hover:text-orange-600">
              ✉ Enquiry
            </Link>
            <button onClick={share} className="font-semibold text-zinc-700 hover:text-orange-600">
              ↗ Share{copied ? " — Copied!" : ""}
            </button>
          </div>
          {compareSlugs.length > 0 && (
            <p className="mt-2 text-sm">
              <Link href="/compare" className="font-semibold text-orange-600 hover:underline">
                View comparison ({compareSlugs.length})
              </Link>
            </p>
          )}

          <p className="mt-5 text-sm text-zinc-500">
            👀 <span className="font-semibold text-zinc-800">{lookingNow} People</span> are Looking for this Product
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            🚚 Estimated Delivery: <span className="font-semibold text-zinc-800">{delivery}</span>
            {p.freeShipping && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                FREE Shipping on this item
              </span>
            )}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">We accept:</span>
            {["VISA", "Mastercard", "AMEX", "Discover", "Stripe"].map((b) => (
              <span key={b} className="rounded border border-zinc-200 bg-white px-2 py-1 text-[11px] font-extrabold tracking-wide text-zinc-600">
                {b}
              </span>
            ))}
            <span className="text-xs text-zinc-400">+ Cash on Delivery</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div ref={tabsRef} className="mt-12 scroll-mt-24">
        <div className="flex flex-wrap gap-1 border-b border-zinc-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-bold uppercase tracking-wide ${tab === t.key ? "border-b-2 border-orange-600 text-orange-600" : "text-zinc-500 hover:text-zinc-900"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "description" && (
          <div className="grid gap-8 py-8 lg:grid-cols-2">
            <div>
              <p className="whitespace-pre-line leading-relaxed text-zinc-600">{p.description}</p>
              {p.specifications.length > 0 && (
                <>
                  <h3 className="mt-6 text-lg font-black">Features</h3>
                  <ul className="mt-3 space-y-2">
                    {p.specifications.map((s) => (
                      <li key={s.label} className="flex gap-2 text-sm text-zinc-700">
                        <span className="font-bold text-green-600">✓</span>
                        <span>
                          <strong>{s.label}:</strong> {s.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50">
              <img src={p.images[1] ?? p.images[0] ?? ""} alt={p.name} className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>
        )}

        {tab === "additional" && (
          <div className="max-w-2xl py-8">
            <table className="w-full divide-y divide-zinc-100 rounded-2xl border border-zinc-100 text-sm">
              <tbody>
                {[
                  ["SKU", sku],
                  ["Brand", p.brand ?? "—"],
                  ["Category", p.category],
                  ["Sub-category", p.subcategory ?? "—"],
                  ["Sizes", sizes.length > 0 ? sizes.join(", ") : "—"],
                  ["Colors", p.colors.length > 0 ? p.colors.map((c) => c.name).join(", ") : "—"],
                  ...p.specifications.map((s) => [s.label, s.value]),
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="w-40 px-4 py-3 font-semibold text-zinc-500">{k}</td>
                    <td className="px-4 py-3 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "reviews" && (
          <div className="max-w-3xl py-8">
            <h3 className="text-lg font-black">Customer Reviews ({p.reviewCount})</h3>
            <div className="mt-4 space-y-4">
              {p.reviews.length === 0 && (
                <p className="text-sm text-zinc-500">No reviews yet — be the first to review this product!</p>
              )}
              {p.reviews.slice().reverse().map((r, i) => (
                <div key={i} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.userName}</p>
                    <Stars rating={r.rating} />
                  </div>
                  {r.title && <p className="mt-1 text-sm font-semibold">{r.title}</p>}
                  <p className="mt-1 text-sm text-zinc-600">{r.comment}</p>
                  <p className="mt-2 text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <ReviewForm slug={p.slug} />
          </div>
        )}

        {tab === "shipping" && (
          <div className="max-w-3xl space-y-4 py-8 text-sm leading-relaxed text-zinc-600">
            <h3 className="text-lg font-black text-zinc-900">Shipping</h3>
            <p>
              Orders are processed within 1–2 business days. Delivery across Bangladesh takes 2–5 business days
              (estimated {delivery}); international delivery takes 7–14 business days. Delivery charge is ৳70 inside
              Dhaka and ৳120 outside Dhaka.
              {p.freeShipping && (
                <>
                  {" "}
                  <b className="text-emerald-700">This item ships FREE</b> while the free-shipping campaign is
                  running — no delivery charge on orders where every item is covered.
                </>
              )}
            </p>
            <h3 className="text-lg font-black text-zinc-900">Returns</h3>
            <p>
              Not happy with your purchase? Return it within 30 days for a full refund or exchange. Items must be
              unused, in their original packaging, and accompanied by the order number. Refunds are issued to the
              original payment method within 5–7 business days of receiving the return.
            </p>
          </div>
        )}
      </div>

      {/* Zoom lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          <img src={img} alt={p.name} className="max-h-[90vh] max-w-full rounded-2xl object-contain" />
          <button className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-bold" onClick={() => setZoom(false)}>
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
