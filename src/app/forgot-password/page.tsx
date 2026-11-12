"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-black">Forgot Password</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        Enter the email you signed up with and we&apos;ll arrange a password reset for you.
      </p>
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        {done ? (
          <div className="text-center">
            <p className="text-lg font-bold text-green-700">Reset request received ✓</p>
            <p className="mt-2 text-sm text-zinc-600">
              The admin will send you a reset link shortly. The link works for 1 hour and can
              only be used once.
            </p>
            <Link href="/login" className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </div>
            <button disabled={busy} className="w-full rounded-full bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
              {busy ? "Please wait..." : "Request Password Reset"}
            </button>
            <p className="text-center text-sm text-zinc-500">
              Remembered it? <Link href="/login" className="font-semibold text-orange-600">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
