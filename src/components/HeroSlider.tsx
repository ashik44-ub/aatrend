"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

const FALLBACK: HeroSlide[] = [
  {
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
    title: "Discover Products You'll Love",
    subtitle: "Shop the latest trending products curated for modern lifestyles.",
    buttonText: "Shop Now",
    buttonLink: "/shop",
  },
];

/** Hero slider — auto-advances every 3s with a smooth crossfade + slide. */
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const list = slides.length > 0 ? slides : FALLBACK;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((n: number) => setIdx((i) => (i + n + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (paused || list.length <= 1) return;
    const t = setInterval(() => go(1), 3000);
    return () => clearInterval(t);
  }, [paused, go, list.length]);

  if (list.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-white to-orange-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="relative">
        {list.map((s, i) => (
          <div
            key={`${s.image}-${i}`}
            className={`transition-all duration-700 ease-in-out ${
              i === idx ? "relative opacity-100 translate-x-0" : "pointer-events-none absolute inset-0 translate-x-8 opacity-0"
            }`}
            aria-hidden={i !== idx}
          >
            <div className="grid gap-6 p-8 md:grid-cols-2 md:p-12">
              <div className="flex flex-col justify-center">
                <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Trending Now</p>
                <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">{s.title}</h1>
                <p className="mt-4 max-w-md text-zinc-600">{s.subtitle}</p>
                <div className="mt-6 flex gap-3">
                  <Link href={s.buttonLink || "/shop"} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700">
                    {s.buttonText || "Shop Now"} →
                  </Link>
                  <Link href="/shop?sort=newest" className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold hover:border-orange-600">
                    Explore Collection
                  </Link>
                </div>
                <p className="mt-6 text-sm text-zinc-500">⭐⭐⭐⭐⭐ Loved by 50,000+ customers worldwide</p>
              </div>
              <div className="relative">
                <Link href={s.buttonLink || "/shop"} className="block overflow-hidden rounded-2xl shadow-xl">
                  <img src={s.image} alt={s.title} className="h-80 w-full object-cover md:h-96" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {list.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold shadow-lg hover:bg-white"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-bold shadow-lg hover:bg-white"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === idx ? "w-8 bg-orange-600" : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
