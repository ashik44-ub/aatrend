import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Name, a valid email and a password of at least 6 characters are required." },
        { status: 400 }
      );
    }
    await connectDB();
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "customer",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
