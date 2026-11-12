"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

type Role = "customer" | "administration" | "admin";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  joined: string | null;
  orders: number;
  spent: number;
}

interface ResetRequest {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  expiresAt: string;
}

const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer",
  administration: "Administration",
  admin: "Admin",
};

function randomTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [msg, setMsg] = useState("");

  // Password reset requests (no email is sent — the admin hands the link
  // or a temporary password to the user, e.g. over WhatsApp).
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [reqMsg, setReqMsg] = useState("");
  const [linkFor, setLinkFor] = useState<{ id: string; link: string } | null>(null);
  const [tempPwFor, setTempPwFor] = useState<{ id: string; password: string } | null>(null);
  const [tempPwInput, setTempPwInput] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState("");

  const load = () =>
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setRows(d.users ?? []));

  const loadRequests = () =>
    fetch("/api/admin/reset-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []));

  useEffect(() => {
    load().finally(() => setLoading(false));
    loadRequests();
  }, []);

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (non-secure context) — the text is also
      // shown on screen, so the admin can copy it manually.
    }
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const generateLink = async (reqId: string) => {
    setReqMsg("");
    setLinkFor(null);
    const res = await fetch("/api/admin/reset-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: reqId, action: "generate-link" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setReqMsg(data.error ?? "Failed to generate reset link.");
      return;
    }
    setLinkFor({ id: reqId, link: data.resetLink });
  };

  const setTempPassword = async (req: ResetRequest) => {
    const password = (tempPwInput[req.id] ?? "").trim();
    if (password.length < 6) {
      setReqMsg("Temporary password must be at least 6 characters.");
      return;
    }
    setReqMsg("");
    const res = await fetch("/api/admin/reset-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: req.id, action: "set-password", password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setReqMsg(data.error ?? "Failed to set temporary password.");
      return;
    }
    // Show the temporary password once so the admin can pass it on.
    setTempPwFor({ id: req.id, password });
    setTempPwInput((p) => ({ ...p, [req.id]: "" }));
    loadRequests();
  };

  const dismissRequest = async (reqId: string) => {
    await fetch("/api/admin/reset-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: reqId, action: "dismiss" }),
    });
    loadRequests();
  };

  const formatReqDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const changeRole = async (u: AdminUser, role: Role) => {
    if (role === u.role) return;
    setBusyId(u.id);
    setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, role }),
    });
    const data = await res.json();
    setBusyId("");
    if (!res.ok) {
      setMsg(data.error ?? "Failed to update role.");
      return;
    }
    setRows((rs) => rs.map((r) => (r.id === u.id ? { ...r, role } : r)));
    setMsg(`${u.name} is now ${ROLE_LABEL[role]}.`);
  };

  const formatJoined = (joined: string | null) => {
    if (!joined) return "—";
    const d = new Date(joined);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  return (
    <div>
      <h1 className="text-2xl font-black">Users &amp; Roles ({rows.length})</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Change any user&apos;s role. <b>Admin</b> has full access, <b>Administration</b> can only
        manage products, orders and shipping, and <b>Customer</b> cannot open the admin panel at
        all. The main admin account (signed in with the admin email) always keeps full admin
        access and is not listed here.
      </p>
      {msg && (
        <p className={`mt-4 rounded-xl p-3 text-sm ${msg.includes("now") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg}
        </p>
      )}

      {/* Password reset requests — no email is sent, the admin hands the
          link or a temporary password to the user (e.g. over WhatsApp). */}
      <div className="mt-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Password Reset Requests ({requests.length})</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Users who asked for a password reset on the login page. Copy the reset link and send it
          to them, or set a temporary password directly. Links work for 1 hour and only once.
        </p>
        {reqMsg && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{reqMsg}</p>}
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No pending reset requests.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl border border-zinc-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-zinc-400">{r.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Requested {formatReqDate(r.createdAt)} · link expires {formatReqDate(r.expiresAt)}
                    </p>
                  </div>
                  <button onClick={() => dismissRequest(r.id)} className="text-xs font-semibold text-zinc-400 hover:text-red-600">
                    Dismiss
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => generateLink(r.id)} className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700">
                    Copy reset link
                  </button>
                  {linkFor?.id === r.id && (
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <input readOnly value={linkFor.link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none" />
                      <button onClick={() => copyText(linkFor.link, `link-${r.id}`)} className="shrink-0 rounded-full bg-orange-600 px-3 py-1.5 text-xs font-bold text-white">
                        {copied === `link-${r.id}` ? "Copied ✓" : "Copy"}
                      </button>
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                  <input
                    type="text"
                    value={tempPwInput[r.id] ?? ""}
                    onChange={(e) => setTempPwInput((p) => ({ ...p, [r.id]: e.target.value }))}
                    placeholder="Temporary password (min 6 chars)"
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => setTempPwInput((p) => ({ ...p, [r.id]: randomTempPassword() }))}
                    className="rounded-full border px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                  >
                    Generate
                  </button>
                  <button onClick={() => setTempPassword(r)} className="rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700">
                    Set password
                  </button>
                </div>
                {tempPwFor?.id === r.id && (
                  <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    Temporary password set for {r.name}:{" "}
                    <button onClick={() => copyText(tempPwFor.password, `pw-${r.id}`)} className="font-mono font-bold underline">
                      {tempPwFor.password}
                    </button>{" "}
                    {copied === `pw-${r.id}` ? "— copied ✓" : "(click to copy)"} Send it to the user
                    and ask them to change it after signing in.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {loading ? (
        <p className="py-10 text-center text-zinc-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">No registered users yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-zinc-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">{formatJoined(u.joined)}</td>
                  <td className="px-4 py-3">{u.orders}</td>
                  <td className="px-4 py-3 font-bold">{formatPrice(u.spent)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                      className="rounded-lg border px-2 py-1.5 text-sm font-semibold outline-none focus:border-orange-500 disabled:opacity-50"
                    >
                      <option value="customer">Customer</option>
                      <option value="administration">Administration</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
