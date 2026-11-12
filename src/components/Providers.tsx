"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { CartProvider, CompareProvider, WishlistProvider } from "@/lib/store";
import CartDrawer from "@/components/CartDrawer";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            {children}
            <CartDrawer />
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
