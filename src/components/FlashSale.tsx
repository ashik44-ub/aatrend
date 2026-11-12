"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function FlashSaleCountdown({ endsAt }: { endsAt?: string | null }) {
  const endMs = endsAt ? new Date(endsAt).getTime() : Date.now() + 2 * 86400000;
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, endMs - Date.now());
      setLeft({
        d: Math.floor(ms / 86400000),
        h: Math.floor(ms / 3600000) % 24,
        m: Math.floor(ms / 60000) % 60,
        s: Math.floor(ms / 1000) % 60,
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endMs]);
  return (
    <div className="flex gap-2">
      {[
        { v: pad(left.d), l: "Days" },
        { v: pad(left.h), l: "Hours" },
        { v: pad(left.m), l: "Mins" },
        { v: pad(left.s), l: "Secs" },
      ].map((x) => (
        <div key={x.l} className="rounded-lg bg-white/20 px-3 py-2 text-center backdrop-blur">
          <div className="text-xl font-black leading-none">{x.v}</div>
          <div className="text-[10px] uppercase tracking-wide opacity-80">{x.l}</div>
        </div>
      ))}
    </div>
  );
}
