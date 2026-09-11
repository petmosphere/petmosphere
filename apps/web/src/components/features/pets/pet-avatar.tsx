import { PawPrint } from "lucide-react";
import Image from "next/image";

import type { PetSpecies } from "@petmosphere/domain";
import { cn } from "@/lib/utils";

const speciesPhotoSrc: Partial<Record<PetSpecies, string>> = {
  cat: "/images/species-cat.png",
  dog: "/images/species-dog.png",
};

export function PetAvatar({
  className,
  name,
  photoUrl,
  species,
}: {
  className?: string;
  name: string;
  photoUrl: string | null;
  species: PetSpecies;
}) {
  const src = photoUrl ?? speciesPhotoSrc[species] ?? null;

  return (
    <div
      className={cn(
        "relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#f47b20] bg-[#fff0e1] text-[#ed802a]",
        className,
      )}
    >
      {src ? (
        <Image
          alt={`${name}'s profile photo`}
          className="object-cover"
          fill
          sizes="160px"
          src={src}
          unoptimized={Boolean(photoUrl)}
        />
      ) : (
        <PawPrint aria-hidden="true" className="size-10" strokeWidth={1.5} />
      )}
    </div>
  );
}
