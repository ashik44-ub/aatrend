"use client";

import { useRef, type ReactNode } from "react";

export default function CarouselRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute -left-2 top-1/3 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg md:flex"
      >
        ‹
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute -right-2 top-1/3 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg md:flex"
      >
        ›
      </button>
    </div>
  );
}
