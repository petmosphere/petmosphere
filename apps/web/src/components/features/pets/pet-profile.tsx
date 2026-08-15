import type { Pet } from "@petmosphere/domain";
import { getPetAgeLabel } from "@petmosphere/domain";
import {
  ArrowLeft,
  CalendarDays,
  CircleHelp,
  Scissors,
  Scale,
  VenusAndMars,
} from "lucide-react";
import Link from "next/link";

import { PetAvatar } from "./pet-avatar";

const labels = {
  no: "No",
  unknown: "Not sure",
  yes: "Yes",
} as const;

export function PetProfile({
  pet,
  photoUrl,
}: {
  pet: Pet;
  photoUrl: string | null;
}) {
  const age = getPetAgeLabel(pet);
  const detailRows = [
    pet.birthDate
      ? {
          icon: CalendarDays,
          label: "Birthday",
          value: new Intl.DateTimeFormat("en-AU", {
            dateStyle: "medium",
          }).format(new Date(`${pet.birthDate}T00:00:00`)),
        }
      : age
        ? { icon: CircleHelp, label: "Approximate age", value: age }
        : null,
    pet.weightKg
      ? { icon: Scale, label: "Weight", value: `${pet.weightKg} kg` }
      : null,
    pet.sex
      ? {
          icon: VenusAndMars,
          label: "Sex",
          value:
            pet.sex === "unknown"
              ? "Unknown"
              : `${pet.sex[0]?.toUpperCase()}${pet.sex.slice(1)}`,
        }
      : null,
    pet.desexedStatus
      ? { icon: Scissors, label: "Desexed", value: labels[pet.desexedStatus] }
      : null,
  ].filter((row) => row !== null);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 pt-8 pb-12 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <Link
        aria-label="Back to Home"
        className="grid min-h-11 min-w-11 place-items-center justify-self-start rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
        href="/home"
      >
        <ArrowLeft aria-hidden="true" className="size-6" />
      </Link>

      <section className="mt-5 text-center">
        <PetAvatar
          className="mx-auto size-32"
          name={pet.name}
          photoUrl={photoUrl}
          species={pet.species}
        />
        <h1 className="mt-5 text-3xl font-bold">{pet.name}</h1>
        <p className="mt-1 text-stone-500">
          {[pet.breed || pet.species, age].filter(Boolean).join(" · ")}
        </p>
      </section>

      {detailRows.length > 0 ? (
        <dl className="mt-8 divide-y divide-[#f0e2d1] rounded-3xl bg-white px-5 py-2 shadow-sm">
          {detailRows.map(({ icon: Icon, label, value }) => (
            <div className="flex min-h-13 items-center gap-3" key={label}>
              <Icon
                aria-hidden="true"
                className="size-5 text-[#ed802a]"
                strokeWidth={1.8}
              />
              <dt className="flex-1 text-stone-500">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-8 rounded-3xl bg-white p-5 text-center text-stone-500 shadow-sm">
          You can add more profile details in a future update.
        </p>
      )}

      <section className="mt-5 rounded-3xl bg-white p-6 text-center shadow-sm">
        <h2 className="font-bold">Health diary</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Record observations and review how {pet.name} has been feeling over time.
        </p>
        <Link
          className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-[#f47b20] font-semibold text-white transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b45309] active:scale-[0.98]"
          href={`/pets/${pet.id}/health-logs`}
        >
          Open health diary
        </Link>
      </section>
    </main>
  );
}
