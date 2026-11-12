"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/store";
import ProductCard, { type CardProduct } from "@/components/ProductCard";

export default function WishlistPage() {
  const { slugs } = useWishlist();
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    Promise.all(
      slugs.map((s) => fetch(`/api/products/${s}`).then((r) => r.json()).then((d) => d.product).catch(() => null))
    ).then((list) => {
      setProducts(list.filter(Boolean));
      setLoading(false);
    });
  }, [slugs]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black">My Wishlist ♥</h1>
      <p className="mt-1 text-sm text-zinc-500">{products.length} saved products</p>
      {loading ? (
        <p className="py-16 text-center text-zinc-500">Loading...</p>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-500">Your wishlist is empty. Tap the ♥ on any product to save it here.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white">Browse Products →</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
