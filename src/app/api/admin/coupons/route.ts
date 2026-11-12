import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models/Coupon";

export const dynamic = "force-dynamic";

function shape(c: Record<string, unknown>) {
  return {
    _id: String(c._id),
    code: c.code,
    type: c.type ?? "percent",
    value: c.value ?? c.percent ?? 10,
    percent: c.type === "fixed" ? 0 : (c.value ?? c.percent ?? 10),
    minOrder: c.minOrder ?? 0,
    expiresAt: c.expiresAt ? new Date(c.expiresAt as string).toISOString().slice(0, 10) : "",
    usageLimit: c.usageLimit ?? "",
    usedCount: c.usedCount ?? 0,
    active: !!c.active,
  };
}

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons: coupons.map((c) => shape(c as unknown as Record<string, unknown>)) });
  } catch (e) {
    console.error("admin coupons list error", e);
    return NextResponse.json({ error: "Failed to load coupons." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    const code = String(body.code ?? "").toUpperCase().trim();
    const type = body.type === "fixed" ? "fixed" : "percent";
    const value = Number(body.value);
    if (!code || !value || value <= 0) {
      return NextResponse.json({ error: "Code and a discount value greater than 0 are required." }, { status: 400 });
    }
    if (type === "percent" && value > 90) {
      return NextResponse.json({ error: "Percent discount cannot exceed 90%." }, { status: 400 });
    }
    await connectDB();
    const existing = await Coupon.findOne({ code });
    if (existing) return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    const coupon = await Coupon.create({
      code,
      type,
      value,
      percent: type === "percent" ? value : 0,
      minOrder: Math.max(0, Number(body.minOrder) || 0),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : undefined,
      usedCount: 0,
      active: body.active !== false,
    });
    return NextResponse.json({ ok: true, coupon: shape(coupon.toObject() as unknown as Record<string, unknown>) });
  } catch (e) {
    console.error("admin coupon create error", e);
    return NextResponse.json({ error: "Failed to create coupon." }, { status: 500 });
  }
}
