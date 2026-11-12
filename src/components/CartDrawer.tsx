"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/store";
import {
  cartCoveredByFreeShipping,
  DEFAULT_FREE_SHIPPING,
  DEFAULT_SHIPPING_RATES,
  formatPrice,
  formatTaka,
  isFreeShippingLive,
  type FreeShippingCampaign,
} from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, subtotal } = useCart();
  const [rates, setRates] = useState(DEFAULT_SHIPPING_RATES);
  const [freeShip, setFreeShip] = useState<FreeShippingCampaign>(DEFAULT_FREE_SHIPPING);

  // Rates + campaign are only needed while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.insideDhaka === "number" && typeof d.outsideDhaka === "number") {
          setRates({ insideDhaka: d.insideDhaka, outsideDhaka: d.outsideDhaka });
        }
        if (d.freeShipping) {
          setFreeShip({
            active: !!d.freeShipping.active,
            endsAt: d.freeShipping.endsAt ?? null,
            allProducts: !!d.freeShipping.allProducts,
            productSlugs: Array.isArray(d.freeShipping.productSlugs) ? d.freeShipping.productSlugs : [],
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const itemCovered = (slug: string) =>
    isFreeShippingLive(freeShip) &&
    (freeShip.allProducts || freeShip.productSlugs.includes(slug));
  const wholeCartFree =
    items.length > 0 && items.every((i) => itemCovered(i.slug));

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold">Your Cart ({items.length})</h2>
          <button onClick={closeCart} className="rounded-full p-2 hover:bg-zinc-100" aria-label="Close cart">✕</button>
        </div>
        <div className="border-b px-5 py-3">
          {wholeCartFree ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              🎁 Free shipping on this order — every item is covered by the campaign.
            </p>
          ) : (
            <p className="text-sm text-zinc-600">
              🚚 Delivery: <b>{formatTaka(rates.insideDhaka)}</b> inside Dhaka · <b>{formatTaka(rates.outsideDhaka)}</b> outside Dhaka — added at checkout.
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-zinc-500">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={`${it.slug}-${it.variant ?? ""}`} className="flex gap-3">
                  <img src={it.image} alt={it.name} className="h-20 w-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {it.name}
                      {itemCovered(it.slug) && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          🚚 Free shipping
                        </span>
                      )}
                    </p>
                    {it.variant && <p className="text-xs text-zinc-500">{it.variant}</p>}
                    <p className="text-sm font-bold text-orange-600">{formatPrice(it.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQty(it.slug, it.variant, it.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{it.quantity}</span>
                      <button
                        onClick={() => updateQty(it.slug, it.variant, it.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(it.slug, it.variant)}
                        className="ml-auto text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="font-bold">{formatPrice(it.price * it.quantity)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t px-5 py-4">
            <div className="flex justify-between text-base font-bold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Shipping &amp; taxes calculated at checkout.</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex-1 rounded-full border border-zinc-300 py-3 text-center text-sm font-semibold"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex-1 rounded-full bg-orange-600 py-3 text-center text-sm font-bold text-white hover:bg-orange-700"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
