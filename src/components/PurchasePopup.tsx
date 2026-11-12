"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface PopupOrder {
  firstName: string;
  area: string;
  productName: string;
  productImage: string;
  orderedAt: string | null;
}

interface PopupFeed {
  enabled: boolean;
  intervalMinutes: number;
  orders: PopupOrder[];
}

/** First popup appears this long after the page loads. */
const FIRST_SHOW_DELAY_MS = 15000;
/** How long one popup stays on screen before sliding away. */
const SHOW_FOR_MS = 8000;
/** When the tab comes back into view, the next popup follows shortly. */
const RETURN_DELAY_MS = 15000;

function clampInterval(v: unknown): number {
  const n = Math.round(Number(v) || 5);
  return Math.min(60, Math.max(1, n));
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Recent-purchase popup (social proof) — REAL orders only.
 *
 * Fixed bottom-right on desktop; on mobile it sits above the bottom nav
 * (`bottom-20`) so it never covers it. One real recent order at a time:
 * buyer first name + area, product thumbnail + name, and the real time
 * since the order. First appears ~15s after page load, then every
 * `intervalMinutes` (admin-managed, default 5). Each showing lasts ~8s.
 * The feed is refetched every cycle and a random order is picked, never
 * the same one twice in a row. The timer pauses while the tab is hidden.
 * Never renders on admin pages, and never touches the Add to Cart toast
 * (that one is bottom-center; this one is bottom-right).
 */
export default function PurchasePopup() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [current, setCurrent] = useState<PopupOrder | null>(null);
  const [visible, setVisible] = useState(false);
  const configRef = useRef({ enabled: true, intervalMinutes: 5 });
  const ordersRef = useRef<PopupOrder[]>([]);
  const lastIndexRef = useRef(-1);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const scheduleNextRef = useRef<(delayMs: number) => void>(() => {});

  const clearTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  }, []);

  const fetchFeed = useCallback(async (): Promise<PopupFeed | null> => {
    try {
      const res = await fetch("/api/purchase-popup", { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as PopupFeed;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (isAdmin) return undefined;

    const scheduleNext = (delayMs: number) => {
      showTimer.current = setTimeout(async () => {
        if (!mountedRef.current || document.hidden) return;
        const data = await fetchFeed();
        if (!mountedRef.current) return;
        if (data) {
          configRef.current = {
            enabled: !!data.enabled,
            intervalMinutes: clampInterval(data.intervalMinutes),
          };
          ordersRef.current = Array.isArray(data.orders) ? data.orders : [];
        }
        const orders = ordersRef.current;
        if (!configRef.current.enabled || orders.length === 0) {
          // Nothing to show yet — check again at the next interval, so a
          // new order or an admin settings change picks the popup up.
          scheduleNext(configRef.current.intervalMinutes * 60000);
          return;
        }
        let idx = Math.floor(Math.random() * orders.length);
        if (orders.length > 1) {
          while (idx === lastIndexRef.current) {
            idx = Math.floor(Math.random() * orders.length);
          }
        }
        lastIndexRef.current = idx;
        setCurrent(orders[idx]);
        setVisible(true);
        hideTimer.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setVisible(false);
          scheduleNext(configRef.current.intervalMinutes * 60000);
        }, SHOW_FOR_MS);
      }, delayMs);
    };
    scheduleNextRef.current = scheduleNext;

    const onVisibility = () => {
      if (document.hidden) {
        clearTimers();
        setVisible(false);
      } else {
        clearTimers();
        scheduleNext(RETURN_DELAY_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    scheduleNext(FIRST_SHOW_DELAY_MS);

    return () => {
      mountedRef.current = false;
      clearTimers();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAdmin, clearTimers, fetchFeed]);

  const close = () => {
    clearTimers();
    setVisible(false);
    // The cycle keeps going — the next popup comes at the normal interval.
    scheduleNextRef.current(configRef.current.intervalMinutes * 60000);
  };

  if (isAdmin) return null;

  return (
    <div
      data-purchase-popup
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 right-4 z-50 md:bottom-4"
    >
      {visible && current && (
        <div className="purchase-popup-in pointer-events-auto flex w-[calc(100vw-2rem)] max-w-sm items-start gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-xl">
          {current.productImage ? (
            <img
              src={current.productImage}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
              🛍️
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Recent purchase
            </p>
            <p className="mt-0.5 text-sm font-bold leading-snug text-zinc-900">
              {current.firstName} from {current.area} just purchased
            </p>
            <p className="line-clamp-1 text-sm text-zinc-600">{current.productName}</p>
            {current.orderedAt && (
              <p className="mt-0.5 text-xs text-zinc-400">{timeAgo(current.orderedAt)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Dismiss"
            className="shrink-0 rounded-full px-2 py-1 text-lg leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
