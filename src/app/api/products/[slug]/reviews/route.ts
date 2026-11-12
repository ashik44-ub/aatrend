import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Please sign in to write a review." }, { status: 401 });
    }
    const { slug } = await params;
    const { rating, title, comment } = await req.json();
    if (!rating || rating < 1 || rating > 5 || !comment?.trim()) {
      return NextResponse.json({ error: "A rating and a comment are required." }, { status: 400 });
    }
    await connectDB();
    const product = await Product.findOne({ slug });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    product.reviews.push({
      userName: session.user.name ?? session.user.email ?? "Customer",
      rating: Number(rating),
      title: title?.trim() || "",
      comment: comment.trim(),
      createdAt: new Date(),
    });
    product.reviewCount = product.reviews.length;
    product.rating =
      Math.round((product.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / product.reviews.length) * 10) / 10;
    await product.save();
    return NextResponse.json({ ok: true, rating: product.rating, reviewCount: product.reviewCount });
  } catch (e) {
    console.error("review error", e);
    return NextResponse.json({ error: "Failed to save review." }, { status: 500 });
  }
}
