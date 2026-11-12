import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Category } from "@/models/Category";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const cat = await Category.findById(id);
    if (!cat) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    if (body.name !== undefined) cat.name = String(body.name).trim();
    if (body.slug !== undefined && String(body.slug).trim()) cat.slug = slugify(body.slug);
    if (body.image !== undefined) cat.image = String(body.image).trim();
    if (body.tagline !== undefined) cat.tagline = String(body.tagline).trim();
    if (body.description !== undefined) cat.description = String(body.description).trim();
    if (body.group !== undefined) cat.group = body.group === "subcategory" ? "subcategory" : "category";
    if (body.order !== undefined) cat.order = Number(body.order) || 0;
    if (body.active !== undefined) cat.active = !!body.active;
    await cat.save();
    return NextResponse.json({ ok: true, category: cat });
  } catch (e) {
    console.error("admin category update error", e);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin category delete error", e);
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
}
