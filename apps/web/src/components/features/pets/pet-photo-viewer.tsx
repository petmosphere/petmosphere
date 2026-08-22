"use client";

import { X } from "lucide-react";
import { useState } from "react";

import type { PetSpecies } from "@petmosphere/domain";

import { PetAvatar } from "./pet-avatar";

export function PetPhotoViewer({
  name,
  photoUrl,
  species,
}: {
  name: string;
  photoUrl: string | null;
  species: PetSpecies;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label={`Enlarge ${name}'s profile photo`}
        className="mx-auto grid size-[120px] place-items-center rounded-full border-[3px] border-[#ed802a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ed802a]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PetAvatar
          className="size-[106px] border-0"
          name={name}
          photoUrl={photoUrl}
          species={species}
        />
      </button>

      {open ? (
        <div
          aria-label={`${name}'s profile photo`}
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-stone-950/75 p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          role="dialog"
        >
          <div className="relative rounded-[2rem] bg-[#fdf8f2] p-2 shadow-2xl">
            <PetAvatar
              className="size-[min(82vw,24rem)] border-0"
              name={name}
              photoUrl={photoUrl}
              species={species}
            />
            <button
              aria-label="Close enlarged photo"
              autoFocus
              className="absolute -top-3 -right-3 grid size-11 place-items-center rounded-full bg-[#fdf8f2] text-[#2d2d2d] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
