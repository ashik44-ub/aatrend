import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q) return NextResponse.json({ results: [] });
    await connectDB();
    const results = await Product.find({ $text: { $search: q } })
      .select("name slug price comparePrice images category")
      .limit(6)
      .lean();
    return NextResponse.json({ results });
  } catch (e) {
    console.error("search error", e);
    return NextResponse.json({ results: [] });
  }
}
