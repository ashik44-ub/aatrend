"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  /** Brief "Added to cart" confirmation text, or null. Auto-clears. */
  toast: string | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (slug: string, variant: string | undefined, qty: number) => void;
  removeItem: (slug: string, variant?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(load<CartItem[]>("aatrend-cart", []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("aatrend-cart", JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      toast,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem: (item, qty = 1) => {
        setItems((prev) => {
          const idx = prev.findIndex(
            (p) => p.slug === item.slug && (p.variant ?? "") === (item.variant ?? "")
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              quantity: Math.min(next[idx].quantity + qty, next[idx].stock || 99),
            };
            return next;
          }
          return [...prev, { ...item, quantity: qty }];
        });
        // Stay on the page: adding only shows a small toast, it never opens
        // the cart drawer and never navigates anywhere.
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast(`✓ ${item.name} added to cart`);
        toastTimer.current = setTimeout(() => setToast(null), 2500);
      },
      updateQty: (slug, variant, qty) => {
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => !(p.slug === slug && (p.variant ?? "") === (variant ?? "")))
            : prev.map((p) =>
                p.slug === slug && (p.variant ?? "") === (variant ?? "")
                  ? { ...p, quantity: Math.min(qty, p.stock || 99) }
                  : p
              )
        );
      },
      removeItem: (slug, variant) =>
        setItems((prev) =>
          prev.filter((p) => !(p.slug === slug && (p.variant ?? "") === (variant ?? "")))
        ),
      clear: () => setItems([]),
    };
  }, [items, isOpen, toast]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-xl md:bottom-6">
          {toast}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

interface WishlistContextValue {
  slugs: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(load<string[]>("aatrend-wishlist", []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("aatrend-wishlist", JSON.stringify(slugs));
  }, [slugs, ready]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      slugs,
      toggle: (slug) =>
        setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
      has: (slug) => slugs.includes(slug),
    }),
    [slugs]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}

interface CompareContextValue {
  slugs: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlugs(load<string[]>("aatrend-compare", []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("aatrend-compare", JSON.stringify(slugs));
  }, [slugs, ready]);

  const value = useMemo<CompareContextValue>(
    () => ({
      slugs,
      toggle: (slug) =>
        setSlugs((prev) =>
          prev.includes(slug)
            ? prev.filter((s) => s !== slug)
            : prev.length >= 4
              ? prev
              : [...prev, slug]
        ),
      has: (slug) => slugs.includes(slug),
      clear: () => setSlugs([]),
    }),
    [slugs]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
