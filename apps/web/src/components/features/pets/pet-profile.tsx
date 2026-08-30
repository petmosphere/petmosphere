import type { Pet, WeightUnit } from "@petmosphere/domain";
import { formatWeight, getPetAgeLabel } from "@petmosphere/domain";
import {
  ArrowLeft,
  Cake,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Mars,
  Pencil,
  Scale,
  Scissors,
} from "lucide-react";
import Link from "next/link";

import { DeletePetButton } from "./delete-pet-button";
import { PetPhotoViewer } from "./pet-photo-viewer";

const labels = {
  no: "No",
  unknown: "Not sure",
  yes: "Yes",
} as const;

export function PetProfile({
  pet,
  photoUrl,
  weightUnit = "kg",
}: {
  pet: Pet;
  photoUrl: string | null;
  weightUnit?: WeightUnit;
}) {
  const age = getPetAgeLabel(pet);
  const detailRows = [
    pet.birthDate
      ? {
          icon: Cake,
          label: "Birthday",
          value: new Intl.DateTimeFormat("en-AU", {
            dateStyle: "medium",
          }).format(new Date(`${pet.birthDate}T00:00:00`)),
        }
      : age
        ? { icon: CircleHelp, label: "Approximate age", value: age }
        : null,
    pet.weightKg
      ? {
          icon: Scale,
          label: "Weight",
          value: formatWeight(pet.weightKg, weightUnit),
        }
      : null,
    pet.sex
      ? {
          icon: Mars,
          label: "Gender",
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
    <main className="mx-auto min-h-dvh w-full max-w-[393px] bg-[#fdf8f2] px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-[#2d2d2d]">
      <div className="flex items-center justify-between">
        <Link
          aria-label="Back to Home"
          className="-ml-3 grid min-h-11 min-w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
          href="/home"
        >
          <ArrowLeft aria-hidden="true" className="size-6" />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            aria-label={`Edit ${pet.name}'s profile`}
            className="grid size-11 place-items-center rounded-full text-[#d86f1d] focus-visible:outline-2 focus-visible:outline-[#ed802a]"
            href={`/pets/${pet.id}/edit`}
          >
            <Pencil aria-hidden="true" className="size-5" />
          </Link>
          <DeletePetButton petId={pet.id} />
        </div>
      </div>

      <section className="mt-4 text-center">
        <PetPhotoViewer
          name={pet.name}
          photoUrl={photoUrl}
          species={pet.species}
        />
        <h1 className="mt-5 text-2xl font-bold">{pet.name}</h1>
        <p className="mt-1 text-sm text-[#7a7a7a]">
          {[pet.breed || pet.species, age].filter(Boolean).join(" · ")}
        </p>
      </section>

      {detailRows.length > 0 ? (
        <dl className="mt-6 divide-y divide-[#f0e6d8] rounded-2xl bg-white/60 px-5 shadow-[0_8px_24px_rgba(205,146,85,0.08)]">
          {detailRows.map(({ icon: Icon, label, value }) => (
            <div className="flex min-h-14 items-center gap-3" key={label}>
              <Icon
                aria-hidden="true"
                className="size-5 text-[#ed802a]"
                strokeWidth={1.8}
              />
              <dt className="flex-1 text-sm text-[#7a7a7a]">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-6 rounded-2xl bg-white/60 p-5 text-center text-sm text-[#7a7a7a] shadow-[0_8px_24px_rgba(205,146,85,0.08)]">
          You can add more profile details in a future update.
        </p>
      )}

      <Link
        className="mt-5 flex min-h-[68px] items-center gap-3 rounded-2xl bg-white/60 px-4 shadow-[0_8px_24px_rgba(205,146,85,0.08)] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#65bcb5] active:scale-[0.98]"
        href={`/pets/${pet.id}/weight`}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dff3ef] text-[#65bcb5]">
          <ChartNoAxesCombined
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.8}
          />
        </span>
        <span className="flex-1 text-left font-medium">Weight History</span>
        <svg
          aria-hidden="true"
          className="h-4 w-12 text-[#65bcb5]"
          fill="none"
          viewBox="0 0 48 16"
        >
          <path
            d="M1 11.5 10 13l8-5 8 1 8-5 13-3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <ChevronRight aria-hidden="true" className="size-5 text-[#9b948d]" />
      </Link>
    </main>
  );
}
