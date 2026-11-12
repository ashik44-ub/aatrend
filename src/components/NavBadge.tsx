"use client";

import { useEffect, useState } from "react";

/**
 * Live count pill for one admin sidebar section. Starts from the
 * server-rendered count, then refreshes from /api/admin/notifications
 * every 30s so a new message or order appears without a reload.
 * Renders nothing when the count is 0.
 */
export default function NavBadge({
  kind,
  initial,
}: {
  kind: "messages" | "orders";
  initial: number;
}) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const load = () => {
      fetch("/api/admin/notifications")
        .then((r) => r.json())
        .then((d) => {
          setCount(kind === "messages" ? (d.unreadMessages ?? 0) : (d.newOrders ?? 0));
        })
        .catch(() => {});
    };
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [kind]);

  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
      {count}
    </span>
  );
}
