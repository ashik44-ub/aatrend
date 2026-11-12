import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { toPlain } from "@/lib/utils";
import { Product } from "@/models/Product";
import { SiteSettings } from "@/models/SiteSettings";
import ProductCard, { type CardProduct } from "@/components/ProductCard";
import ProductDetailClient, { type DetailProduct } from "@/components/ProductDetailClient";

export const dynamic = "force-dynamic";

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

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const product = toPlain(await Product.findOne({ slug }).lean());
  if (!product) notFound();
  const p = product as unknown as Record<string, unknown>;

  // Free-shipping badge: live campaign + (all products or this slug picked).
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
  const isFreeShip = (s: string) =>
    freeShipLive &&
    (fsCampaign.allProducts === true || (fsCampaign.productIds ?? []).includes(s));

  const detail: DetailProduct = {
    slug: p.slug as string,
    name: p.name as string,
    price: p.price as number,
    comparePrice: p.comparePrice as number | undefined,
    priceTo: p.priceTo as number | undefined,
    images: (p.images as string[]) ?? [],
    stock: (p.stock as number) ?? 0,
    status: (p.status as DetailProduct["status"]) ?? "in_stock",
    badge: (p.badge as DetailProduct["badge"]) ?? null,
    dealEndsAt: p.dealEndsAt ? new Date(p.dealEndsAt as string).toISOString() : null,
    sizes: (p.sizes as string[]) ?? (p.variants as { type: string; value: string }[] ?? []).filter((v) => v.type === "size").map((v) => v.value),
    // Colors / specifications are subdocuments with an auto ObjectId `_id` —
    // strip it so only plain values cross the server → client boundary.
    colors: ((p.colors as { name: string; hex: string }[]) ?? []).map((c) => ({ name: c.name, hex: c.hex })),
    rating: (p.rating as number) ?? 0,
    reviewCount: (p.reviewCount as number) ?? 0,
    sold: (p.sold as number) ?? 0,
    category: p.category as string,
    subcategory: p.subcategory as string | undefined,
    brand: p.brand as string | undefined,
    freeShipping: isFreeShip(slug),
    shortDescription: p.shortDescription as string | undefined,
    description: (p.description as string) ?? "",
    specifications: ((p.specifications as { label: string; value: string }[]) ?? []).map((s) => ({ label: s.label, value: s.value })),
    reviews: ((p.reviews as { userName: string; rating: number; title?: string; comment: string; createdAt: string | Date }[]) ?? []).map((r) => ({
      userName: r.userName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
  };
  // Legacy products store colours only in variants — surface them as swatches.
  if (detail.colors.length === 0) {
    const variantColors = (p.variants as { type: string; value: string }[] ?? [])
      .filter((v) => v.type === "color")
      .map((v) => v.value);
    detail.colors = variantColors.map((name) => ({ name, hex: "" }));
  }

  // "You may also like" — same sub-category first, then same category.
  const subcat = (p.subcategory as string | undefined) ?? "";
  const brand = (p.brand as string | undefined) ?? "";
  const category = p.category as string;
  const liked = toPlain(
    (await Product.find({
      slug: { $ne: slug },
      $or: [{ subcategory: subcat }, { category }],
    })
      .sort({ sold: -1 })
      .limit(8)
      .lean()) as unknown as Record<string, unknown>[]
  );
  // "Related products" — same brand or category, excluding the liked ones.
  const likedSlugs = new Set(liked.map((x) => x.slug as string));
  const related = toPlain(
    (await Product.find({
      slug: { $ne: slug, $nin: [...likedSlugs] },
      $or: [{ brand }, { category }],
    })
      .sort({ rating: -1 })
      .limit(8)
      .lean()) as unknown as Record<string, unknown>[]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        <Link href="/shop" className="hover:underline">Shop</Link> /{" "}
        <span className="text-zinc-800">{product.name}</span>
      </p>
      <div className="mt-6">
        <ProductDetailClient p={detail} />
      </div>

      {liked.length > 0 && (
        <section className="pt-12">
          <h2 className="text-2xl font-black">You may also like...</h2>
          <div className="mt-6 flex gap-5 overflow-x-auto pb-2">
            {liked.map((x) => (
              <div key={String(x._id)} className="w-64 shrink-0 sm:w-72">
                <ProductCard p={toCard(x, isFreeShip(x.slug as string))} />
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="pt-12">
          <h2 className="text-2xl font-black">Related products</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((x) => (
              <ProductCard key={String(x._id)} p={toCard(x, isFreeShip(x.slug as string))} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
