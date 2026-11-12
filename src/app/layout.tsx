import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import PurchasePopup from "@/components/PurchasePopup";
import Providers from "@/components/Providers";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";
import { DEFAULT_FOOTER } from "@/lib/siteContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aatrend — Discover Products You'll Love",
  description:
    "Shop the latest trending products curated for modern lifestyles. Fashion, electronics, beauty, fitness, home decor and accessories.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let announcement: { active: boolean; text: string; link: string } | null = null;
  let footerText = DEFAULT_FOOTER;
  try {
    await connectDB();
    const settings = await SiteSettings.findOne({ key: "site" }).lean();
    if (settings?.announcementBar) {
      announcement = settings.announcementBar as { active: boolean; text: string; link: string };
    }
    if (settings?.footer) {
      footerText = {
        aboutText: (settings.footer as { aboutText?: string }).aboutText || DEFAULT_FOOTER.aboutText,
        copyrightText: (settings.footer as { copyrightText?: string }).copyrightText || "",
      };
    }
  } catch {
    // Store renders with defaults when the DB is unreachable.
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-white text-zinc-900 antialiased`}>
        <Providers>
          {announcement?.active && announcement.text ? (
            <Link href={announcement.link || "/shop"} className="block bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-orange-600 print:hidden">
              {announcement.text}
            </Link>
          ) : null}
          <Header />
          <main className="min-h-[60vh] pb-20 md:pb-0">{children}</main>
          <footer className="mt-16 border-t border-zinc-100 bg-zinc-900 text-zinc-300">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
              <div>
                <p className="text-2xl font-black text-white">
                  aa<span className="text-orange-500">trend</span>
                </p>
                <p className="mt-3 text-sm text-zinc-400">{footerText.aboutText}</p>
              </div>
              <div>
                <h3 className="font-bold text-white">Shop</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/shop" className="hover:text-orange-400">All Products</Link></li>
                  <li><Link href="/shop?sort=newest" className="hover:text-orange-400">New Arrivals</Link></li>
                  <li><Link href="/shop?sort=popular" className="hover:text-orange-400">Best Sellers</Link></li>
                  <li><Link href="/#categories" className="hover:text-orange-400">Categories</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white">Customer Care</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/contact" className="hover:text-orange-400">Contact Us</Link></li>
                  <li><Link href="/about" className="hover:text-orange-400">About Us</Link></li>
                  <li><Link href="/terms" className="hover:text-orange-400">Terms &amp; Conditions</Link></li>
                  <li><Link href="/blog" className="hover:text-orange-400">Blog</Link></li>
                  <li><Link href="/orders" className="hover:text-orange-400">Track My Order</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white">My Account</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-orange-400">Sign In</Link></li>
                  <li><Link href="/register" className="hover:text-orange-400">Create Account</Link></li>
                  <li><Link href="/wishlist" className="hover:text-orange-400">Wishlist</Link></li>
                  <li><Link href="/cart" className="hover:text-orange-400">Cart</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-zinc-800 py-4 text-center text-xs text-zinc-500">
              {footerText.copyrightText || `© ${new Date().getFullYear()} aatrend. All rights reserved.`} Demo store — card checkout is a demo, no real payment is processed.
            </div>
          </footer>
          <MobileBottomNav />
          <PurchasePopup />
        </Providers>
      </body>
    </html>
  );
}
