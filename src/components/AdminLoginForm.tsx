"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/admin" });
    setBusy(false);
    if (res?.error) {
      setError("Invalid admin email or password.");
      return;
    }
    // Full-page navigation: sends the fresh session cookie to the server.
    window.location.href = res?.url ?? "/admin";
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {params.get("error") && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">Please sign in to access the admin panel.</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@aatrend.com" className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="w-full rounded-full bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
        {busy ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
