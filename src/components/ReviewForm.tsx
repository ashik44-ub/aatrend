"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewForm({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session?.user) {
    return (
      <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
        Please <a href="/login" className="font-semibold text-orange-600 underline">sign in</a> to write a review.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, title, comment }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed to save review.");
      return;
    }
    setComment("");
    setTitle("");
    setMsg("Thank you! Your review has been posted.");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <h3 className="font-bold">Write a review</h3>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-lg border px-3 py-2 text-sm">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title (optional)" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500" />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} required placeholder="Share your experience..." rows={3} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500" />
      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <button disabled={busy} className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">
        {busy ? "Posting..." : "Post Review"}
      </button>
    </form>
  );
}
