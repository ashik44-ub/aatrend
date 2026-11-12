"use client";

import { useState } from "react";

const input = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setState(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setState({ ok: true, text: "Thank you! Your message was received — we will reply within one business day." });
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setState({ ok: false, text: data.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setState({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
      <input
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Your name"
        className={input}
      />
      <input
        required
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="Your email"
        className={input}
      />
      <input
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        placeholder="Subject (optional)"
        className={input}
      />
      <textarea
        required
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="How can we help?"
        className={input}
      />
      {state && <p className={`text-sm ${state.ok ? "text-green-600" : "text-red-500"}`}>{state.text}</p>}
      <button disabled={busy} className="w-full rounded-full bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
        {busy ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
