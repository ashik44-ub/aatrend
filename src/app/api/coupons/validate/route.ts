import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Coupon, couponDiscount, couponUsable } from "@/models/Coupon";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) return NextResponse.json({ error: "Coupon code required." }, { status: 400 });
    await connectDB();
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() }).lean();
    if (!coupon) return NextResponse.json({ error: "Invalid coupon code." }, { status: 404 });
    const blocked = couponUsable(coupon);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 400 });
    const sub = Math.max(0, Number(subtotal) || 0);
    if (coupon.minOrder > 0 && sub < coupon.minOrder) {
      return NextResponse.json(
        { error: `Minimum order ${formatPrice(coupon.minOrder)} required for this coupon.` },
        { status: 400 }
      );
    }
    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      percent: coupon.type === "percent" ? coupon.value : 0,
      minOrder: coupon.minOrder ?? 0,
      discount: sub > 0 ? couponDiscount(coupon, sub) : undefined,
    });
  } catch (e) {
    console.error("coupon error", e);
    return NextResponse.json({ error: "Failed to validate coupon." }, { status: 500 });
  }
}
