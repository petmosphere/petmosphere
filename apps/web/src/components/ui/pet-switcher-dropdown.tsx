"use client";

import { Check, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import type { Pet } from "@petmosphere/domain";
import { PetAvatar } from "@/components/features/pets/pet-avatar";

export function PetSwitcherDropdown({
  onClose,
  onSelect,
  open,
  pets,
  selectedId,
  showAllPets = true,
}: {
  onClose: () => void;
  onSelect: (id: string | "all") => void;
  open: boolean;
  pets: { pet: Pet; photoUrl: string | null }[];
  selectedId: string | "all";
  showAllPets?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, onClose]);

  return (
    <div
      className={`absolute top-full left-0 z-50 mt-2 w-64 origin-top rounded-2xl border border-[#F0E6D8] bg-white p-4 shadow-[0_4px_24px_rgba(205,146,85,0.12)] transition-[opacity,transform] duration-200 ${
        open
          ? "scale-100 opacity-100"
          : "pointer-events-none scale-95 opacity-0"
      }`}
      ref={cardRef}
    >
      {/* All Pets row */}
      {showAllPets ? (
        <button
          aria-label="All pets"
          aria-pressed={selectedId === "all"}
          className={`flex h-11 w-full items-center gap-3 rounded-lg px-2 transition-colors ${
            selectedId === "all" ? "bg-[#E6F4F3]" : ""
          }`}
          onClick={() => {
            onSelect("all");
            onClose();
          }}
          type="button"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="size-7 rounded-full"
            height={28}
            src="/app-icon.svg"
            width={28}
          />
          <span className="flex-1 text-left text-sm font-semibold text-[#2d2d2d]">
            All Pets
          </span>
          {selectedId === "all" ? (
            <Check
              aria-hidden="true"
              className="ml-auto size-4 text-[#65BCB5]"
            />
          ) : null}
        </button>
      ) : null}

      {/* Individual pet rows */}
      {pets.map(({ pet, photoUrl }) => {
        const selected = selectedId === pet.id;
        return (
          <button
            aria-label={pet.name}
            aria-pressed={selected}
            className={`flex h-11 w-full items-center gap-3 rounded-lg px-2 transition-colors ${
              selected ? "bg-[#E6F4F3]" : ""
            }`}
            key={pet.id}
            onClick={() => {
              onSelect(pet.id);
              onClose();
            }}
            type="button"
          >
            <PetAvatar
              className="size-7 border-0"
              name={pet.name}
              photoUrl={photoUrl}
              species={pet.species}
            />
            <span className="flex-1 text-left text-sm font-semibold text-[#2d2d2d]">
              {pet.name}
            </span>
            {selected ? (
              <Check
                aria-hidden="true"
                className="ml-auto size-4 text-[#65BCB5]"
              />
            ) : null}
          </button>
        );
      })}

      <hr className="my-2 border-[#F0E6D8]" />

      {/* Add New Pet */}
      <Link
        className="flex h-11 items-center gap-3 rounded-lg px-2 transition-opacity active:opacity-70"
        href="/pets/new"
        onClick={onClose}
      >
        <Plus aria-hidden="true" className="size-4 text-[#ED802A]" />
        <span className="text-sm font-semibold text-[#ED802A]">
          Add New Pet
        </span>
      </Link>
    </div>
  );
}
