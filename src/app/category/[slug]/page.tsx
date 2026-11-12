import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { CATEGORIES, Product } from "@/models/Product";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  if (!(CATEGORIES as readonly string[]).includes(category)) notFound();
  await connectDB();
  const products = await Product.find({ category }).sort({ createdAt: -1 }).limit(24).lean();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-sm text-zinc-500">
        <Link href="/" className="hover:underline">Home</Link> / <span className="text-zinc-800">{category}</span>
      </p>
      <h1 className="mt-2 text-3xl font-black">{category}</h1>
      <p className="mt-1 text-sm text-zinc-500">{products.length} products</p>
      {products.length === 0 ? (
        <p className="py-20 text-center text-zinc-500">No products in this category yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
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
              }}
            />
          ))}
        </div>
      )}
      <Link href="/shop" className="mt-8 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">
        View All Products →
      </Link>
    </div>
  );
}
