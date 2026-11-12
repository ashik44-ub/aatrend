import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const p = await Product.findById(id).lean();
  if (!p) notFound();
  return (
    <div>
      <h1 className="text-2xl font-black">Edit Product</h1>
      <div className="mt-4">
        <ProductForm
          isEdit
          initial={{
            _id: String(p._id),
            name: p.name,
            description: p.description,
            shortDescription: p.shortDescription,
            price: p.price,
            comparePrice: p.comparePrice,
            priceTo: p.priceTo,
            category: p.category,
            subcategory: p.subcategory,
            brand: p.brand,
            images: p.images,
            stock: p.stock,
            sizes: (p.sizes ?? (p.variants ?? []).filter((v) => v.type === "size").map((v) => v.value)).join(", "),
            colors: (p.colors ?? []).length > 0
              ? (p.colors as { name: string; hex: string }[]).map((c) => `${c.name}:${c.hex}`).join(", ")
              : (p.variants ?? []).filter((v) => v.type === "color").map((v) => v.value).join(", "),
            status: p.status ?? "in_stock",
            badge: p.badge ?? "",
            dealEndsAt: p.dealEndsAt ? new Date(p.dealEndsAt).toISOString() : "",
            featured: p.featured,
            bestSeller: p.bestSeller,
            isNewArrival: p.isNewArrival,
            onSale: p.onSale,
            specifications: (p.specifications ?? []).map((s) => `${s.label}: ${s.value}`).join("\n"),
          }}
        />
      </div>
    </div>
  );
}
