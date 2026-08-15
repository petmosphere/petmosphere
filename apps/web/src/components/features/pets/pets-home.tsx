import type { Pet } from "@petmosphere/domain";
import { ChevronRight, ClipboardPlus } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { AppNav } from "./app-nav";
import { PetAvatar } from "./pet-avatar";

type PetWithPhoto = { pet: Pet; photoUrl: string | null };

export function PetsHome({
  displayName,
  pets,
}: {
  displayName: string;
  pets: PetWithPhoto[];
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#fdf8f2] pb-3 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex items-center justify-between px-6 pt-8">
        <div>
          <p className="text-sm text-stone-500">Welcome back</p>
          <h1 className="text-2xl font-bold">Hello, {displayName}</h1>
        </div>
        <form action={signOutAction}>
          <button
            className="min-h-11 rounded-xl px-3 text-sm text-stone-500 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#ed802a]"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="px-6 pt-10">
        <h2 className="text-lg font-bold">Your pets</h2>
        <div className="mt-3 space-y-3">
          {pets.map(({ pet, photoUrl }) => (
            <Link
              className="flex items-center gap-4 rounded-3xl border border-[#f0e2d1] bg-white p-4 shadow-sm transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.98]"
              href={`/pets/${pet.id}`}
              key={pet.id}
            >
              <PetAvatar
                className="size-18"
                name={pet.name}
                photoUrl={photoUrl}
                species={pet.species}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xl font-bold">
                  {pet.name}
                </span>
                <span className="mt-1 block truncate text-sm text-stone-500 capitalize">
                  {pet.breed || pet.species}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-stone-400"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-6 mt-7 rounded-3xl bg-white p-6 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#d4f0ec] text-[#58bdb7]">
          <ClipboardPlus aria-hidden="true" className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold">No health logs yet</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          When health logging is available, you’ll be able to record your pet’s
          daily wellbeing here.
        </p>
        <span
          aria-disabled="true"
          className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-stone-200 font-semibold text-stone-500"
        >
          Create your first health log
        </span>
      </section>

      <div className="min-h-8 flex-1" />
      <AppNav />
    </main>
  );
}
