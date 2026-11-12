import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const category = url.searchParams.get("category");
    const min = Number(url.searchParams.get("min") || 0);
    const max = Number(url.searchParams.get("max") || 0);
    const minRating = Number(url.searchParams.get("rating") || 0);
    const inStock = url.searchParams.get("inStock") === "1";
    const sort = url.searchParams.get("sort") || "newest";
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit") || 12)));

    const filter: Record<string, unknown> = {};
    if (category && category !== "All") filter.category = category;
    if (q) filter.$text = { $search: q };
    if (min > 0 || max > 0) {
      filter.price = {};
      if (min > 0) (filter.price as Record<string, number>).$gte = min;
      if (max > 0) (filter.price as Record<string, number>).$lte = max;
    }
    if (minRating > 0) filter.rating = { $gte: minRating };
    if (inStock) filter.stock = { $gt: 0 };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      newest: { createdAt: -1 },
      rating: { rating: -1 },
      popular: { sold: -1 },
    };
    const sortBy = sortMap[sort] ?? sortMap.newest;

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("products list error", e);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}
