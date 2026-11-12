"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/components/HeroSlider";

const FALLBACK: HeroSlide[] = [
  {
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
    title: "Discover Products You'll Love",
    subtitle: "Shop the latest trending products curated for modern lifestyles.",
    buttonText: "Shop Now",
    buttonLink: "/shop",
  },
];

/**
 * Mobile hero slider (Vellora-style peach card) — the same admin hero slides
 * as the desktop HeroSlider, auto-advancing every 3s with touch swipe and
 * tappable dots. Single-slide (or empty) lists render as one static card:
 * no timer, no dots, no crash.
 */
export default function MobileHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const list = slides.length > 0 ? slides : FALLBACK;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (n: number) => setIdx((i) => (i + n + list.length) % list.length),
    [list.length]
  );

  useEffect(() => {
    if (paused || list.length <= 1) return;
    const t = setInterval(() => go(1), 3000);
    return () => clearInterval(t);
  }, [paused, go, list.length]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100 via-[#ffe4d6] to-orange-200 shadow-sm"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }
        setPaused(false);
      }}
    >
      <div className="relative">
        {list.map((s, i) => (
          <div
            key={`${s.image}-${i}`}
            className={`transition-all duration-700 ease-in-out ${
              i === idx
                ? "relative opacity-100 translate-x-0"
                : "pointer-events-none absolute inset-0 translate-x-8 opacity-0"
            }`}
            aria-hidden={i !== idx}
          >
            <div className="relative z-10 flex min-h-[190px] flex-col justify-center p-5 pr-[46%]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-700">
                New Arrivals
              </p>
              <h1 className="mt-1 text-[26px] font-black leading-[1.1] text-zinc-900">
                {s.title}
              </h1>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-zinc-600">
                {s.subtitle}
              </p>
              <div className="mt-3">
                <Link
                  href={s.buttonLink || "/shop"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-[13px] font-bold text-white"
                >
                  {s.buttonText || "Shop Now"} →
                </Link>
              </div>
            </div>
            <img
              src={s.image}
              alt={s.title}
              className="absolute bottom-0 right-0 h-full w-[52%] object-cover object-top [mask-image:linear-gradient(to_left,black_65%,transparent)]"
            />
          </div>
        ))}
      </div>

      {list.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {list.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? "w-5 bg-zinc-900" : "w-1.5 bg-zinc-900/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
