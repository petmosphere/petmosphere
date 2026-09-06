"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Pet } from "@petmosphere/domain";
import { PetSwitcherPill } from "@/components/ui/pet-switcher-pill";
import { PetSwitcherSheet } from "@/components/ui/pet-switcher-sheet";

export function HomePetSwitcher({
  currentPetId,
  pets,
}: {
  currentPetId: string;
  pets: { pet: Pet; photoUrl: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const currentPet = pets.find(({ pet }) => pet.id === currentPetId) ?? pets[0];
  if (!currentPet) return null;

  return (
    <>
      <PetSwitcherPill
        onClick={() => setOpen(true)}
        petName={currentPet.pet.name}
        photoUrl={currentPet.photoUrl}
        species={currentPet.pet.species}
      />
      <PetSwitcherSheet
        currentPetId={currentPetId}
        onClose={() => setOpen(false)}
        onSelect={(petId) => {
          router.push(`/home?pet=${petId}`);
        }}
        open={open}
        pets={pets}
      />
    </>
  );
}
