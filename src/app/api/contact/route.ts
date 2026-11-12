import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim().slice(0, 200);
    const message = String(body.message ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

    await connectDB();
    // Messages are saved to the admin inbox (Admin → Messages) — no email sending.
    await ContactMessage.create({ name, email, subject, message, read: false });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("contact submit error", e);
    return NextResponse.json({ error: "Failed to send your message. Please try again." }, { status: 500 });
  }
}
