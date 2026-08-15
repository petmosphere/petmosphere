import { Cat, Dog, PawPrint } from "lucide-react";
import Image from "next/image";

import type { PetSpecies } from "@petmosphere/domain";
import { cn } from "@/lib/utils";

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
  const Icon = species === "dog" ? Dog : species === "cat" ? Cat : PawPrint;

  return (
    <div
      className={cn(
        "relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#f47b20] bg-[#fff0e1] text-[#ed802a]",
        className,
      )}
    >
      {photoUrl ? (
        <Image
          alt={`${name}'s profile photo`}
          className="object-cover"
          fill
          sizes="160px"
          src={photoUrl}
          unoptimized
        />
      ) : (
        <Icon aria-hidden="true" className="size-10" strokeWidth={1.5} />
      )}
    </div>
  );
}
