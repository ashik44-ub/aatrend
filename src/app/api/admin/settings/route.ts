import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";

export const dynamic = "force-dynamic";

function defaultFlashSale() {
  return {
    active: true,
    title: "Flash Sale",
    subtitle: "",
    discountText: "Up To 70% Off",
    endsAt: new Date(Date.now() + 3 * 86400000),
    buttonText: "Shop Sale Now",
    buttonLink: "/shop?onSale=1",
  };
}

function defaultFreeShipping() {
  return {
    active: false,
    endsAt: undefined,
    allProducts: false,
    productIds: [] as string[],
  };
}

function defaultSummerSale() {
  return {
    active: true,
    title: "Summer Sale",
    subtitle: "Beat the heat with fresh summer styles",
    discountText: "Up To 50% Off",
    endsAt: new Date(Date.now() + 14 * 86400000),
    buttonText: "Shop Summer Sale",
    buttonLink: "/shop?sale=summer",
    bannerImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1600&auto=format&fit=crop",
    themeColor: "#f59e0b",
    productIds: [] as string[],
    categories: [] as string[],
  };
}

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

function cleanHex(v: unknown, fallback: string): string {
  const s = String(v ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : fallback;
}

function toDateTimeLocal(d?: Date | string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function publicSettings(doc: {
  shipping?: Record<string, unknown>;
  freeShipping?: Record<string, unknown>;
  flashSale?: Record<string, unknown>;
  summerSale?: Record<string, unknown>;
  heroSlides?: unknown[];
  announcementBar?: Record<string, unknown>;
  trustBadges?: unknown[];
  headings?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  promoTiles?: unknown[];
}) {
  const sh = (doc.shipping ?? {}) as Record<string, unknown>;
  const fr = (doc.freeShipping ?? {}) as Record<string, unknown>;
  const fs = (doc.flashSale ?? {}) as Record<string, unknown>;
  const ss = (doc.summerSale ?? {}) as Record<string, unknown>;
  const ab = (doc.announcementBar ?? {}) as Record<string, unknown>;
  const hd = (doc.headings ?? {}) as Record<string, unknown>;
  const ft = (doc.footer ?? {}) as Record<string, unknown>;
  return {
    shipping: {
      insideDhaka: Math.max(0, Number(sh.insideDhaka ?? 70) || 0),
      outsideDhaka: Math.max(0, Number(sh.outsideDhaka ?? 120) || 0),
    },
    freeShipping: {
      active: !!fr.active,
      endsAt: fr.endsAt ? new Date(fr.endsAt as string).toISOString() : null,
      allProducts: !!fr.allProducts,
      productIds: cleanStringList(fr.productIds),
    },
    flashSale: {
      active: !!fs.active,
      title: String(fs.title ?? "Flash Sale"),
      subtitle: String(fs.subtitle ?? ""),
      discountText: String(fs.discountText ?? "Up To 70% Off"),
      endsAt: fs.endsAt ? new Date(fs.endsAt as string).toISOString() : null,
      buttonText: String(fs.buttonText ?? "Shop Sale Now"),
      buttonLink: String(fs.buttonLink ?? "/shop?onSale=1"),
    },
    summerSale: {
      active: !!ss.active,
      title: String(ss.title ?? "Summer Sale"),
      subtitle: String(ss.subtitle ?? ""),
      discountText: String(ss.discountText ?? "Up To 50% Off"),
      endsAt: ss.endsAt ? new Date(ss.endsAt as string).toISOString() : null,
      buttonText: String(ss.buttonText ?? "Shop Summer Sale"),
      buttonLink: String(ss.buttonLink ?? "/shop?sale=summer"),
      bannerImage: String(ss.bannerImage ?? ""),
      themeColor: cleanHex(ss.themeColor, "#f59e0b"),
      productIds: cleanStringList(ss.productIds),
      categories: cleanStringList(ss.categories),
    },
    heroSlides: Array.isArray(doc.heroSlides) ? doc.heroSlides : [],
    announcementBar: {
      active: !!ab.active,
      text: String(ab.text ?? ""),
      link: String(ab.link ?? "/shop"),
    },
    trustBadges: Array.isArray(doc.trustBadges) ? doc.trustBadges : [],
    headings: {
      categoriesTitle: String(hd.categoriesTitle ?? "Shop by Categories"),
      newArrivalsTitle: String(hd.newArrivalsTitle ?? "New Arrivals"),
      bestSellersTitle: String(hd.bestSellersTitle ?? "Best Sellers"),
    },
    footer: {
      aboutText: String(ft.aboutText ?? ""),
      copyrightText: String(ft.copyrightText ?? ""),
    },
    promoTiles: Array.isArray(doc.promoTiles) ? doc.promoTiles : [],
  };
}

export { DEFAULT_TRUST_BADGES, DEFAULT_PROMO_TILES } from "@/lib/siteContent";

export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    let doc = await SiteSettings.findOne({ key: "site" }).lean();
    if (!doc) {
      const created = await SiteSettings.create({
        key: "site",
        freeShipping: defaultFreeShipping(),
        flashSale: defaultFlashSale(),
        summerSale: defaultSummerSale(),
        heroSlides: [],
      });
      doc = created.toObject();
    }
    return NextResponse.json({
      ...publicSettings(doc as unknown as { flashSale?: Record<string, unknown>; summerSale?: Record<string, unknown>; heroSlides?: unknown[] }),
      freeShippingEndsAtLocal: toDateTimeLocal(
        (doc.freeShipping as { endsAt?: Date | string } | undefined)?.endsAt
      ),
      flashSaleEndsAtLocal: toDateTimeLocal(
        (doc.flashSale as { endsAt?: Date | string } | undefined)?.endsAt
      ),
      summerSaleEndsAtLocal: toDateTimeLocal(
        (doc.summerSale as { endsAt?: Date | string } | undefined)?.endsAt
      ),
    });
  } catch (e) {
    console.error("admin settings get error", e);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const body = await req.json();
    await connectDB();
    // Merge sale blocks with the stored values so a partial update (e.g.
    // only the discount text) can never wipe active/endsAt/product picks.
    const stored = await SiteSettings.findOne({ key: "site" }).lean();
    const storedShipping = ((stored?.shipping ?? {}) as Record<string, unknown>);
    const storedFree = ((stored?.freeShipping ?? {}) as Record<string, unknown>);
    const storedFlash = ((stored?.flashSale ?? {}) as Record<string, unknown>);
    const storedSummer = ((stored?.summerSale ?? {}) as Record<string, unknown>);
    const update: Record<string, unknown> = {};
    if (body.freeShipping) {
      const fr = body.freeShipping as Record<string, unknown>;
      update.freeShipping = {
        active: fr.active !== undefined ? !!fr.active : !!storedFree.active,
        // Empty string clears the end date (campaign runs until switched off).
        // null (not undefined) so $set actually clears the stored value.
        endsAt:
          fr.endsAt === "" || fr.endsAt === null
            ? null
            : fr.endsAt
              ? new Date(fr.endsAt as string)
              : (storedFree.endsAt as Date | undefined),
        allProducts: fr.allProducts !== undefined ? !!fr.allProducts : !!storedFree.allProducts,
        productIds: fr.productIds !== undefined ? cleanStringList(fr.productIds) : cleanStringList(storedFree.productIds),
      };
    }
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
    if (body.flashSale) {
      const fs = body.flashSale as Record<string, unknown>;
      update.flashSale = {
        active: fs.active !== undefined ? !!fs.active : !!storedFlash.active,
        title: String(fs.title ?? storedFlash.title ?? "Flash Sale"),
        subtitle: String(fs.subtitle ?? storedFlash.subtitle ?? ""),
        discountText: String(fs.discountText ?? storedFlash.discountText ?? "Up To 70% Off"),
        endsAt: fs.endsAt ? new Date(fs.endsAt as string) : (storedFlash.endsAt as Date | undefined),
        buttonText: String(fs.buttonText ?? storedFlash.buttonText ?? "Shop Sale Now"),
        buttonLink: String(fs.buttonLink ?? storedFlash.buttonLink ?? "/shop?onSale=1"),
      };
    }
    if (body.summerSale) {
      const ss = body.summerSale as Record<string, unknown>;
      update.summerSale = {
        active: ss.active !== undefined ? !!ss.active : !!storedSummer.active,
        title: String(ss.title ?? storedSummer.title ?? "Summer Sale"),
        subtitle: String(ss.subtitle ?? storedSummer.subtitle ?? ""),
        discountText: String(ss.discountText ?? storedSummer.discountText ?? "Up To 50% Off"),
        endsAt: ss.endsAt ? new Date(ss.endsAt as string) : (storedSummer.endsAt as Date | undefined),
        buttonText: String(ss.buttonText ?? storedSummer.buttonText ?? "Shop Summer Sale"),
        buttonLink: String(ss.buttonLink ?? storedSummer.buttonLink ?? "/shop?sale=summer"),
        bannerImage: String(ss.bannerImage ?? storedSummer.bannerImage ?? "").trim(),
        themeColor: cleanHex(ss.themeColor ?? (storedSummer.themeColor as string | undefined), "#f59e0b"),
        productIds: ss.productIds !== undefined ? cleanStringList(ss.productIds) : cleanStringList(storedSummer.productIds),
        categories: ss.categories !== undefined ? cleanStringList(ss.categories) : cleanStringList(storedSummer.categories),
      };
    }
    if (Array.isArray(body.heroSlides)) {
      update.heroSlides = (body.heroSlides as Record<string, unknown>[])
        .slice(0, 5)
        .map((s, i) => ({
          image: String(s.image ?? "").trim(),
          title: String(s.title ?? ""),
          subtitle: String(s.subtitle ?? ""),
          buttonText: String(s.buttonText ?? "Shop Now"),
          buttonLink: String(s.buttonLink ?? "/shop"),
          order: i,
        }))
        .filter((s) => s.image);
    }
    if (body.announcementBar) {
      const a = body.announcementBar as Record<string, unknown>;
      update.announcementBar = {
        active: !!a.active,
        text: String(a.text ?? ""),
        link: String(a.link ?? "/shop"),
      };
    }
    if (Array.isArray(body.trustBadges)) {
      update.trustBadges = (body.trustBadges as Record<string, unknown>[])
        .slice(0, 4)
        .map((t) => ({
          icon: String(t.icon ?? ""),
          title: String(t.title ?? ""),
          sub: String(t.sub ?? ""),
        }))
        .filter((t) => t.title);
    }
    if (body.headings) {
      const h = body.headings as Record<string, unknown>;
      update.headings = {
        categoriesTitle: String(h.categoriesTitle ?? "Shop by Categories"),
        newArrivalsTitle: String(h.newArrivalsTitle ?? "New Arrivals"),
        bestSellersTitle: String(h.bestSellersTitle ?? "Best Sellers"),
      };
    }
    if (body.footer) {
      const f = body.footer as Record<string, unknown>;
      update.footer = {
        aboutText: String(f.aboutText ?? ""),
        copyrightText: String(f.copyrightText ?? ""),
      };
    }
    if (Array.isArray(body.promoTiles)) {
      update.promoTiles = (body.promoTiles as Record<string, unknown>[])
        .slice(0, 4)
        .map((t, i) => ({
          image: String(t.image ?? "").trim(),
          title: String(t.title ?? ""),
          subtitle: String(t.subtitle ?? ""),
          buttonText: String(t.buttonText ?? "Shop Now"),
          buttonLink: String(t.buttonLink ?? "/shop"),
          bg: String(t.bg ?? "").trim(),
          active: t.active !== false,
          order: i,
        }))
        .filter((t) => t.title);
    }
    const doc = await SiteSettings.findOneAndUpdate(
      { key: "site" },
      { $set: update },
      { upsert: true, new: true }
    ).lean();
    return NextResponse.json({
      ok: true,
      ...publicSettings(doc as unknown as { flashSale?: Record<string, unknown>; heroSlides?: unknown[] }),
    });
  } catch (e) {
    console.error("admin settings save error", e);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
