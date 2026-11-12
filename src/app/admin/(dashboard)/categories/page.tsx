"use client";

import { useEffect, useState } from "react";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  tagline: string;
  description: string;
  group: "category" | "subcategory";
  order: number;
  active: boolean;
}

interface CategoryForm {
  name: string;
  slug: string;
  image: string;
  tagline: string;
  description: string;
  group: "category" | "subcategory";
  order: number;
  active: boolean;
}

const EMPTY: CategoryForm = {
  name: "",
  slug: "",
  image: "",
  tagline: "",
  description: "",
  group: "category",
  order: 0,
  active: true,
};

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCats(d.categories ?? []));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const startEdit = (c: Category) => {
    setEditing(c._id);
    setForm({
      name: c.name,
      slug: c.slug,
      image: c.image,
      tagline: c.tagline,
      description: c.description,
      group: c.group,
      order: c.order,
      active: c.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const url = editing ? `/api/admin/categories/${editing}` : "/api/admin/categories";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to save.");
      return;
    }
    setMsg(editing ? "Category updated — the store shows it right away." : "Category added — it shows on the store right away.");
    cancel();
    load();
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products keep their category name.`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  };

  const toggleActive = async (c: Category) => {
    await fetch(`/api/admin/categories/${c._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Categories</h1>
      <p className="mt-1 text-sm text-zinc-500">
        The category tiles on the home page and the shop page come from here. Change a name, image or text and the store updates right away.
      </p>

      <form onSubmit={save} className="mt-6 space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">{editing ? "Edit category" : "Add a category"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fashion" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug (URL, optional — auto from name)</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="fashion" className={input} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Image URL</label>
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://images.unsplash.com/..." className={input} />
          {form.image && (
            <img src={form.image} alt="" className="mt-2 h-20 w-20 rounded-lg object-cover" />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tagline (short text under the name)</label>
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Trending styles" className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Group</label>
            <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value as "category" | "subcategory" })} className={input}>
              <option value="category">Main category (home page row)</option>
              <option value="subcategory">Fashion sub-category (shop page tiles)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this category is about" className={input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Order (lower shows first)</label>
            <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className={input} />
          </div>
          <label className="flex cursor-pointer items-end gap-3 pb-2 text-sm font-bold">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-5 w-5 accent-orange-600" />
            Show on the store
          </label>
        </div>
        {msg && <p className={`text-sm ${msg.startsWith("Failed") || msg.includes("already exists") ? "text-red-500" : "text-green-600"}`}>{msg}</p>}
        <div className="flex gap-3">
          <button disabled={saving} className="rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
            {saving ? "Saving…" : editing ? "Save Changes" : "Add Category"}
          </button>
          {editing && (
            <button type="button" onClick={cancel} className="rounded-full border px-6 py-3 text-sm font-bold">Cancel</button>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {cats.map((c) => (
          <div key={c._id} className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            {c.image ? (
              <img src={c.image} alt={c.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xl font-black text-zinc-400">{c.name.charAt(0)}</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {c.name}
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                  {c.group === "subcategory" ? "Fashion sub-category" : "Main category"}
                </span>
                {!c.active && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Hidden</span>}
              </p>
              <p className="truncate text-sm text-zinc-500">{c.tagline || c.description || c.slug}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => toggleActive(c)} className="rounded-full border px-3 py-1.5 text-xs font-bold">
                {c.active ? "Hide" : "Show"}
              </button>
              <button onClick={() => startEdit(c)} className="rounded-full border px-3 py-1.5 text-xs font-bold">Edit</button>
              <button onClick={() => remove(c._id, c.name)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
            </div>
          </div>
        ))}
        {cats.length === 0 && <p className="py-8 text-center text-zinc-500">No categories yet — add one above.</p>}
      </div>
    </div>
  );
}
