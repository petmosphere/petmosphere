"use client";

import { useState } from "react";

import { signOutAction } from "@/app/auth/actions";
import { disablePushNotifications } from "@/lib/health-logs/push-notifications";

export function SignOutButton({
  appearance = "default",
}: {
  appearance?: "default" | "profile";
}) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await disablePushNotifications();
    await signOutAction();
  }

  return (
    <button
      className={`min-h-11 rounded-xl px-3 text-sm underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#ed802a] disabled:opacity-50 ${
        appearance === "profile"
          ? "font-medium text-[#ef7070] hover:underline"
          : "text-stone-500 hover:underline"
      }`}
      disabled={pending}
      onClick={() => void signOut()}
      type="button"
    >
      {pending
        ? "Signing out…"
        : appearance === "profile"
          ? "Log out"
          : "Sign out"}
    </button>
  );
}
