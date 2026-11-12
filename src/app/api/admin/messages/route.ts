import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const [messages, unread] = await Promise.all([
      ContactMessage.find({}).sort({ createdAt: -1 }).limit(100).lean(),
      ContactMessage.countDocuments({ read: false }),
    ]);
    return NextResponse.json({ messages, unread });
  } catch (e) {
    console.error("admin messages get error", e);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Message id is required." }, { status: 400 });
    await connectDB();
    await ContactMessage.findByIdAndUpdate(id, { read: !!body.read });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin messages update error", e);
    return NextResponse.json({ error: "Failed to update message." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Message id is required." }, { status: 400 });
    await connectDB();
    await ContactMessage.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin messages delete error", e);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }
}
