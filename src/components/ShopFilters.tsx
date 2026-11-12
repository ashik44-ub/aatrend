"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { colorHex, APPAREL_SIZES } from "@/lib/categories";
import { PRICE_GAP, clampPriceMin, clampPriceMax, formatPrice } from "@/lib/utils";

export interface Facets {
  categories: { name: string; count: number }[];
  brands: { name: string; count: number }[];
  colors: string[];
  priceMin: number;
  priceMax: number;
  ratingCounts: { stars: number; count: number }[];
}

function toggleParam(sp: URLSearchParams, key: string, value: string, on: boolean) {
  const next = new URLSearchParams(sp.toString());
  const cur = next.getAll(key);
  next.delete(key);
  const vals = on ? [...cur, value] : cur.filter((v) => v !== value);
  vals.forEach((v) => next.append(key, v));
  next.delete("page");
  return next;
}

function setParam(sp: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(sp.toString());
  if (value) next.set(key, value);
  else next.delete(key);
  next.delete("page");
  return next;
}

/** Left sidebar filters — Hema-style. Checkboxes apply instantly; price uses a Filter button. */
export default function ShopFilters({ facets }: { facets: Facets }) {
  const router = useRouter();
  const sp = useSearchParams();
  const cats = sp.getAll("cat");
  const brands = sp.getAll("brand");
  const colors = sp.getAll("color");
  const sizes = sp.getAll("size");
  const inStock = sp.get("inStock") === "1";
  const onSale = sp.get("onSale") === "1";
  const rating = sp.get("rating") ?? "";
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");

  // Keep the sliders in sync with the URL (back/forward, category tiles,
  // clear-all) — but only when the URL values actually differ, so dragging
  // a handle never gets reset mid-drag.
  useEffect(() => {
    const uMin = sp.get("min") ?? "";
    const uMax = sp.get("max") ?? "";
    setMin((p) => (p === uMin ? p : uMin));
    setMax((p) => (p === uMax ? p : uMax));
  }, [sp]);

  const go = (next: URLSearchParams) => {
    const s = next.toString();
    router.push(s ? `/shop?${s}` : "/shop");
  };

  const section = "rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm";
  const heading = "flex items-center justify-between text-sm font-extrabold uppercase tracking-wide text-zinc-900";
  const check = "flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900";
  // Effective range: empty state means "no limit" (the facet extreme).
  // The two handles always keep at least PRICE_GAP (৳1) apart — the label
  // can never collapse to "৳1,326 — ৳1,326" and a drag can never produce an
  // empty range. Handles are clamped WHEN SET, so they can never cross
  // or swap places mid-drag either.
  const rawMin = min === "" ? facets.priceMin : Number(min);
  const rawMax = max === "" ? facets.priceMax : Number(max);
  const minVal = Math.max(facets.priceMin, Math.min(rawMin, facets.priceMax - PRICE_GAP));
  const maxVal = Math.min(facets.priceMax, Math.max(rawMax, minVal + PRICE_GAP));
  const priceLabel = `Price: ${formatPrice(minVal)} — ${formatPrice(maxVal)}`;
  const priceActive = sp.get("min") !== null || sp.get("max") !== null;
  const span = Math.max(1, facets.priceMax - facets.priceMin);
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - facets.priceMin) / span) * 100));
  // When the handles are close, the one nearer the middle of the track
  // sits on top so it stays grabbable.
  const mid = (facets.priceMin + facets.priceMax) / 2;
  const minOnTop = minVal > mid;

  const onMinChange = (v: string) => {
    setMin(String(clampPriceMin(Number(v) || facets.priceMin, facets.priceMin, maxVal)));
  };
  const onMaxChange = (v: string) => {
    setMax(String(clampPriceMax(Number(v) || facets.priceMax, minVal, facets.priceMax)));
  };

  const applyPrice = () => {
    let next = new URLSearchParams(sp.toString());
    // A full-range selection is the same as no price filter — clear it.
    next = setParam(next, "min", minVal > facets.priceMin ? String(minVal) : "");
    next = setParam(next, "max", maxVal < facets.priceMax ? String(maxVal) : "");
    go(next);
  };

  const clearPrice = () => {
    let next = new URLSearchParams(sp.toString());
    next = setParam(next, "min", "");
    next = setParam(next, "max", "");
    go(next);
  };

  return (
    <div className="space-y-5">
      <div className={section}>
        <div className={heading}>Categories <span>⌃</span></div>
        <div className="mt-3 space-y-2">
          {facets.categories.map((c) => (
            <label key={c.name} className={check}>
              <input
                type="checkbox"
                checked={cats.includes(c.name)}
                onChange={(e) => go(toggleParam(sp, "cat", c.name, e.target.checked))}
                className="h-4 w-4 accent-orange-600"
              />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-zinc-400">({c.count})</span>
            </label>
          ))}
        </div>
      </div>

      <div className={section}>
        <div className={heading}>Filter by Price <span>⌃</span></div>
        <div className="mt-4 space-y-3">
          {/* Single dual-handle slider: one track, two handles, orange fill
              between them. The two range inputs are overlaid; only their
              thumbs catch the pointer (see .dual-range in globals.css). */}
          <div className="relative h-6" data-testid="price-slider">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-200" aria-hidden />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-orange-600"
              style={{ left: `${pct(minVal)}%`, width: `${Math.max(0, pct(maxVal) - pct(minVal))}%` }}
              aria-hidden
              data-testid="price-fill"
            />
            <input
              type="range"
              min={facets.priceMin}
              max={facets.priceMax}
              step={1}
              value={minVal}
              onChange={(e) => onMinChange(e.target.value)}
              className="dual-range absolute inset-x-0 top-1/2 w-full -translate-y-1/2"
              style={{ zIndex: minOnTop ? 30 : 20 }}
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={facets.priceMin}
              max={facets.priceMax}
              step={1}
              value={maxVal}
              onChange={(e) => onMaxChange(e.target.value)}
              className="dual-range absolute inset-x-0 top-1/2 w-full -translate-y-1/2"
              style={{ zIndex: minOnTop ? 20 : 30 }}
              aria-label="Maximum price"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={applyPrice}
                className="rounded bg-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-orange-600"
              >
                Filter
              </button>
              {priceActive && (
                <button
                  onClick={clearPrice}
                  className="rounded border border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-600 hover:border-orange-600 hover:text-orange-700"
                >
                  Clear
                </button>
              )}
            </div>
            <span className="text-xs text-zinc-500">{priceLabel}</span>
          </div>
        </div>
      </div>

      <div className={section}>
        <div className={heading}>Availability <span>⌃</span></div>
        <div className="mt-3 space-y-2">
          <label className={check}>
            <input type="checkbox" checked={inStock} onChange={(e) => go(setParam(sp, "inStock", e.target.checked ? "1" : ""))} className="h-4 w-4 accent-orange-600" />
            In Stock
          </label>
          <label className={check}>
            <input type="checkbox" checked={onSale} onChange={(e) => go(setParam(sp, "onSale", e.target.checked ? "1" : ""))} className="h-4 w-4 accent-orange-600" />
            On Sale
          </label>
        </div>
      </div>

      {facets.colors.length > 0 && (
        <div className={section}>
          <div className={heading}>Color <span>⌃</span></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const on = colors.includes(c);
              return (
                <button
                  key={c}
                  title={c}
                  aria-label={`Filter by color ${c}`}
                  aria-pressed={on}
                  onClick={() => go(toggleParam(sp, "color", c, !on))}
                  className={`h-7 w-7 rounded-full border-2 ${on ? "border-orange-600 ring-2 ring-orange-200" : "border-zinc-200"}`}
                  style={{ backgroundColor: colorHex(c) }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className={section}>
        <div className={heading}>Size <span>⌃</span></div>
        <div className="mt-3 flex flex-wrap gap-2">
          {APPAREL_SIZES.map((s) => {
            const on = sizes.includes(s);
            return (
              <button
                key={s}
                aria-pressed={on}
                onClick={() => go(toggleParam(sp, "size", s, !on))}
                className={`h-9 w-9 rounded-full border text-xs font-bold ${on ? "border-orange-600 bg-orange-600 text-white" : "border-zinc-200 text-zinc-600 hover:border-orange-600"}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {facets.brands.length > 0 && (
        <div className={section}>
          <div className={heading}>Filter by Brand <span>⌃</span></div>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <label key={b.name} className={check}>
                <input
                  type="checkbox"
                  checked={brands.includes(b.name)}
                  onChange={(e) => go(toggleParam(sp, "brand", b.name, e.target.checked))}
                  className="h-4 w-4 accent-orange-600"
                />
                <span className="flex-1">{b.name}</span>
                <span className="text-xs text-zinc-400">({b.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={section}>
        <div className={heading}>Ratings <span>⌃</span></div>
        <div className="mt-3 space-y-2">
          {facets.ratingCounts.map((r) => (
            <label key={r.stars} className={check}>
              <input
                type="radio"
                name="rating-filter"
                checked={rating === String(r.stars)}
                onChange={() => go(setParam(sp, "rating", String(r.stars)))}
                className="h-4 w-4 accent-orange-600"
              />
              <span className="text-amber-500">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
              <span className="text-xs text-zinc-400">({r.count})</span>
            </label>
          ))}
          <label className={check}>
            <input
              type="radio"
              name="rating-filter"
              checked={rating === ""}
              onChange={() => go(setParam(sp, "rating", ""))}
              className="h-4 w-4 accent-orange-600"
            />
            <span>Any rating</span>
          </label>
        </div>
      </div>

      <a href="/shop" className="block text-center text-xs text-zinc-500 hover:underline">
        Clear all filters
      </a>
    </div>
  );
}
