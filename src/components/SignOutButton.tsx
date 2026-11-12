"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-orange-600 hover:text-orange-600"
    >
      Sign Out
    </button>
  );
}
