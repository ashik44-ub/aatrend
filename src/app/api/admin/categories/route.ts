import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const categories = await Category.find({}).sort({ group: 1, order: 1, name: 1 }).lean();
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("admin categories list error", e);
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    await connectDB();
    const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);
    const group = body.group === "subcategory" ? "subcategory" : "category";
    const existing = await Category.findOne({ slug, group });
    if (existing) return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
    const cat = await Category.create({
      name: body.name.trim(),
      slug,
      image: String(body.image ?? "").trim(),
      tagline: String(body.tagline ?? "").trim(),
      description: String(body.description ?? "").trim(),
      group,
      order: Number(body.order ?? 0),
      active: body.active !== false,
    });
    return NextResponse.json({ ok: true, category: cat });
  } catch (e) {
    console.error("admin category create error", e);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
