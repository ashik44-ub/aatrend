import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { normalizeSizesInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    console.error("admin product get error", e);
    return NextResponse.json({ error: "Failed to load product." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (body.sizes !== undefined) body.sizes = normalizeSizesInput(body.sizes);
    const fields = [
      "name", "description", "shortDescription", "price", "comparePrice", "priceTo",
      "category", "subcategory", "brand", "images", "stock", "variants",
      "colors", "sizes", "status", "badge", "dealEndsAt",
      "featured", "bestSeller",
      "isNewArrival", "onSale", "specifications",
    ] as const;
    for (const f of fields) {
      if (body[f] !== undefined) (product as unknown as Record<string, unknown>)[f] = body[f];
    }
    await product.save();
    return NextResponse.json({ ok: true, slug: product.slug });
  } catch (e) {
    console.error("admin product update error", e);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin product delete error", e);
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
}
