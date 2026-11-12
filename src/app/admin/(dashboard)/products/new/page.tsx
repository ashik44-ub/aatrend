import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-black">Add Product</h1>
      <div className="mt-4"><ProductForm /></div>
    </div>
  );
}
