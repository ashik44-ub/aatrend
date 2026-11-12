"use client";

import Link from "next/link";

export type PageItem = number | "…";

/**
 * Compact page list: at most 3 numbered buttons in the middle window,
 * plus the first/last page with an ellipsis when the window does not
 * reach them. When there are 3 or fewer pages, all numbers are shown.
 * Examples (page 5 of 12): [1, "…", 4, 5, 6, "…", 12]
 *          (page 1 of 5):  [1, 2, 3, "…", 5]
 *          (page 5 of 5):  [1, "…", 3, 4, 5]
 */
export function pageItems(page: number, pages: number): PageItem[] {
  if (pages <= 3) return Array.from({ length: pages }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(page - 1, pages - 2));
  const items: PageItem[] = [];
  if (start > 1) items.push(1);
  if (start > 2) items.push("…");
  items.push(start, start + 1, start + 2);
  if (start + 2 < pages - 1) items.push("…");
  if (start + 2 < pages) items.push(pages);
  return items;
}

/**
 * Compact pagination: Previous / numbered window / Next.
 * `href(n)` builds the URL for page n (keeps the current filters).
 */
export default function Pagination({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (n: number) => string;
}) {
  if (pages <= 1) return null;
  const num = "rounded-full px-4 py-2 text-sm font-semibold";
  const arrow = "rounded-full px-4 py-2 text-sm font-bold border bg-white hover:border-orange-600";
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} aria-label="Previous page" className={arrow}>
          ‹ Prev
        </Link>
      ) : (
        <span aria-hidden className={`${arrow} cursor-not-allowed opacity-40`}>
          ‹ Prev
        </span>
      )}
      {pageItems(page, pages).map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className="px-1 text-sm text-zinc-400">
            …
          </span>
        ) : (
          <Link
            key={it}
            href={href(it)}
            aria-current={it === page ? "page" : undefined}
            className={`${num} ${it === page ? "bg-orange-600 text-white" : "border bg-white"}`}
          >
            {it}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link href={href(page + 1)} aria-label="Next page" className={arrow}>
          Next ›
        </Link>
      ) : (
        <span aria-hidden className={`${arrow} cursor-not-allowed opacity-40`}>
          Next ›
        </span>
      )}
    </div>
  );
}
