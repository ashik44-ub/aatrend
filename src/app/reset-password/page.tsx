"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setCheckError("This reset link is missing its token. Please request a new one.");
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        setValid(ok);
        if (!ok) setCheckError(d.error ?? "This reset link is invalid or has expired.");
      })
      .catch(() => setCheckError("Could not verify the reset link."))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not reset the password.");
      return;
    }
    setDone(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-black">Reset Password</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">Choose a new password for your account.</p>
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
        {checking ? (
          <p className="py-6 text-center text-sm text-zinc-500">Checking your reset link...</p>
        ) : done ? (
          <div className="text-center">
            <p className="text-lg font-bold text-green-700">Password reset ✓</p>
            <p className="mt-2 text-sm text-zinc-600">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <Link href="/login" className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
              Sign In
            </Link>
          </div>
        ) : !valid ? (
          <div className="text-center">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{checkError}</p>
            <Link href="/forgot-password" className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
              Request a New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">New password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm new password</label>
              <input
                required
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-orange-500"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button disabled={busy} className="w-full rounded-full bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
              {busy ? "Please wait..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
