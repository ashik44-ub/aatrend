"use client";

import { useEffect, useState } from "react";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";
const card = "space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm";

interface TrustBadge {
  icon: string;
  title: string;
  sub: string;
}

interface PromoTile {
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bg: string;
  active: boolean;
}

const EMPTY_BADGE: TrustBadge = { icon: "", title: "", sub: "" };
const EMPTY_TILE: PromoTile = { image: "", title: "", subtitle: "", buttonText: "Shop Now", buttonLink: "/shop", bg: "", active: true };

export default function AdminSiteContentPage() {
  const [announcement, setAnnouncement] = useState({ active: false, text: "", link: "/shop" });
  const [badges, setBadges] = useState<TrustBadge[]>([{ ...EMPTY_BADGE }, { ...EMPTY_BADGE }, { ...EMPTY_BADGE }, { ...EMPTY_BADGE }]);
  const [headings, setHeadings] = useState({ categoriesTitle: "Shop by Categories", newArrivalsTitle: "New Arrivals", bestSellersTitle: "Best Sellers" });
  const [footer, setFooter] = useState({ aboutText: "", copyrightText: "" });
  const [tiles, setTiles] = useState<PromoTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.announcementBar) setAnnouncement(d.announcementBar);
        if (Array.isArray(d.trustBadges) && d.trustBadges.length > 0) {
          setBadges([...d.trustBadges, ...Array(4).fill(EMPTY_BADGE)].slice(0, 4).map((b) => ({ ...EMPTY_BADGE, ...b })));
        }
        if (d.headings) setHeadings({ ...headings, ...d.headings });
        if (d.footer) setFooter({ ...footer, ...d.footer });
        if (Array.isArray(d.promoTiles)) setTiles(d.promoTiles.map((t: PromoTile) => ({ ...EMPTY_TILE, ...t })));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBadge = (i: number, patch: Partial<TrustBadge>) =>
    setBadges((prev) => prev.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const setTile = (i: number, patch: Partial<PromoTile>) =>
    setTiles((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const moveTile = (i: number, dir: number) =>
    setTiles((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        announcementBar: announcement,
        trustBadges: badges,
        headings,
        footer,
        promoTiles: tiles,
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Site content saved — the store updates right away." : data.error ?? "Failed to save.");
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Site Content</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every text on the store — the top bar, trust badges, section headings, footer and the two promo tiles next to the hero slider. Change the text here, no code needed.
      </p>

      <form onSubmit={save} className="mt-6 space-y-6">
        {/* Announcement bar */}
        <section className={card}>
          <h2 className="text-lg font-bold">Announcement bar (top of every page)</h2>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
            <input type="checkbox" checked={announcement.active} onChange={(e) => setAnnouncement({ ...announcement, active: e.target.checked })} className="h-5 w-5 accent-orange-600" />
            Show announcement bar
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium">Text</label>
            <input value={announcement.text} onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })} placeholder="Free shipping on selected products" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Link (when clicked)</label>
            <input value={announcement.link} onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })} placeholder="/shop" className={input} />
          </div>
        </section>

        {/* Trust badges */}
        <section className={card}>
          <h2 className="text-lg font-bold">Trust badges (under the hero)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {badges.map((b, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-zinc-100 p-4">
                <p className="text-sm font-bold">Badge {i + 1}</p>
                <input value={b.icon} onChange={(e) => setBadge(i, { icon: e.target.value })} placeholder="Icon (emoji, e.g. 🚚)" className={input} />
                <input value={b.title} onChange={(e) => setBadge(i, { title: e.target.value })} placeholder="Title, e.g. Free Shipping" className={input} />
                <input value={b.sub} onChange={(e) => setBadge(i, { sub: e.target.value })} placeholder="Subtext, e.g. On selected products" className={input} />
              </div>
            ))}
          </div>
        </section>

        {/* Section headings */}
        <section className={card}>
          <h2 className="text-lg font-bold">Section headings (home page)</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Categories heading</label>
            <input value={headings.categoriesTitle} onChange={(e) => setHeadings({ ...headings, categoriesTitle: e.target.value })} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New Arrivals heading</label>
            <input value={headings.newArrivalsTitle} onChange={(e) => setHeadings({ ...headings, newArrivalsTitle: e.target.value })} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Best Sellers heading</label>
            <input value={headings.bestSellersTitle} onChange={(e) => setHeadings({ ...headings, bestSellersTitle: e.target.value })} className={input} />
          </div>
        </section>

        {/* Promo tiles */}
        <section className={card}>
          <h2 className="text-lg font-bold">Hero promo tiles (right of the big slider)</h2>
          <p className="text-sm text-zinc-500">Two tiles show next to the hero slider. Leave the image empty to use a solid colour tile instead.</p>
          {tiles.map((t, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Tile {i + 1}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => moveTile(i, -1)} className="rounded-full border px-3 py-1 text-xs font-bold">↑</button>
                  <button type="button" onClick={() => moveTile(i, 1)} className="rounded-full border px-3 py-1 text-xs font-bold">↓</button>
                  <button type="button" onClick={() => setTiles((prev) => prev.filter((_, j) => j !== i))} className="rounded-full border border-red-200 px-3 py-1 text-xs font-bold text-red-600">Remove</button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Image URL (empty = colour tile)</label>
                <input value={t.image} onChange={(e) => setTile(i, { image: e.target.value })} placeholder="https://images.unsplash.com/..." className={input} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Title (big)</label>
                  <input value={t.title} onChange={(e) => setTile(i, { title: e.target.value })} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Subtitle</label>
                  <input value={t.subtitle} onChange={(e) => setTile(i, { subtitle: e.target.value })} className={input} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Button text</label>
                  <input value={t.buttonText} onChange={(e) => setTile(i, { buttonText: e.target.value })} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Button link</label>
                  <input value={t.buttonLink} onChange={(e) => setTile(i, { buttonLink: e.target.value })} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Tile colour (for colour tiles)</label>
                  <input value={t.bg} onChange={(e) => setTile(i, { bg: e.target.value })} placeholder="#5ec8b8" className={input} />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
                <input type="checkbox" checked={t.active} onChange={(e) => setTile(i, { active: e.target.checked })} className="h-5 w-5 accent-orange-600" />
                Show this tile
              </label>
            </div>
          ))}
          {tiles.length < 4 && (
            <button type="button" onClick={() => setTiles((prev) => [...prev, { ...EMPTY_TILE }])} className="rounded-full border px-4 py-2 text-sm font-bold">
              + Add a promo tile
            </button>
          )}
        </section>

        {/* Footer */}
        <section className={card}>
          <h2 className="text-lg font-bold">Footer</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">About text</label>
            <textarea rows={3} value={footer.aboutText} onChange={(e) => setFooter({ ...footer, aboutText: e.target.value })} placeholder="Shop the latest trending products curated for modern lifestyles." className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Copyright line (bottom of the page)</label>
            <input value={footer.copyrightText} onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })} placeholder="© 2026 aatrend. All rights reserved." className={input} />
          </div>
        </section>

        {msg && <p className={`text-sm ${msg.startsWith("Site content saved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Site Content"}
        </button>
      </form>
    </div>
  );
}
