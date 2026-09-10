"use client";

import { Check, CircleX, Plus } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { Pet } from "@petmosphere/domain";
import { PetAvatar } from "@/components/features/pets/pet-avatar";

export function PetSwitcherSheet({
  currentPetId,
  onClose,
  onSelect,
  open,
  pets,
}: {
  currentPetId: string;
  onClose: () => void;
  onSelect: (petId: string) => void;
  open: boolean;
  pets: { pet: Pet; photoUrl: string | null }[];
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function handleSelect(petId: string) {
    onSelect(petId);
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Scrim */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        aria-hidden={!open}
        aria-label="Switch pet"
        aria-modal="true"
        className={`fixed right-0 bottom-0 left-0 z-50 mx-auto flex max-h-[82dvh] max-w-md flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0px_-4px_16px_rgba(205,146,85,0.10)] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        role="dialog"
      >
        {/* Header */}
        <div className="flex flex-col gap-3 px-6 pt-3 pb-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-[#E0D7CD]" />
          <div className="flex items-center justify-between">
            <span className="text-[18px] leading-[25px] font-bold text-[#2d2d2d]">
              Switch Pet
            </span>
            <button
              aria-label="Close pet switcher"
              className="flex size-5 items-center justify-center text-[#7a7a7a] transition-opacity active:opacity-60"
              onClick={onClose}
              type="button"
            >
              <CircleX aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        {/* Pet list */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="flex flex-col gap-2">
            {pets.map(({ pet, photoUrl }) => {
              const selected = pet.id === currentPetId;
              return (
                <button
                  aria-pressed={selected}
                  className={`flex h-16 w-full items-center gap-3 rounded-xl px-3.5 shadow-[0px_2px_8px_rgba(237,128,42,0.10)] transition-colors ${
                    selected
                      ? "border-[1.5px] border-[#65BCB5] bg-white/60"
                      : "border border-[#F0E6D8] bg-white/60"
                  }`}
                  key={pet.id}
                  onClick={() => handleSelect(pet.id)}
                  type="button"
                >
                  <PetAvatar
                    className="size-10 border-0"
                    name={pet.name}
                    photoUrl={photoUrl}
                    species={pet.species}
                  />
                  <span className="flex flex-1 flex-col items-start">
                    <span className="text-[14px] font-semibold text-[#2d2d2d]">
                      {pet.name}
                    </span>
                    {pet.breed ? (
                      <span className="text-[12px] text-[#7a7a7a]">
                        {pet.breed}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-full bg-[#65BCB5]"
                    >
                      <Check className="size-2.5 stroke-[3] text-white" />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-[18px] rounded-full border border-[#F0E6D8]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add New Pet */}
        <div className="px-6 pt-3 pb-6">
          <hr className="mb-3 border-[#F0E6D8]" />
          <Link
            className="flex h-11 items-center gap-3 rounded-xl px-3.5 transition-opacity active:opacity-70"
            href="/pets/new"
            onClick={onClose}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-[#FFF0E1]">
              <Plus aria-hidden="true" className="size-4 text-[#ED802A]" />
            </span>
            <span className="text-sm font-semibold text-[#ED802A]">
              Add New Pet
            </span>
          </Link>
        </div>
      </div>
    </>,
    document.body,
  );
}
