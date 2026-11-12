import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Page } from "@/models/Page";
import { DEFAULT_PAGES, PAGE_SLUGS } from "@/lib/pages";
import type { PageSlug } from "@/models/Page";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const docs = await Page.find({ slug: { $in: PAGE_SLUGS } }).lean();
    const bySlug = new Map(docs.map((d) => [d.slug as string, d]));
    const pages = PAGE_SLUGS.map((slug) => {
      const d = bySlug.get(slug);
      return {
        slug,
        title: (d?.title as string) ?? DEFAULT_PAGES[slug].title,
        content: (d?.content as string) ?? DEFAULT_PAGES[slug].content,
        updatedAt: d?.updatedAt ? new Date(d.updatedAt as unknown as string).toISOString() : null,
        saved: !!d,
      };
    });
    return NextResponse.json({ pages });
  } catch (e) {
    console.error("admin pages get error", e);
    return NextResponse.json({ error: "Failed to load pages." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    const slug = String(body.slug ?? "") as PageSlug;
    if (!PAGE_SLUGS.includes(slug)) {
      return NextResponse.json({ error: "Unknown page." }, { status: 400 });
    }
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "");
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    await connectDB();
    await Page.findOneAndUpdate(
      { slug },
      { $set: { title, content } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin pages save error", e);
    return NextResponse.json({ error: "Failed to save page." }, { status: 500 });
  }
}
