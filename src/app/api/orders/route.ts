import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Coupon, couponDiscount, couponUsable } from "@/models/Coupon";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { SiteSettings } from "@/models/SiteSettings";
import {
  cartCoveredByFreeShipping,
  DEFAULT_SHIPPING_RATES,
  formatPrice,
  shippingChargeFor,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

function orderNumber(): string {
  return `NT-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, customerEmail, items, couponCode, paymentMethod, shippingAddress, deliveryArea } = body;
    if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Customer details and at least one item are required." }, { status: 400 });
    }
    if (!shippingAddress?.address || !shippingAddress?.city) {
      return NextResponse.json({ error: "Shipping address is required." }, { status: 400 });
    }
    const area = deliveryArea === "outside-dhaka" ? "outside-dhaka" : "inside-dhaka";
    await connectDB();

    // Re-price from the DB so the client cannot forge prices.
    let subtotal = 0;
    const orderItems = [];
    const orderSlugs: string[] = [];
    for (const it of items) {
      const p = await Product.findOne({ slug: it.slug }).lean();
      if (!p) return NextResponse.json({ error: `Product not found: ${it.slug}` }, { status: 400 });
      const qty = Math.max(1, Math.min(Number(it.quantity) || 1, p.stock || 99));
      subtotal += p.price * qty;
      orderSlugs.push(p.slug);
      orderItems.push({
        productId: String(p._id),
        name: p.name,
        image: p.images?.[0] ?? "",
        price: p.price,
        quantity: qty,
        variant: it.variant || "",
      });
    }

    let discount = 0;
    let code: string | undefined;
    let appliedCouponId: string | undefined;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
      if (coupon) {
        const blocked = couponUsable(coupon);
        if (blocked) return NextResponse.json({ error: blocked }, { status: 400 });
        if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
          return NextResponse.json(
            { error: `Minimum order ${formatPrice(coupon.minOrder)} required for this coupon.` },
            { status: 400 }
          );
        }
        code = coupon.code;
        appliedCouponId = String(coupon._id);
        discount = couponDiscount(coupon, subtotal);
      }
    }
    // Shipping is computed server-side from the admin-managed rates —
    // the client only picks the delivery area, never the amount.
    // Free shipping: ৳0 only when the campaign is live AND every item in
    // the cart is covered (all-products, or all slugs among the picks).
    const settings = await SiteSettings.findOne({ key: "site" }).lean();
    const rates = (settings?.shipping ?? {}) as { insideDhaka?: unknown; outsideDhaka?: unknown };
    const fr = (settings?.freeShipping ?? {}) as {
      active?: unknown;
      endsAt?: unknown;
      allProducts?: unknown;
      productIds?: unknown;
    };
    const freeShipping = cartCoveredByFreeShipping(
      orderSlugs,
      {
        active: !!fr.active,
        endsAt: fr.endsAt ? new Date(fr.endsAt as string).toISOString() : null,
        allProducts: !!fr.allProducts,
        productSlugs: Array.isArray(fr.productIds)
          ? (fr.productIds as unknown[]).map((s) => String(s)).filter(Boolean)
          : [],
      }
    );
    const shipping = freeShipping
      ? 0
      : shippingChargeFor(area, {
          insideDhaka: Number(rates.insideDhaka ?? DEFAULT_SHIPPING_RATES.insideDhaka) || 0,
          outsideDhaka: Number(rates.outsideDhaka ?? DEFAULT_SHIPPING_RATES.outsideDhaka) || 0,
        });
    const total = Math.round(subtotal - discount + shipping);

    const order = await Order.create({
      orderNumber: orderNumber(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      items: orderItems,
      subtotal,
      discount,
      shipping,
      freeShipping,
      deliveryArea: area,
      total,
      couponCode: code,
      paymentMethod: paymentMethod === "Card" ? "Card" : "COD",
      shippingAddress,
      status: "Pending",
    });

    // Decrement stock + increment sold.
    for (const it of orderItems) {
      await Product.updateOne(
        { _id: it.productId },
        { $inc: { stock: -it.quantity, sold: it.quantity } }
      );
    }
    // Track coupon usage.
    if (appliedCouponId) {
      await Coupon.updateOne({ _id: appliedCouponId }, { $inc: { usedCount: 1 } });
    }

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, total });
  } catch (e) {
    console.error("order create error", e);
    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    await connectDB();
    const orders = await Order.find({ customerEmail: session.user.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("orders list error", e);
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}
