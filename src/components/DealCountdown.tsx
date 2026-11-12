"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

/** Live deal countdown — days / hrs / min / sec boxes, like the Hema shop. */
export default function DealCountdown({ endsAt }: { endsAt: string }) {
  // `now` starts as null so the server render and the first client render
  // are identical: a Date.now() initializer would render different seconds
  // on each side and break hydration. The countdown appears right after
  // mount and then ticks every second.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  const cells: [string, string][] = [
    [String(days), "DAYS"],
    [pad(hrs), "HRS"],
    [pad(min), "MIN"],
    [pad(sec), "SEC"],
  ];
  return (
    <div className="absolute bottom-2 left-2 flex flex-col gap-1" aria-label="Deal ends in">
      {cells.map(([v, label]) => (
        <div key={label} className="w-9 rounded bg-white/95 px-1 py-0.5 text-center shadow">
          <div className="text-[11px] font-extrabold leading-tight text-zinc-900">{v}</div>
          <div className="text-[8px] font-semibold uppercase leading-tight text-zinc-500">{label}</div>
        </div>
      ))}
    </div>
  );
}
