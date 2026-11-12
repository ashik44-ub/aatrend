"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/store";
import {
  DEFAULT_FREE_SHIPPING,
  DEFAULT_SHIPPING_RATES,
  formatPrice,
  formatTaka,
  isFreeShippingLive,
  type FreeShippingCampaign,
} from "@/lib/utils";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, clear } = useCart();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [rates, setRates] = useState(DEFAULT_SHIPPING_RATES);
  const [freeShip, setFreeShip] = useState<FreeShippingCampaign>(DEFAULT_FREE_SHIPPING);

  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  // Shipping depends on the delivery area, picked at checkout — the cart
  // never guesses a charge, it only shows the two rates. Except when the
  // free-shipping campaign covers the whole cart: then shipping is ৳0.
  const total = Math.max(0, subtotal - discount);
  const itemCovered = (slug: string) =>
    isFreeShippingLive(freeShip) &&
    (freeShip.allProducts || freeShip.productSlugs.includes(slug));
  const wholeCartFree =
    items.length > 0 && items.every((i) => itemCovered(i.slug));

  useEffect(() => {
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
  }, []);

  const applyCoupon = async () => {
    setCouponMsg("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCoupon(null);
      setCouponMsg(data.error ?? "Invalid coupon.");
      return;
    }
    setCoupon(data);
    setCouponMsg(`Coupon ${data.code} applied — ${data.percent}% off!`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-zinc-500">Your cart is empty.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white">
            Continue Shopping →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <button onClick={clear} className="mb-4 text-sm text-red-500 hover:underline">Clear cart</button>
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={`${it.slug}-${it.variant ?? ""}`} className="flex gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                  <Link href={`/product/${it.slug}`}>
                    <img src={it.image} alt={it.name} className="h-24 w-24 rounded-xl object-cover" />
                  </Link>
                  <div className="flex-1">
                    <Link href={`/product/${it.slug}`} className="font-bold hover:text-orange-600">
                      {it.name}
                      {itemCovered(it.slug) && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          🚚 Free shipping
                        </span>
                      )}
                    </Link>
                    {it.variant && <p className="text-xs text-zinc-500">{it.variant}</p>}
                    <p className="mt-1 font-bold text-orange-600">{formatPrice(it.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => updateQty(it.slug, it.variant, it.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border">−</button>
                      <span className="w-8 text-center font-bold">{it.quantity}</span>
                      <button onClick={() => updateQty(it.slug, it.variant, it.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-full border">+</button>
                      <button onClick={() => removeItem(it.slug, it.variant)} className="ml-2 text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                  <p className="font-bold">{formatPrice(it.price * it.quantity)}</p>
                </li>
              ))}
            </ul>
          </div>
          <aside className="h-fit rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({coupon?.code})</span><span>−{formatPrice(discount)}</span></div>
              )}
              <div className="flex justify-between"><span>Shipping</span><span className="text-zinc-500">{wholeCartFree ? "FREE 🚚" : "Calculated at checkout"}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total</span><span>{formatPrice(total)}</span></div>
              {wholeCartFree ? (
                <p className="text-xs font-bold text-emerald-600">🎁 Free shipping on this order — every item is covered by the campaign.</p>
              ) : (
                <p className="text-xs text-zinc-500">Delivery: {formatTaka(rates.insideDhaka)} inside Dhaka · {formatTaka(rates.outsideDhaka)} outside Dhaka — added at checkout.</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Coupon code (try WELCOME10)"
                className="w-full rounded-lg border px-3 py-2 text-sm uppercase outline-none focus:border-orange-500"
              />
              <button onClick={applyCoupon} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white">Apply</button>
            </div>
            {couponMsg && <p className={`mt-2 text-xs ${coupon ? "text-green-600" : "text-red-500"}`}>{couponMsg}</p>}
            <Link href="/checkout" className="mt-5 block rounded-full bg-orange-600 py-3 text-center text-sm font-bold text-white hover:bg-orange-700">
              Proceed to Checkout →
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
