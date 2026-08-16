"use client";

import { useState } from "react";

import { signOutAction } from "@/app/auth/actions";
import { disablePushNotifications } from "@/lib/health-logs/push-notifications";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await disablePushNotifications();
    await signOutAction();
  }

  return (
    <button
      className="min-h-11 rounded-xl px-3 text-sm text-stone-500 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#ed802a] disabled:opacity-50"
      disabled={pending}
      onClick={() => void signOut()}
      type="button"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
