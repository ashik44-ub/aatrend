import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { publicSettings } from "@/app/api/admin/settings/route";

/**
 * Shipping-only settings endpoint (rates + free-shipping campaign).
 * Staff roles (admin + administration) may read and write ONLY these two
 * blocks — every other setting stays behind the admin-only settings API,
 * so an administration user can never reach flash/summer sale, coupons,
 * hero slides, site content or any other setting through here.
 */
export const dynamic = "force-dynamic";

function cleanStringList(v: unknown, limit = 50): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const x of v) {
    const s = String(x ?? "").trim();
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

function toDateTimeLocal(d?: Date | string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export async function GET() {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const doc = await SiteSettings.findOne({ key: "site" }).lean();
    if (!doc) return NextResponse.json(publicSettings({}));
    const pub = publicSettings(doc as unknown as Parameters<typeof publicSettings>[0]);
    return NextResponse.json({
      shipping: pub.shipping,
      freeShipping: pub.freeShipping,
      freeShippingEndsAtLocal: toDateTimeLocal(
        (doc.freeShipping as { endsAt?: Date | string } | undefined)?.endsAt
      ),
    });
  } catch (e) {
    console.error("admin shipping get error", e);
    return NextResponse.json({ error: "Failed to load shipping settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await getStaffSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    await connectDB();
    // Merge with the stored values so a partial update can never wipe the
    // other block — and never touch any other settings block.
    const stored = await SiteSettings.findOne({ key: "site" }).lean();
    const storedShipping = (stored?.shipping ?? {}) as Record<string, unknown>;
    const storedFree = (stored?.freeShipping ?? {}) as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    if (body.shipping) {
      const sp = body.shipping as Record<string, unknown>;
      update.shipping = {
        insideDhaka:
          sp.insideDhaka !== undefined && sp.insideDhaka !== null && sp.insideDhaka !== ""
            ? Math.max(0, Math.round(Number(sp.insideDhaka)) || 0)
            : Math.max(0, Number(storedShipping.insideDhaka ?? 70) || 0),
        outsideDhaka:
          sp.outsideDhaka !== undefined && sp.outsideDhaka !== null && sp.outsideDhaka !== ""
            ? Math.max(0, Math.round(Number(sp.outsideDhaka)) || 0)
            : Math.max(0, Number(storedShipping.outsideDhaka ?? 120) || 0),
      };
    }
    if (body.freeShipping) {
      const fr = body.freeShipping as Record<string, unknown>;
      update.freeShipping = {
        active: fr.active !== undefined ? !!fr.active : !!storedFree.active,
        endsAt:
          fr.endsAt === "" || fr.endsAt === null
            ? null
            : fr.endsAt
              ? new Date(fr.endsAt as string)
              : (storedFree.endsAt as Date | undefined),
        allProducts: fr.allProducts !== undefined ? !!fr.allProducts : !!storedFree.allProducts,
        productIds:
          fr.productIds !== undefined
            ? cleanStringList(fr.productIds)
            : cleanStringList(storedFree.productIds),
      };
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const doc = await SiteSettings.findOneAndUpdate(
      { key: "site" },
      { $set: update },
      { upsert: true, new: true }
    ).lean();
    const pub = publicSettings(doc as unknown as Parameters<typeof publicSettings>[0]);
    return NextResponse.json({
      ok: true,
      shipping: pub.shipping,
      freeShipping: pub.freeShipping,
      freeShippingEndsAtLocal: toDateTimeLocal(
        (doc.freeShipping as { endsAt?: Date | string } | undefined)?.endsAt
      ),
    });
  } catch (e) {
    console.error("admin shipping put error", e);
    return NextResponse.json({ error: "Failed to save shipping settings." }, { status: 500 });
  }
}
