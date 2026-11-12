import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetRequest } from "@/models/PasswordResetRequest";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password { email }
 *
 * No email is sent (the site has no mailer by design). A secure random
 * token is generated; ONLY its SHA-256 hash is stored, valid for 1 hour,
 * single-use. The admin hands the reset link to the user (WhatsApp/phone)
 * from Admin → Users & Roles.
 *
 * The response is identical whether the email exists or not, so the
 * endpoint can never be used to probe which emails have accounts.
 * The env-based main admin account (ADMIN_EMAIL) cannot be reset this way
 * — its password lives in .env.local — so no request is created for it.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "")
      .toLowerCase()
      .trim();
    if (!email || !email.includes("@")) {
      // Same generic reply even for a bad address — nothing to learn here.
      return NextResponse.json({ ok: true });
    }

    await connectDB();

    // Env admin: same generic reply, no request created.
    const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
    if (adminEmail && email === adminEmail) {
      return NextResponse.json({ ok: true });
    }

    const user = await User.findOne({ email }).select("_id email").lean();
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // One active request per user — retire any earlier pending ones.
    await PasswordResetRequest.deleteMany({
      user: user._id,
      usedAt: null,
      handledAt: null,
    });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await PasswordResetRequest.create({
      user: user._id,
      email: user.email,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("forgot-password error", e);
    // Still generic — never leak whether the lookup failed.
    return NextResponse.json({ ok: true });
  }
}
