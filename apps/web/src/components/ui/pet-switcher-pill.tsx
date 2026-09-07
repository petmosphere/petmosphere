"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";

import type { PetSpecies } from "@petmosphere/domain";
import { PetAvatar } from "@/components/features/pets/pet-avatar";

export function PetSwitcherPill({
  isAllPets = false,
  onClick,
  petName,
  photoUrl,
  species,
}: {
  isAllPets?: boolean;
  onClick: () => void;
  petName: string;
  photoUrl?: string | null;
  species?: PetSpecies;
}) {
  return (
    <button
      aria-label={
        isAllPets
          ? "All pets selected. Tap to switch."
          : `${petName} selected. Tap to switch pet.`
      }
      className="flex h-9 items-center gap-2.5 rounded-full border border-[#F0E6D8] bg-white/60 pr-3.5 pl-1.5 transition-opacity active:opacity-70"
      onClick={onClick}
      type="button"
    >
      {isAllPets ? (
        <Image
          alt=""
          aria-hidden="true"
          className="size-7 rounded-full"
          height={28}
          src="/app-icon.svg"
          width={28}
        />
      ) : (
        <PetAvatar
          className="size-7 border-0"
          name={petName}
          photoUrl={photoUrl ?? null}
          species={species ?? "dog"}
        />
      )}
      <span className="text-sm font-semibold text-[#ED802A]">{petName}</span>
      <ChevronDown aria-hidden="true" className="size-3.5 text-[#ED802A]" />
    </button>
  );
}
