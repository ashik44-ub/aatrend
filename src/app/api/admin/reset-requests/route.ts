import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetRequest } from "@/models/PasswordResetRequest";

export const dynamic = "force-dynamic";

function siteOrigin(req: Request): string {
  // Prefer the configured public URL so copied links work from anywhere;
  // fall back to the request's own origin (dev / direct access).
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (configured) return configured;
  return new URL(req.url).origin;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Pending password-reset requests — admin only. */
export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const pending = await PasswordResetRequest.find({
      usedAt: null,
      handledAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
    const requests = await Promise.all(
      pending.map(async (r) => {
        const user = await User.findById(r.user).select("name email").lean();
        return {
          id: String(r._id),
          name: user?.name ?? "—",
          email: user?.email ?? r.email,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
          expiresAt: new Date(r.expiresAt).toISOString(),
        };
      })
    );
    return NextResponse.json({ requests });
  } catch (e) {
    console.error("admin reset-requests get error", e);
    return NextResponse.json({ error: "Failed to load reset requests." }, { status: 500 });
  }
}

/**
 * POST /api/admin/reset-requests — admin only.
 *
 * { requestId, action: "generate-link" } — creates a FRESH reset token for
 * the request (only the hash is stored; the raw token is returned ONCE in
 * this response so the admin can copy the link and send it to the user).
 * The link is valid for 1 hour from generation.
 *
 * { requestId, action: "set-password", password } — admin sets a temporary
 * password directly (same bcrypt hashing as registration); the request is
 * marked handled so it disappears from the pending list.
 *
 * { requestId, action: "dismiss" } — drop a request without action.
 */
export async function POST(req: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const requestId = String(body.requestId ?? "");
    const action = String(body.action ?? "");
    if (!requestId) {
      return NextResponse.json({ error: "Missing request." }, { status: 400 });
    }
    await connectDB();
    const reqDoc = await PasswordResetRequest.findById(requestId);
    if (!reqDoc || reqDoc.usedAt || reqDoc.handledAt) {
      return NextResponse.json({ error: "Request not found or already handled." }, { status: 404 });
    }

    if (action === "dismiss") {
      reqDoc.handledAt = new Date();
      await reqDoc.save();
      return NextResponse.json({ ok: true });
    }

    if (action === "generate-link") {
      const token = crypto.randomBytes(32).toString("hex");
      reqDoc.tokenHash = hashToken(token);
      reqDoc.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await reqDoc.save();
      const resetLink = `${siteOrigin(req)}/reset-password?token=${token}`;
      return NextResponse.json({ ok: true, resetLink });
    }

    if (action === "set-password") {
      const password = String(body.password ?? "");
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Temporary password must be at least 6 characters." },
          { status: 400 }
        );
      }
      const user = await User.findById(reqDoc.user);
      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      user.passwordHash = await bcrypt.hash(password, 10);
      await user.save();
      reqDoc.handledAt = new Date();
      await reqDoc.save();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    console.error("admin reset-requests post error", e);
    return NextResponse.json({ error: "Failed to handle reset request." }, { status: 500 });
  }
}
