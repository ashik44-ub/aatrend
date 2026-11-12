"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useCart, useWishlist } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

interface Suggestion {
  name: string;
  slug: string;
  price: number;
  images: string[];
}

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Best Sellers", href: "/shop?sort=popular" },
  { label: "Categories", href: "/#categories" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const { data: session } = useSession();
  const { count, openCart } = useCart();
  const { slugs } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setShowSug(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSug(false);
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-zinc-900 text-white text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-2">
          <span>🚚 Free Shipping on Selected Products</span>
          <span className="hidden sm:inline">🔥 Summer Sale Up To 70% Off</span>
          <span className="hidden md:inline">⚡ Limited Time Flash Deals</span>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            aa<span className="text-orange-600">trend</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-5 text-sm font-medium lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={pathname === n.href ? "text-orange-600" : "text-zinc-700 hover:text-orange-600"}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="relative ml-auto hidden w-64 md:block" ref={searchRef}>
            <form onSubmit={submitSearch}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSug(true)}
                placeholder="Search products..."
                className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-orange-500"
              />
            </form>
            {showSug && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-11 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/product/${s.slug}`}
                    onClick={() => setShowSug(false)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50"
                  >
                    <img src={s.images?.[0] ?? ""} alt={s.name} className="h-10 w-10 rounded object-cover" />
                    <span className="flex-1 truncate text-sm">{s.name}</span>
                    <span className="text-sm font-bold text-orange-600">{formatPrice(s.price)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto hidden items-center gap-1 md:flex">
            <button
              onClick={() => router.push("/wishlist")}
              className="relative rounded-full p-2 hover:bg-zinc-100"
              aria-label="Wishlist"
            >
              <span className="text-xl">♡</span>
              {slugs.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                  {slugs.length}
                </span>
              )}
            </button>
            <button
              onClick={openCart}
              className="relative rounded-full p-2 hover:bg-zinc-100"
              aria-label="Cart"
            >
              <span className="text-xl">🛒</span>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700"
                >
                  {(session.user.name ?? session.user.email ?? "U").charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                    <div className="border-b px-4 py-3 text-sm">
                      <p className="font-semibold">{session.user.name}</p>
                      <p className="truncate text-xs text-zinc-500">{session.user.email}</p>
                    </div>
                    <Link href="/account" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-zinc-50">My Account</Link>
                    <Link href="/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-zinc-50">My Orders</Link>
                    <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-zinc-50">Wishlist</Link>
                    {((session.user as { role?: string }).role === "admin" ||
                      (session.user as { role?: string }).role === "administration") && (
                      <Link
                        href={(session.user as { role?: string }).role === "administration" ? "/admin/products" : "/admin"}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-zinc-50"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="ml-1 rounded-full p-2 text-xl hover:bg-zinc-100" aria-label="Account">👤</Link>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1 md:ml-0 md:hidden">
            {/* Mobile top bar: bell (order updates) — cart/profile live in the bottom nav. */}
            <Link href="/orders" className="relative rounded-full p-2 hover:bg-zinc-100" aria-label="Order updates">
              <span className="text-xl">🔔</span>
            </Link>
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-2 hover:bg-zinc-100"
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>
        {/* Mobile search row (Vellora-style): search + filter, below the top bar. */}
        <form onSubmit={submitSearch} className="flex items-center gap-2 px-4 pb-3 md:hidden">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-zinc-400">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for outfits, brands, styles..."
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={() => router.push("/shop")}
            aria-label="Filter products"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-lg text-zinc-600"
          >
            ⫯
          </button>
        </form>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t py-2 lg:hidden">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} onClick={() => setMenuOpen(false)} className="rounded px-2 py-2 text-sm font-medium hover:bg-zinc-50">
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
