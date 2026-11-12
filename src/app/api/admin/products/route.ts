import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { slugify, normalizeSizesInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = 10;
    const filter: Record<string, unknown> = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("admin products list error", e);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json({ error: "Name, price and category are required." }, { status: 400 });
    }
    await connectDB();
    const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
    const existing = await Product.findOne({ slug });
    if (existing) return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
    const product = await Product.create({
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || body.name.trim(),
      shortDescription: body.shortDescription?.trim() || "",
      price: Number(body.price),
      comparePrice: body.comparePrice ? Number(body.comparePrice) : undefined,
      priceTo: body.priceTo ? Number(body.priceTo) : undefined,
      category: body.category,
      subcategory: body.subcategory || undefined,
      brand: body.brand?.trim() || undefined,
      images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
      stock: Number(body.stock ?? 0),
      variants: Array.isArray(body.variants) ? body.variants : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      sizes: normalizeSizesInput(body.sizes),
      status: ["in_stock", "pre_order", "sold_out"].includes(body.status) ? body.status : "in_stock",
      badge: ["sale", "hot", "new"].includes(body.badge) ? body.badge : null,
      dealEndsAt: body.dealEndsAt ? new Date(body.dealEndsAt) : undefined,
      featured: !!body.featured,
      bestSeller: !!body.bestSeller,
      isNewArrival: body.isNewArrival !== false,
      onSale: !!body.onSale,
      specifications: Array.isArray(body.specifications) ? body.specifications : [],
    });
    return NextResponse.json({ ok: true, slug: product.slug });
  } catch (e) {
    console.error("admin product create error", e);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
