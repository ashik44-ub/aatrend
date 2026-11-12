import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models/Coupon";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const coupon = await Coupon.findById(id);
    if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    const type = body.type === "fixed" ? "fixed" : body.type === "percent" ? "percent" : coupon.type;
    const value = body.value !== undefined ? Number(body.value) : coupon.value;
    if (value <= 0) return NextResponse.json({ error: "Discount value must be greater than 0." }, { status: 400 });
    if (type === "percent" && value > 90) {
      return NextResponse.json({ error: "Percent discount cannot exceed 90%." }, { status: 400 });
    }
    coupon.type = type;
    coupon.value = value;
    coupon.percent = type === "percent" ? value : 0;
    if (body.minOrder !== undefined) coupon.minOrder = Math.max(0, Number(body.minOrder) || 0);
    if (body.expiresAt !== undefined) coupon.expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    if (body.usageLimit !== undefined) coupon.usageLimit = body.usageLimit ? Number(body.usageLimit) : undefined;
    if (body.active !== undefined) coupon.active = !!body.active;
    await coupon.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin coupon update error", e);
    return NextResponse.json({ error: "Failed to update coupon." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin coupon delete error", e);
    return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
  }
}
