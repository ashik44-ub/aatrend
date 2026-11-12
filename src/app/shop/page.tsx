import Link from "next/link";
import { connectDB } from "@/lib/db";
import { toPlain } from "@/lib/utils";
import { CATEGORIES, FASHION_SUBCATEGORIES, Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { SiteSettings } from "@/models/SiteSettings";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import ProductRow from "@/components/ProductRow";
import ShopFilters, { type Facets } from "@/components/ShopFilters";
import ShopToolbar, { type ShopView } from "@/components/ShopToolbar";

export const dynamic = "force-dynamic";

const ALL_CATEGORIES = [...CATEGORIES, ...FASHION_SUBCATEGORIES];

function toCard(p: Record<string, unknown>, freeShipping = false): CardProduct {
  return {
    slug: p.slug as string,
    name: p.name as string,
    price: p.price as number,
    comparePrice: p.comparePrice as number | undefined,
    images: (p.images as string[]) ?? [],
    rating: (p.rating as number) ?? 0,
    reviewCount: (p.reviewCount as number) ?? 0,
    stock: (p.stock as number) ?? 0,
    category: (p.subcategory as string) || (p.category as string),
    isNewArrival: p.isNewArrival as boolean,
    bestSeller: p.bestSeller as boolean,
    status: (p.status as CardProduct["status"]) ?? "in_stock",
    badge: (p.badge as CardProduct["badge"]) ?? null,
    freeShipping,
    // Colors are subdocuments with an auto ObjectId `_id` — strip it so only
    // plain { name, hex } crosses the server → client boundary.
    colors: ((p.colors as { name: string; hex: string }[]) ?? []).map((c) => ({ name: c.name, hex: c.hex })),
    dealEndsAt: p.dealEndsAt ? new Date(p.dealEndsAt as string).toISOString() : null,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const getAll = (k: string) => {
    const v = sp[k];
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
    if (typeof v === "string") return [v];
    return [];
  };
  const q = get("q");
  const cats = getAll("cat");
  const brands = getAll("brand");
  const colors = getAll("color");
  const sizes = getAll("size");
  const sort = get("sort") || "latest";
  const view = (["grid-2", "grid-3", "grid-4", "list"].includes(get("view")) ? get("view") : "grid-3") as ShopView;
  const min = Number(get("min") || 0);
  const max = Number(get("max") || 0);
  const rating = Number(get("rating") || 0);
  const inStock = get("inStock") === "1";
  const onSale = get("onSale") === "1";
  const sale = get("sale");
  const page = Math.max(1, Number(get("page") || 1));
  const limit = 12;

  await connectDB();

  // ---- Free-shipping campaign (badges on the grid / list) ----
  // Live = switched on and not expired. "All products" covers every slug;
  // otherwise only the picked slugs. A null set means "all".
  const fsDoc = await SiteSettings.findOne({ key: "site" }).lean();
  const fsCampaign = (fsDoc?.freeShipping ?? {}) as {
    active?: boolean;
    endsAt?: Date;
    allProducts?: boolean;
    productIds?: string[];
  };
  const freeShipLive =
    !!fsCampaign.active &&
    (!fsCampaign.endsAt || new Date(fsCampaign.endsAt).getTime() > Date.now());
  const freeShipSet: Set<string> | null = !freeShipLive
    ? new Set<string>()
    : fsCampaign.allProducts
      ? null
      : new Set((fsCampaign.productIds ?? []).filter(Boolean));
  const isFreeShip = (slug: string) =>
    freeShipLive && (freeShipSet === null || freeShipSet.has(slug));

  // ---- Filters ----
  const filter: Record<string, unknown> = {};
  if (cats.length > 0) {
    filter.$or = [{ category: { $in: cats } }, { subcategory: { $in: cats } }];
  }
  if (q) filter.$text = { $search: q };
  if (brands.length > 0) filter.brand = { $in: brands };
  if (colors.length > 0) {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? (filter.$and as unknown[]) : []),
      {
        $or: [
          { "colors.name": { $in: colors } },
          { variants: { $elemMatch: { type: "color", value: { $in: colors } } } },
        ],
      },
    ];
  }
  if (sizes.length > 0) {
    filter.$and = [
      ...(Array.isArray(filter.$and) ? (filter.$and as unknown[]) : []),
      {
        $or: [
          { sizes: { $in: sizes } },
          { variants: { $elemMatch: { type: "size", value: { $in: sizes } } } },
        ],
      },
    ];
  }
  if (min > 0 || max > 0) {
    filter.price = {};
    if (min > 0) (filter.price as Record<string, number>).$gte = min;
    if (max > 0) (filter.price as Record<string, number>).$lte = max;
  }
  if (rating > 0) filter.rating = { $gte: rating };
  if (inStock) {
    filter.stock = { $gt: 0 };
    filter.status = { $ne: "sold_out" };
  }
  if (onSale) filter.onSale = true;

  // ---- Summer Sale listing (?sale=summer) ----
  // Only applies while the campaign is active and not expired. Hand-picked
  // products win; otherwise the ticked categories are used. If the campaign
  // is off/expired (or has no selection), the param is ignored.
  let summerSaleInfo: { title: string; discountText: string } | null = null;
  if (sale === "summer") {
    const ssDoc = await SiteSettings.findOne({ key: "site" }).lean();
    const ss = ssDoc?.summerSale as
      | {
          active?: boolean;
          title?: string;
          discountText?: string;
          endsAt?: Date;
          productIds?: string[];
          categories?: string[];
        }
      | undefined;
    const summerActive =
      !!ss?.active && !!ss?.endsAt && new Date(ss.endsAt).getTime() > Date.now();
    if (summerActive) {
      const ids = (ss?.productIds ?? []).filter(Boolean);
      const cats = (ss?.categories ?? []).filter(Boolean);
      if (ids.length > 0) {
        filter.slug = { $in: ids };
      } else if (cats.length > 0) {
        const summerOr = [{ category: { $in: cats } }, { subcategory: { $in: cats } }];
        if (filter.$or) {
          // A sidebar category filter is also active — combine, don't overwrite.
          filter.$and = [
            ...(Array.isArray(filter.$and) ? (filter.$and as unknown[]) : []),
            { $or: filter.$or },
            { $or: summerOr },
          ];
          delete filter.$or;
        } else {
          filter.$or = summerOr;
        }
      }
      if (ids.length > 0 || cats.length > 0) {
        summerSaleInfo = {
          title: ss?.title ?? "Summer Sale",
          discountText: ss?.discountText ?? "Up To 50% Off",
        };
      }
    }
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    latest: { createdAt: -1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    rating: { rating: -1 },
    popular: { sold: -1 },
  };

  // ---- Facets (sidebar counts) ----
  const [catAgg, subAgg, brandAgg, colorAgg, priceAgg, ratingAgg] = await Promise.all([
    Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Product.aggregate([
      { $match: { subcategory: { $ne: null } } },
      { $group: { _id: "$subcategory", count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: { brand: { $ne: null } } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Product.aggregate([
      { $unwind: "$colors" },
      { $group: { _id: "$colors.name" } },
      { $sort: { _id: 1 } },
    ]),
    Product.aggregate([
      { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } },
    ]),
    Promise.all(
      [5, 4, 3, 2, 1].map(async (s) => ({
        stars: s,
        count: await Product.countDocuments({ rating: { $gte: s } }),
      }))
    ),
  ]);
  const catCounts = new Map<string, number>();
  // A name like "Accessories" can be both a main category and a fashion
  // sub-category — SUM the counts instead of overwriting, so the facet
  // matches what the category filter (category OR subcategory) returns.
  const addCounts = (rows: { _id: string; count: number }[]) => {
    for (const r of rows) catCounts.set(r._id, (catCounts.get(r._id) ?? 0) + r.count);
  };
  addCounts(catAgg as { _id: string; count: number }[]);
  addCounts(subAgg as { _id: string; count: number }[]);
  const facets: Facets = {
    // ALL_CATEGORIES lists "Accessories" twice (main category + fashion
    // sub-category) — dedupe by name or ShopFilters renders two children
    // with the same key.
    categories: [...new Set(ALL_CATEGORIES)]
      .filter((c) => catCounts.has(c))
      .map((c) => ({ name: c, count: catCounts.get(c) ?? 0 })),
    brands: (brandAgg as { _id: string; count: number }[]).map((r) => ({ name: r._id, count: r.count })),
    colors: (colorAgg as { _id: string }[]).map((r) => r._id).filter(Boolean),
    priceMin: Math.floor((priceAgg[0] as { minPrice?: number } | undefined)?.minPrice ?? 0),
    priceMax: Math.ceil((priceAgg[0] as { maxPrice?: number } | undefined)?.maxPrice ?? 100),
    ratingCounts: ratingAgg,
  };

  // ---- Category tiles (fashion sub-categories with image + count) ----
  // Admin-managed categories win; fall back to product-derived tiles.
  const tileAgg = await Product.aggregate([
    { $match: { subcategory: { $in: [...FASHION_SUBCATEGORIES] } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$subcategory",
        count: { $sum: 1 },
        image: { $first: { $arrayElemAt: ["$images", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const dbSubcats = await Category.find({ group: "subcategory", active: true })
    .sort({ order: 1, name: 1 })
    .lean();
  const tileMap = new Map(
    (tileAgg as { _id: string; count: number; image?: string }[]).map((t) => [t._id, t])
  );
  const tiles = (
    dbSubcats.length > 0
      ? dbSubcats.map((c) => ({
          _id: c.name as string,
          count: tileMap.get(c.name as string)?.count ?? 0,
          image: (c.image as string) || tileMap.get(c.name as string)?.image,
        }))
      : (tileAgg as { _id: string; count: number; image?: string }[])
  ).filter((t) => t._id);

  // ---- Products ----
  const total = await Product.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const products = toPlain(
    await Product.find(filter)
      .sort(sortMap[sort] ?? sortMap.latest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
  );
  const cards = products.map((p) =>
    toCard(p as unknown as Record<string, unknown>, isFreeShip(p.slug as string))
  );

  const qs = (over: Record<string, string | string[]>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | string[]> = {
      q, cat: cats, brand: brands, color: colors, size: sizes,
      sort, view, min: min ? String(min) : "", max: max ? String(max) : "",
      rating: rating ? String(rating) : "", inStock: inStock ? "1" : "", onSale: onSale ? "1" : "",
      sale: summerSaleInfo ? "summer" : "",
      page: String(page),
    };
    for (const [k, v] of Object.entries({ ...base, ...over })) {
      if (Array.isArray(v)) v.forEach((x) => x && p.append(k, x));
      else if (v) p.set(k, v);
    }
    const s = p.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  const gridCols =
    view === "grid-2"
      ? "grid-cols-1 sm:grid-cols-2"
      : view === "grid-4"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">Shop {q ? `— “${q}”` : ""}</h1>
      {summerSaleInfo && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-teal-500 p-5 text-white shadow-sm">
          <p className="text-sm font-black uppercase tracking-widest">☀️ {summerSaleInfo.title}</p>
          <p className="mt-1 text-xl font-black">{summerSaleInfo.discountText}</p>
          <Link href="/shop" className="mt-2 inline-block text-xs font-bold text-white/90 underline">
            ← View all products
          </Link>
        </div>
      )}

      {tiles.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {tiles.map((t) => (
            <Link
              key={t._id}
              href={`/shop?cat=${encodeURIComponent(t._id)}`}
              className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg ${cats.includes(t._id) ? "border-orange-500 ring-2 ring-orange-200" : "border-zinc-100"}`}
            >
              <div className="aspect-square overflow-hidden bg-zinc-100">
                {t.image ? (
                  <img src={t.image} alt={t._id} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-300">{t._id.charAt(0)}</div>
                )}
              </div>
              <div className="p-3 text-center">
                <p className="text-sm font-bold text-zinc-900">{t._id}</p>
                <p className="text-xs text-zinc-500">{t.count} Products</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <ShopFilters facets={facets} />
        </aside>
        <div>
          <ShopToolbar view={view} sort={sort} total={total} from={from} to={to} />
          {cards.length === 0 ? (
            <p className="py-20 text-center text-zinc-500">No products match your filters.</p>
          ) : view === "list" ? (
            <div className="mt-4 space-y-4">
              {cards.map((p) => (
                <ProductRow key={p.slug} p={p} />
              ))}
            </div>
          ) : (
            <div className={`mt-4 grid gap-5 ${gridCols}`}>
              {cards.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <Link href={qs({ page: String(page - 1) })} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold">‹</Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={qs({ page: String(n) })}
                  className={`rounded-md px-4 py-2 text-sm font-semibold ${n === page ? "bg-zinc-800 text-white" : "border border-zinc-200 bg-white"}`}
                >
                  {n}
                </Link>
              ))}
              {page < pages && (
                <Link href={qs({ page: String(page + 1) })} className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold">›</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
