import { Lock, Plus, PawPrint } from "lucide-react";
import Link from "next/link";

import { AppNav } from "./app-nav";

export function EmptyPetsHome({ displayName }: { displayName: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#fdf8f2] pb-3 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex items-center px-6 pt-8">
        <p className="text-lg font-medium">Hello, {displayName}</p>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-7 pb-16 text-center">
        <div className="grid size-36 place-items-center rounded-full border-2 border-dashed border-[#f47b20]">
          <div className="grid size-24 place-items-center rounded-full bg-[#fff0e1] text-[#f47b20]">
            <PawPrint
              aria-hidden="true"
              className="size-11"
              strokeWidth={1.5}
            />
          </div>
        </div>
        <h1 className="mt-8 text-2xl font-bold">No pets yet</h1>
        <p className="mt-3 max-w-xs leading-6 text-stone-500">
          Add your first furry friend to start organising their everyday care.
        </p>
        <Link
          className="mt-8 flex min-h-14 w-full max-w-60 items-center justify-center gap-3 rounded-full bg-[#f47b20] px-6 font-semibold text-white shadow-lg shadow-[#f47b20]/20 transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309] active:scale-[0.97]"
          href="/onboarding/pet"
        >
          <Plus aria-hidden="true" className="size-5" />
          Add your pet
        </Link>
        <div className="mt-3 flex w-fit items-center gap-3 rounded-xl border border-[#f0e6d8] bg-white/60 px-4 py-2.5 text-[#ed802a] shadow-[0_4px_16px_rgba(205,146,85,0.08)]">
          <Lock
            aria-hidden="true"
            className="size-[18px] shrink-0"
            strokeWidth={2}
          />
          <p className="text-[13px] leading-[18px] font-bold whitespace-nowrap">
            Diary &amp; Reminders unlock after adding a pet
          </p>
        </div>
      </section>

      <AppNav />
    </main>
  );
}
