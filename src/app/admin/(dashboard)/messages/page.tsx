"use client";

import { useEffect, useState } from "react";

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setUnread(d.unread ?? 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setRead = async (id: string, read: boolean) => {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, read } : m)));
    setUnread((u) => Math.max(0, u + (read ? -1 : 1)));
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete the message from "${name}"?`)) return;
    await fetch("/api/admin/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.filter((m) => m._id !== id));
  };

  if (loading) return <p className="py-10 text-center text-zinc-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-black">Messages {unread > 0 && <span className="ml-2 rounded-full bg-orange-600 px-3 py-1 text-sm text-white">{unread} unread</span>}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Every contact-form message lands here — this is where you read and reply to them.
      </p>
      {messages.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-zinc-100 bg-white p-8 text-center text-zinc-500 shadow-sm">
          No messages yet. Messages from the Contact page will appear here.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {messages.map((m) => {
            const open = openId === m._id;
            return (
              <div key={m._id} className={`rounded-2xl border bg-white p-5 shadow-sm ${m.read ? "border-zinc-100" : "border-orange-200"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : m._id);
                    if (!open && !m.read) setRead(m._id, true);
                  }}
                  className="flex w-full flex-wrap items-center gap-2 text-left"
                >
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.read ? "bg-zinc-100 text-zinc-500" : "bg-orange-100 text-orange-700"}`}>
                    {m.read ? "Read" : "New"}
                  </span>
                  <span className="font-bold">{m.name}</span>
                  <span className="text-sm text-zinc-500">{m.email}</span>
                  <span className="flex-1 truncate text-sm font-semibold">{m.subject || "(no subject)"}</span>
                  <span className="text-xs text-zinc-400">{new Date(m.createdAt).toLocaleString()}</span>
                </button>
                {open && (
                  <div className="mt-3 border-t pt-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{m.message}</p>
                    <div className="mt-3 flex gap-2">
                      <a href={`mailto:${m.email}`} className="rounded-full bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600">
                        Reply by Email
                      </a>
                      <button onClick={() => setRead(m._id, !m.read)} className="rounded-full border px-4 py-2 text-xs font-bold hover:border-orange-600">
                        Mark as {m.read ? "unread" : "read"}
                      </button>
                      <button onClick={() => remove(m._id, m.name)} className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
