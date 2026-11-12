import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import AdminLoginForm from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === "admin") {
    redirect("/admin");
  }
  if (role === "administration") {
    redirect("/admin/products");
  }
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-center text-2xl font-black">
        Admin <span className="text-orange-600">Login</span>
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500">Sign in to manage aatrend.</p>
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
