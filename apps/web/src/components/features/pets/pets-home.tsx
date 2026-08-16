import type { Pet } from "@petmosphere/domain";
import { ChevronRight, ClipboardPlus } from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/features/auth/sign-out-button";
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
  const currentPet = pets[0];
  if (!currentPet) return null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#fdf8f2] pb-3 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex items-center justify-between px-6 pt-8">
        <div>
          <p className="text-sm text-stone-500">Welcome back</p>
          <h1 className="text-2xl font-bold">Hello, {displayName}</h1>
        </div>
        <SignOutButton />
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
        <h2 className="mt-4 text-lg font-bold">
          How is {currentPet.pet.name} today?
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Record a quick, private observation to start building their health
          history.
        </p>
        <Link
          className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-[#f47b20] font-semibold text-white transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309] active:scale-[0.98]"
          href={`/pets/${currentPet.pet.id}/health-logs/today`}
        >
          Record today’s health
        </Link>
      </section>

      <div className="min-h-8 flex-1" />
      <AppNav diaryHref={`/pets/${currentPet.pet.id}/health-logs`} />
    </main>
  );
}
