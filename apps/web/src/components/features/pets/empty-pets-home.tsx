import { Plus, PawPrint } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { AppNav } from "./app-nav";

export function EmptyPetsHome({ displayName }: { displayName: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#fdf8f2] pb-3 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex items-center justify-between px-6 pt-8">
        <p className="text-lg font-medium">Hello, {displayName}</p>
        <form action={signOutAction}>
          <button
            className="min-h-11 rounded-xl px-3 text-sm text-stone-500 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#ed802a]"
            type="submit"
          >
            Sign out
          </button>
        </form>
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
        <p className="mt-2 text-sm text-stone-500">It only takes a minute</p>
      </section>

      <AppNav />
    </main>
  );
}
