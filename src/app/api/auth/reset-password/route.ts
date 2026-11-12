import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetRequest } from "@/models/PasswordResetRequest";

export const dynamic = "force-dynamic";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function findValidRequest(token: string) {
  if (!token || typeof token !== "string") return null;
  await connectDB();
  const reqDoc = await PasswordResetRequest.findOne({
    tokenHash: hashToken(token),
    usedAt: null,
    handledAt: null,
    expiresAt: { $gt: new Date() },
  });
  return reqDoc;
}

/** GET /api/auth/reset-password?token=… — check a token before showing the form. */
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    const valid = (await findValidRequest(token)) !== null;
    if (!valid) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset-password check error", e);
    return NextResponse.json({ error: "Could not verify the reset link." }, { status: 500 });
  }
}

/**
 * POST /api/auth/reset-password { token, password }
 * Sets a new password (min 6 chars, same bcrypt hashing as registration),
 * then burns the token so it can never be reused.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    if (!token) {
      return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const reqDoc = await findValidRequest(token);
    if (!reqDoc) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const user = await User.findById(reqDoc.user);
    if (!user) {
      // User vanished — burn the token anyway.
      reqDoc.usedAt = new Date();
      await reqDoc.save();
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    reqDoc.usedAt = new Date();
    await reqDoc.save();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset-password error", e);
    return NextResponse.json({ error: "Could not reset the password." }, { status: 500 });
  }
}
