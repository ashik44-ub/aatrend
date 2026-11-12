"use client";

import { useEffect, useState } from "react";

const input = "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

const EMPTY: Slide = { image: "", title: "", subtitle: "", buttonText: "Shop Now", buttonLink: "/shop" };

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.heroSlides ?? []) as Slide[];
        setSlides(
          list.length > 0
            ? list.map((s) => ({ ...EMPTY, ...s }))
            : [{ ...EMPTY }]
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (i: number, patch: Partial<Slide>) =>
    setSlides((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, dir: number) =>
    setSlides((prev) => {
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
      body: JSON.stringify({ heroSlides: slides }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(res.ok ? "Hero slides saved — the home page slider updates right away." : data.error ?? "Failed to save.");
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Hero Slides</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The home page hero slider — up to 5 slides, auto-slides every 3 seconds. Slides show in the order listed below.
      </p>
      <form onSubmit={save} className="mt-6 space-y-4">
        {slides.map((s, i) => (
          <div key={i} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-bold">Slide {i + 1}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg border px-3 py-1 text-sm font-bold disabled:opacity-40">↑ Up</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="rounded-lg border px-3 py-1 text-sm font-bold disabled:opacity-40">↓ Down</button>
                <button
                  type="button"
                  onClick={() => setSlides((prev) => prev.filter((_, j) => j !== i))}
                  disabled={slides.length <= 1}
                  className="rounded-lg border border-red-200 px-3 py-1 text-sm font-bold text-red-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Image URL</label>
                <input value={s.image} onChange={(e) => set(i, { image: e.target.value })} placeholder="https://images.unsplash.com/…" className={input} />
                {s.image && (
                  <img src={s.image} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Title (big headline)</label>
                <input value={s.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="Discover Products You'll Love" className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Subtitle</label>
                <input value={s.subtitle} onChange={(e) => set(i, { subtitle: e.target.value })} placeholder="Shop the latest trending products…" className={input} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Button text</label>
                <input value={s.buttonText} onChange={(e) => set(i, { buttonText: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Button link</label>
                <input value={s.buttonLink} onChange={(e) => set(i, { buttonLink: e.target.value })} placeholder="/shop" className={input} />
              </div>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => slides.length < 5 && setSlides((prev) => [...prev, { ...EMPTY }])}
            disabled={slides.length >= 5}
            className="rounded-full border px-5 py-2.5 text-sm font-bold disabled:opacity-40"
          >
            + Add Slide (max 5)
          </button>
          <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {saving ? "Saving…" : "Save Hero Slides"}
          </button>
          {msg && <p className={`text-sm ${msg.startsWith("Hero slides saved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
        </div>
      </form>
    </div>
  );
}
