"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/store";
import {
  DEFAULT_FREE_SHIPPING,
  DEFAULT_SHIPPING_RATES,
  formatPrice,
  formatTaka,
  isFreeShippingLive,
  shippingChargeFor,
  type DeliveryArea,
  type FreeShippingCampaign,
} from "@/lib/utils";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [rates, setRates] = useState(DEFAULT_SHIPPING_RATES);
  const [freeShip, setFreeShip] = useState<FreeShippingCampaign>(DEFAULT_FREE_SHIPPING);
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>("inside-dhaka");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; type: "percent" | "fixed"; value: number; percent: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [payment, setPayment] = useState<"COD" | "Card">("COD");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    address: "",
    city: "",
    zip: "",
    country: "Bangladesh",
    phone: "",
  });

  const discount = coupon
    ? coupon.type === "fixed"
      ? Math.min(coupon.value, subtotal)
      : Math.round((subtotal * coupon.percent) / 100)
    : 0;
  // Free shipping: ৳0 only when the campaign is live and EVERY cart item is
  // covered. The server re-computes this from the same rules on order place.
  const itemCovered = (slug: string) =>
    isFreeShippingLive(freeShip) &&
    (freeShip.allProducts || freeShip.productSlugs.includes(slug));
  const isFreeShipping =
    items.length > 0 && items.every((i) => itemCovered(i.slug));
  const shipping = isFreeShipping ? 0 : shippingChargeFor(deliveryArea, rates);
  const total = Math.max(0, subtotal - discount + shipping);

  // Admin-managed delivery rates + free-shipping campaign — the server
  // re-computes shipping from these same rules when the order is placed,
  // so the totals always match.
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
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCoupon(null);
      setCouponMsg(data.error ?? "Invalid coupon.");
      return;
    }
    setCoupon(data);
    setCouponMsg(
      data.type === "fixed"
        ? `Coupon ${data.code} applied — ${formatPrice(data.value)} off!`
        : `Coupon ${data.code} applied — ${data.percent}% off!`
    );
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (payment === "Card" && (card.number.replace(/\s/g, "").length < 12 || !card.name || !card.expiry || card.cvc.length < 3)) {
      setError("Please fill in valid demo card details (no real charge is made).");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.name,
        customerEmail: form.email,
        items: items.map((i) => ({ slug: i.slug, quantity: i.quantity, variant: i.variant })),
        couponCode: coupon?.code,
        paymentMethod: payment,
        deliveryArea,
        shippingAddress: {
          address: form.address,
          city: form.city,
          zip: form.zip,
          country: form.country,
          phone: form.phone,
        },
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to place order.");
      return;
    }
    clear();
    router.push(`/order-success?order=${data.orderNumber}`);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-zinc-500">Your cart is empty — add something first.</p>
        <a href="/shop" className="mt-4 inline-block rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white">Go Shopping →</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Shipping Information</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
              <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500 sm:col-span-2" />
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
              <input required value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} placeholder="ZIP / Postal code" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
            </div>
            <h3 className="mt-5 text-sm font-bold">Delivery area</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${deliveryArea === "inside-dhaka" ? "border-orange-600 bg-orange-50" : ""}`}>
                <input type="radio" name="deliveryArea" checked={deliveryArea === "inside-dhaka"} onChange={() => setDeliveryArea("inside-dhaka")} />
                <span><b>Inside Dhaka</b><br /><span className="text-sm text-zinc-500">Delivery charge {formatTaka(rates.insideDhaka)}</span></span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${deliveryArea === "outside-dhaka" ? "border-orange-600 bg-orange-50" : ""}`}>
                <input type="radio" name="deliveryArea" checked={deliveryArea === "outside-dhaka"} onChange={() => setDeliveryArea("outside-dhaka")} />
                <span><b>Outside Dhaka</b><br /><span className="text-sm text-zinc-500">Delivery charge {formatTaka(rates.outsideDhaka)}</span></span>
              </label>
            </div>
          </section>
          <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Payment Method</h2>
            <div className="mt-4 space-y-3">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${payment === "COD" ? "border-orange-600 bg-orange-50" : ""}`}>
                <input type="radio" name="payment" checked={payment === "COD"} onChange={() => setPayment("COD")} />
                <span><b>Cash on Delivery</b><br /><span className="text-sm text-zinc-500">Pay when your order arrives.</span></span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${payment === "Card" ? "border-orange-600 bg-orange-50" : ""}`}>
                <input type="radio" name="payment" checked={payment === "Card"} onChange={() => setPayment("Card")} />
                <span><b>Card (Demo)</b><br /><span className="text-sm text-zinc-500">Demo checkout — no real payment gateway connected, no charge is made.</span></span>
              </label>
            </div>
            {payment === "Card" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Card number (demo: 4242 4242 4242 4242)" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500 sm:col-span-2" />
                <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Name on card" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500 sm:col-span-2" />
                <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="MM / YY" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
                <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="CVC" className="rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
              </div>
            )}
          </section>
          {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full rounded-full bg-orange-600 py-4 text-base font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {busy ? "Placing order..." : `Place Order — ${formatPrice(total)}`}
          </button>
        </div>
        <aside className="h-fit rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((it) => (
              <li key={`${it.slug}-${it.variant ?? ""}`} className="flex items-center gap-3 text-sm">
                <img src={it.image} alt={it.name} className="h-12 w-12 rounded-lg object-cover" />
                <span className="flex-1">
                  {it.name} × {it.quantity}
                  {itemCovered(it.slug) && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      🚚 Free shipping
                    </span>
                  )}
                </span>
                <b>{formatPrice(it.price * it.quantity)}</b>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({coupon?.code})</span><span>−{formatPrice(discount)}</span></div>}
            <div className="flex justify-between">
              <span>Shipping ({deliveryArea === "inside-dhaka" ? "Inside Dhaka" : "Outside Dhaka"})</span>
              <span className={isFreeShipping ? "font-bold text-emerald-600" : ""}>
                {isFreeShipping ? "FREE 🚚" : formatTaka(shipping)}
              </span>
            </div>
            {isFreeShipping && (
              <p className="text-xs text-emerald-600">🎁 Free shipping campaign applied — every item in this order is covered.</p>
            )}
            {!isFreeShipping && isFreeShippingLive(freeShip) && items.some((i) => itemCovered(i.slug)) && (
              <p className="text-xs text-zinc-500">
                Some items in this cart ship free, but the order has non-covered items too — normal delivery
                rates apply. Remove the non-covered items to get free shipping.
              </p>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-black"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
          <div className="mt-4 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="w-full rounded-lg border px-3 py-2 text-sm uppercase outline-none" />
            <button type="button" onClick={applyCoupon} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white">Apply</button>
          </div>
          {couponMsg && <p className={`mt-2 text-xs ${coupon ? "text-green-600" : "text-red-500"}`}>{couponMsg}</p>}
        </aside>
      </form>
    </div>
  );
}
