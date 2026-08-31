"use client";

import { Bell } from "lucide-react";

export default function NotificationsError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-[393px] place-items-center bg-[#fdf8f2] px-8 text-center text-[#2d2d2d]">
      <div>
        <Bell aria-hidden="true" className="mx-auto size-10 text-[#ed802a]" />
        <h1 className="mt-5 text-xl font-bold">
          Notifications are unavailable
        </h1>
        <p className="mt-2 text-sm text-[#7a7a7a]">
          Check your connection and try again.
        </p>
        <button
          className="mt-6 min-h-12 rounded-full bg-[#ed802a] px-8 font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
