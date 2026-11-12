import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { isAdministrationAllowedPath, type Role } from "@/lib/roles";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";
import { Order } from "@/models/Order";
import NavBadge from "@/components/NavBadge";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

const NAV: { label: string; href: string; roles: Role[]; badge?: "messages" | "orders" }[] = [
  { label: "📊 Dashboard", href: "/admin", roles: ["admin"] },
  { label: "🛍️ Products", href: "/admin/products", roles: ["admin", "administration"] },
  { label: "📦 Orders", href: "/admin/orders", roles: ["admin", "administration"], badge: "orders" },
  { label: "🚚 Shipping", href: "/admin/shipping", roles: ["admin", "administration"] },
  { label: "🎁 Free Shipping", href: "/admin/free-shipping", roles: ["admin", "administration"] },
  { label: "🔔 Purchase Popups", href: "/admin/purchase-popups", roles: ["admin", "administration"] },
  { label: "👥 Customers", href: "/admin/customers", roles: ["admin"] },
  { label: "👤 Users & Roles", href: "/admin/users", roles: ["admin"] },
  { label: "🗂️ Categories", href: "/admin/categories", roles: ["admin"] },
  { label: "⚡ Flash Sale", href: "/admin/flash-sale", roles: ["admin"] },
  { label: "☀️ Summer Sale", href: "/admin/summer-sale", roles: ["admin"] },
  { label: "🖼️ Hero Slides", href: "/admin/hero-slides", roles: ["admin"] },
  { label: "🎟️ Coupons", href: "/admin/coupons", roles: ["admin"] },
  { label: "✏️ Site Content", href: "/admin/site-content", roles: ["admin"] },
  { label: "📄 Pages", href: "/admin/pages", roles: ["admin"] },
  { label: "✉️ Messages", href: "/admin/messages", roles: ["admin"], badge: "messages" },
  { label: "🌐 View Store", href: "/", roles: ["admin", "administration"] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/admin/login");
  if (ctx.role === "customer") redirect("/");
  // Second layer (middleware is the first): re-check the section against the
  // fresh DB role, using the path the middleware attached to the request.
  if (ctx.role === "administration") {
    const path = (await headers()).get("x-admin-path") ?? "";
    if (path && !isAdministrationAllowedPath(path)) redirect("/admin/products");
  }
  const nav = NAV.filter((n) => n.roles.includes(ctx.role));
  const session = ctx.session;
  // Sidebar badge counts, fresh on every navigation. `viewed: { $ne: true }`
  // counts orders created before the `viewed` field existed as new.
  let badgeCounts = { unreadMessages: 0, newOrders: 0 };
  try {
    await connectDB();
    const [newOrders, unreadMessages] = await Promise.all([
      Order.countDocuments({ viewed: { $ne: true } }),
      ctx.role === "admin" ? ContactMessage.countDocuments({ read: false }) : Promise.resolve(0),
    ]);
    badgeCounts = { unreadMessages, newOrders };
  } catch {
    badgeCounts = { unreadMessages: 0, newOrders: 0 };
  }
  const badgeFor = (n: (typeof NAV)[number]) =>
    n.badge === "messages" ? badgeCounts.unreadMessages : n.badge === "orders" ? badgeCounts.newOrders : 0;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Mobile admin nav — the desktop sidebar is hidden on phones, so
          every admin page is reachable from here too. */}
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 md:hidden">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:border-orange-600 hover:text-orange-700"
          >
            {n.label}
            {n.badge && <NavBadge kind={n.badge} initial={badgeFor(n)} />}
          </Link>
        ))}
      </nav>
      <div className="flex gap-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-24 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <p className="px-2 text-lg font-black">
            aa<span className="text-orange-600">trend</span> <span className="text-sm font-medium text-zinc-400">Admin</span>
          </p>
          <nav className="mt-4 space-y-1">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-orange-50 hover:text-orange-700">
                {n.label}
                {n.badge && <NavBadge kind={n.badge} initial={badgeFor(n)} />}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t pt-4">
            <p className="px-3 text-xs text-zinc-500">{session?.user?.email}</p>
            <p className="px-3 text-xs font-semibold capitalize text-orange-600">{ctx.role}</p>
            <div className="mt-2 px-1"><SignOutButton /></div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
