"use client";

import { useEffect, useState } from "react";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

interface AdminPage {
  slug: string;
  title: string;
  content: string;
  saved: boolean;
}

const TABS = [
  { slug: "about", label: "About" },
  { slug: "contact", label: "Contact" },
  { slug: "terms", label: "Terms & Conditions" },
];

export default function AdminPagesPage() {
  const [pages, setPages] = useState<AdminPage[]>([]);
  const [tab, setTab] = useState("about");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.pages ?? []) as AdminPage[];
        setPages(list);
        const first = list.find((p) => p.slug === "about") ?? list[0];
        if (first) {
          setTitle(first.title);
          setContent(first.content);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selectTab = (slug: string) => {
    setTab(slug);
    const p = pages.find((x) => x.slug === slug);
    if (p) {
      setTitle(p.title);
      setContent(p.content);
    }
    setMsg("");
  };

  const savePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: tab, title, content }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMsg("Page saved — it shows on the public page right away.");
      setPages((prev) => prev.map((p) => (p.slug === tab ? { ...p, title, content, saved: true } : p)));
    } else {
      setMsg(data.error ?? "Failed to save.");
    }
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Pages</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Edit the About, Contact and Terms &amp; Conditions pages. Blank lines become new paragraphs on the public page.
      </p>

      <div className="mt-6 max-w-3xl rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => selectTab(t.slug)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === t.slug ? "bg-orange-600 text-white" : "border bg-white hover:border-orange-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={savePage} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Page title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Page text (one blank line = new paragraph)</label>
            <textarea rows={14} value={content} onChange={(e) => setContent(e.target.value)} className={input} />
          </div>
          {msg && <p className={`text-sm ${msg.startsWith("Page saved") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
          <div className="flex items-center gap-3">
            <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save Page"}
            </button>
            <a href={`/${tab}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-orange-600 hover:underline">
              View public page →
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
