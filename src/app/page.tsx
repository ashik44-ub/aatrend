import Link from "next/link";
import { connectDB } from "@/lib/db";
import { CATEGORIES, Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { SiteSettings } from "@/models/SiteSettings";
import { DEFAULT_TRUST_BADGES, DEFAULT_PROMO_TILES, DEFAULT_HEADINGS } from "@/lib/siteContent";
import ProductCard from "@/components/ProductCard";
import CarouselRow from "@/components/CarouselRow";
import HeroSlider, { type HeroSlide } from "@/components/HeroSlider";
import MobileHeroSlider from "@/components/MobileHeroSlider";
import FlashSaleCountdown from "@/components/FlashSale";

export const dynamic = "force-dynamic";

const CATEGORY_IMAGES: Record<string, string> = {
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop",
  Electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop",
  Beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop",
  Fitness: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
  "Home Decor": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop",
  Accessories: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
};

function slugifyName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default async function Home() {
  await connectDB();
  const [newest, bestSellers, counts, settings, dbCats] = await Promise.all([
    Product.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    Product.find({ bestSeller: true }).sort({ sold: -1 }).limit(8).lean(),
    Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    SiteSettings.findOne({ key: "site" }).lean(),
    Category.find({ group: "category", active: true }).sort({ order: 1, name: 1 }).lean(),
  ]);
  const countMap = new Map(counts.map((c: { _id: string; count: number }) => [c._id, c.count]));
  const heroSlides: HeroSlide[] = ((settings?.heroSlides ?? []) as (HeroSlide & { order?: number })[])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => ({
      image: s.image,
      title: s.title,
      subtitle: s.subtitle,
      buttonText: s.buttonText,
      buttonLink: s.buttonLink,
    }));
  const fs = settings?.flashSale as
    | { active?: boolean; title?: string; subtitle?: string; discountText?: string; endsAt?: Date; buttonText?: string; buttonLink?: string }
    | undefined;
  const flashActive =
    !!fs?.active && !!fs?.endsAt && new Date(fs.endsAt).getTime() > Date.now();

  const ss = settings?.summerSale as
    | {
        active?: boolean;
        title?: string;
        subtitle?: string;
        discountText?: string;
        endsAt?: Date;
        buttonText?: string;
        buttonLink?: string;
        bannerImage?: string;
        themeColor?: string;
      }
    | undefined;
  const summerActive =
    !!ss?.active && !!ss?.endsAt && new Date(ss.endsAt).getTime() > Date.now();

  // Free-shipping badges on the home cards.
  const fr = settings?.freeShipping as
    | { active?: boolean; endsAt?: Date; allProducts?: boolean; productIds?: string[] }
    | undefined;
  const freeShipLive =
    !!fr?.active && (!fr?.endsAt || new Date(fr.endsAt).getTime() > Date.now());
  const isFreeShip = (s: string) =>
    freeShipLive &&
    (fr?.allProducts === true || (fr?.productIds ?? []).includes(s));

  const trustBadges =
    (settings?.trustBadges as { icon: string; title: string; sub: string }[] | undefined)?.filter((t) => t.title) ??
    [];
  const badges = trustBadges.length > 0 ? trustBadges : DEFAULT_TRUST_BADGES;
  const headings = {
    ...DEFAULT_HEADINGS,
    ...((settings?.headings as Record<string, string> | undefined) ?? {}),
  };
  const promoTiles = (
    ((settings?.promoTiles as { image: string; title: string; subtitle: string; buttonText: string; buttonLink: string; bg: string; active: boolean; order: number }[] | undefined) ?? [])
      .filter((t) => t.active && t.title)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const tiles = promoTiles.length > 0 ? promoTiles : DEFAULT_PROMO_TILES;

  // Categories come from the admin-managed Category collection; fall back
  // to the built-in list (with product counts) when the admin has none yet.
  const categories =
    dbCats.length > 0
      ? dbCats.map((c) => ({
          name: c.name as string,
          slug: (c.slug as string) || slugifyName(c.name as string),
          image: (c.image as string) || CATEGORY_IMAGES[c.name as string] || "",
          tagline: (c.tagline as string) || "",
          count: countMap.get(c.name as string) ?? 0,
        }))
      : CATEGORIES.map((c) => ({
          name: c,
          slug: slugifyName(c),
          image: CATEGORY_IMAGES[c] || "",
          tagline: "",
          count: countMap.get(c) ?? 0,
        }));

  return (
    <div>
      {/* Mobile hero slider (Vellora-style): peach gradient banner that
          auto-advances, swipes and shows dots — same admin hero slides as
          the desktop slider, title/subtitle/button from SiteSettings. */}
      <section className="px-4 pt-4 md:hidden">
        <MobileHeroSlider slides={heroSlides} />
      </section>

      {/* Mobile categories strip: small image tiles, horizontally scrollable. */}
      <section className="px-4 pt-6 md:hidden">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-black">Categories</h2>
          <Link href="/shop" className="text-xs font-semibold text-orange-600">See All ›</Link>
        </div>
        <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${encodeURIComponent(c.name)}`} className="w-[72px] shrink-0 text-center">
              <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
                {c.image ? (
                  <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-300">{c.name.charAt(0)}</div>
                )}
              </div>
              <p className="mt-1.5 truncate text-xs font-semibold text-zinc-800">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Mobile featured products: 1-column grid of real newest products —
          one full-width card per row so the Add to Cart / View buttons
          have room and never wrap. */}
      <section className="px-4 pt-6 md:hidden">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-black">Featured Products</h2>
          <Link href="/shop?sort=newest" className="text-xs font-semibold text-orange-600">See All ›</Link>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4">
          {newest.slice(0, 6).map((p) => (
            <ProductCard
              key={String(p._id)}
              p={{
                slug: p.slug,
                name: p.name,
                price: p.price,
                comparePrice: p.comparePrice,
                images: p.images,
                rating: p.rating,
                reviewCount: p.reviewCount,
                stock: p.stock,
                category: p.category,
                isNewArrival: p.isNewArrival,
                bestSeller: p.bestSeller,
                freeShipping: isFreeShip(p.slug),
              }}
            />
          ))}
        </div>
      </section>

      {/* Hero slider + promo tiles (screenshot layout) */}
      <section className="mx-auto hidden max-w-7xl px-4 pt-8 md:block">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HeroSlider slides={heroSlides} />
          </div>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-1">
            {tiles.slice(0, 2).map((t) =>
              t.image ? (
                <Link
                  key={t.title}
                  href={t.buttonLink || "/shop"}
                  className="group relative block overflow-hidden rounded-3xl shadow-sm"
                >
                  <img src={t.image} alt={t.title} className="h-44 w-full object-cover transition duration-300 group-hover:scale-105 lg:h-full lg:min-h-[220px]" />
                  <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow">
                    <p className="text-sm font-black uppercase tracking-wide text-zinc-900">{t.title}</p>
                    <p className="text-sm font-bold uppercase tracking-wide text-teal-500">{t.subtitle}</p>
                  </div>
                </Link>
              ) : (
                <Link
                  key={t.title}
                  href={t.buttonLink || "/shop"}
                  className="flex flex-col items-center justify-center rounded-3xl p-8 text-center text-white shadow-sm"
                  style={{ backgroundColor: t.bg || "#5ec8b8" }}
                >
                  <p className="text-2xl font-black uppercase leading-tight tracking-wide md:text-3xl">{t.title}</p>
                  <p className="mt-2 text-sm font-bold uppercase tracking-widest">{t.subtitle}</p>
                  {t.buttonText && (
                    <span className="mt-4 rounded-full bg-white px-5 py-2 text-xs font-bold text-zinc-900">{t.buttonText}</span>
                  )}
                </Link>
              )
            )}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {badges.map((t) => (
            <div key={t.title} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="text-sm font-bold">{t.title}</p>
                <p className="text-xs text-zinc-500">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto hidden max-w-7xl px-4 pt-12 md:block">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">{headings.categoriesTitle}</h2>
          <Link href="/shop" className="text-sm font-semibold text-orange-600 hover:underline">View All Categories →</Link>
        </div>
        <div className="mt-6">
          <CarouselRow>
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${encodeURIComponent(c.name)}`} className="group w-[200px] shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-lg">
                <div className="aspect-square overflow-hidden bg-zinc-100">
                  {c.image ? (
                    <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-black text-zinc-300">{c.name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c.tagline || `${c.count} products`}</p>
                  </div>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </CarouselRow>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto hidden max-w-7xl px-4 pt-12 md:block">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">{headings.newArrivalsTitle}</h2>
          <Link href="/shop?sort=newest" className="text-sm font-semibold text-orange-600 hover:underline">View All New Arrivals →</Link>
        </div>
        <div className="mt-6">
          <CarouselRow>
            {newest.map((p) => (
              <div key={String(p._id)} className="w-[280px] shrink-0">
                <ProductCard
                  p={{
                    slug: p.slug,
                    name: p.name,
                    price: p.price,
                    comparePrice: p.comparePrice,
                    images: p.images,
                    rating: p.rating,
                    reviewCount: p.reviewCount,
                    stock: p.stock,
                    category: p.category,
                    isNewArrival: p.isNewArrival,
                    bestSeller: p.bestSeller,
                    freeShipping: isFreeShip(p.slug),
                  }}
                />
              </div>
            ))}
          </CarouselRow>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">{headings.bestSellersTitle}</h2>
          <Link href="/shop?sort=popular" className="text-sm font-semibold text-orange-600 hover:underline">View All Best Sellers →</Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bestSellers.map((p) => (
            <ProductCard
              key={String(p._id)}
              p={{
                slug: p.slug,
                name: p.name,
                price: p.price,
                comparePrice: p.comparePrice,
                images: p.images,
                rating: p.rating,
                reviewCount: p.reviewCount,
                stock: p.stock,
                category: p.category,
                isNewArrival: p.isNewArrival,
                bestSeller: p.bestSeller,
                freeShipping: isFreeShip(p.slug),
              }}
            />
          ))}
        </div>
      </section>

      {/* Flash sale */}
      {flashActive && (
        <section className="mx-auto max-w-7xl px-4 pt-12">
          <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">{fs?.title ?? "Flash Sale"}</p>
            <h3 className="mt-2 text-3xl font-black">{fs?.discountText ?? "Up To 70% Off"}</h3>
            {fs?.subtitle && <p className="mt-2 text-sm text-white/85">{fs.subtitle}</p>}
            <div className="mt-4">
              <FlashSaleCountdown endsAt={fs?.endsAt ? new Date(fs.endsAt).toISOString() : undefined} />
            </div>
            <Link href={fs?.buttonLink ?? "/shop?onSale=1"} className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-orange-600">
              {fs?.buttonText ?? "Shop Sale Now"}
            </Link>
          </div>
        </section>
      )}

      {/* Summer sale — sunny yellow to teal, distinct from the flash sale */}
      {summerActive && (
        <section className="mx-auto max-w-7xl px-4 pt-12">
          <div
            className="overflow-hidden rounded-3xl text-white shadow-sm"
            style={{ background: `linear-gradient(100deg, ${ss?.themeColor ?? "#f59e0b"} 0%, #fbbf24 45%, #0d9488 100%)` }}
          >
            <div className="grid gap-6 p-8 md:grid-cols-[1fr_320px] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-90">☀️ {ss?.title ?? "Summer Sale"}</p>
                <h3 className="mt-2 text-3xl font-black md:text-4xl">{ss?.discountText ?? "Up To 50% Off"}</h3>
                {ss?.subtitle && <p className="mt-2 text-sm text-white/90">{ss.subtitle}</p>}
                <div className="mt-4">
                  <FlashSaleCountdown endsAt={ss?.endsAt ? new Date(ss.endsAt).toISOString() : undefined} />
                </div>
                <Link href={ss?.buttonLink ?? "/shop?sale=summer"} className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-900">
                  {ss?.buttonText ?? "Shop Summer Sale"}
                </Link>
              </div>
              {ss?.bannerImage && (
                <img
                  src={ss.bannerImage}
                  alt={ss?.title ?? "Summer Sale"}
                  className="hidden h-56 w-full rounded-2xl object-cover shadow-lg md:block"
                />
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
