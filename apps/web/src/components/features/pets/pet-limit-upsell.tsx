"use client";

import { PawPrint } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PetLimitUpsell({ subscribed }: { subscribed: boolean }) {
  const router = useRouter();
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string>();

  async function subscribe() {
    setSubscribing(true);
    setError(undefined);
    try {
      const response = await fetch("/api/v1/profile/subscription", {
        body: JSON.stringify({ isSubscribed: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (response.status === 401) {
        router.replace("/auth/sign-in?next=/pets/new");
        return;
      }
      if (!response.ok) {
        setError("We could not update your subscription. Try again.");
        setSubscribing(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
      setSubscribing(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-[#f0e6d8] bg-[#fdf8f2] p-6 text-center shadow-2xl">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#fff0e1] text-[#ed802a]">
        <PawPrint aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-4 text-2xl font-bold">
        {subscribed ? "You've reached your pet limit" : "Add up to 3 pets"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        {subscribed
          ? "Subscribed accounts can have up to 3 pets."
          : "Free accounts can have 1 pet. Subscribe to add up to 3 pets."}
      </p>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          className="grid min-h-12 place-items-center rounded-2xl border border-[#e8d0b3] bg-white font-semibold transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97]"
          href="/profile"
        >
          Cancel
        </Link>
        {subscribed ? (
          <span className="grid min-h-12 place-items-center rounded-2xl bg-stone-200 font-semibold text-stone-500">
            Limit reached
          </span>
        ) : (
          <button
            className="min-h-12 rounded-2xl bg-[#66bbb6] font-semibold text-white transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#66bbb6] active:scale-[0.97] disabled:opacity-60"
            disabled={subscribing}
            onClick={() => void subscribe()}
            type="button"
          >
            {subscribing ? "Subscribing…" : "Subscribe"}
          </button>
        )}
      </div>
    </div>
  );
}
