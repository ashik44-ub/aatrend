import { NextResponse } from "next/server";
import { getAdminSession, getAuthContext, type Role } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

const VALID_ROLES: Role[] = ["customer", "administration", "admin"];

/** All registered users with their role — admin only. */
export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const users = await User.find({})
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const rows = await Promise.all(
      users.map(async (u) => {
        const orders = await Order.find({ customerEmail: u.email }).lean();
        const joined = u.createdAt ? new Date(u.createdAt) : null;
        return {
          id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role as Role,
          joined: joined && !isNaN(joined.getTime()) ? joined.toISOString() : null,
          orders: orders.length,
          spent: Math.round(orders.reduce((s, o) => s + o.total, 0) * 100) / 100,
        };
      })
    );
    return NextResponse.json({ users: rows });
  } catch (e) {
    console.error("admin users get error", e);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}

/** Change a user's role — admin only, with safety guards. */
export async function PATCH(req: Request) {
  try {
    const ctx = await getAuthContext();
    if (!ctx || ctx.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    const userId = String(body.userId ?? "");
    const role = String(body.role ?? "") as Role;
    if (!userId || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid user or role." }, { status: 400 });
    }
    await connectDB();
    const target = await User.findById(userId);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    // An admin can never demote (or change) their own role.
    if (String(target._id) === ctx.userId) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }
    if (target.role === role) {
      return NextResponse.json({ ok: true, role: target.role });
    }
    // The system must never be left with zero admins.
    if (target.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin. Promote someone else to admin first." },
          { status: 400 }
        );
      }
    }
    target.role = role;
    await target.save();
    return NextResponse.json({ ok: true, role: target.role });
  } catch (e) {
    console.error("admin users patch error", e);
    return NextResponse.json({ error: "Failed to update role." }, { status: 500 });
  }
}
