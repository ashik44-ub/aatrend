"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/store";

/**
 * Mobile-only bottom navigation bar (Vellora-style app nav).
 * Fixed to the bottom of the screen below the `md` breakpoint; hidden on
 * desktop and on admin pages (the admin has its own mobile nav).
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { count } = useCart();

  if (pathname?.startsWith("/admin")) return null;

  const profileHref = session?.user ? "/account" : "/login";
  const items = [
    { label: "Home", href: "/", icon: "⌂", active: pathname === "/" },
    { label: "Search", href: "/shop", icon: "⌕", active: pathname === "/shop" || pathname?.startsWith("/category") },
    {
      label: "Cart",
      href: "/cart",
      icon: "🛒",
      active: pathname === "/cart" || pathname === "/checkout",
      badge: count,
    },
    { label: "Profile", href: profileHref, icon: "👤", active: pathname === "/account" || pathname === "/login" || pathname === "/register" || pathname === "/orders" },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              item.active ? "text-orange-600" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <span className="relative text-xl leading-none">
              {item.icon}
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
