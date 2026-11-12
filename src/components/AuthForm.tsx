"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setBusy(false);
        return;
      }
    }
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(params.get("callbackUrl") || "/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-black">
        {mode === "login" ? "Welcome Back" : "Create Account"}
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        {mode === "login" ? "Sign in to your aatrend account." : "Join aatrend and start shopping."}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        {mode === "register" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500" />
          {mode === "login" && (
            <p className="mt-1 text-right text-sm">
              <Link href="/forgot-password" className="font-semibold text-orange-600">Forgot password?</Link>
            </p>
          )}
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
        <p className="text-center text-sm text-zinc-500">
          {mode === "login" ? (
            <>No account yet? <Link href="/register" className="font-semibold text-orange-600">Register</Link></>
          ) : (
            <>Already have an account? <Link href="/login" className="font-semibold text-orange-600">Sign in</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
