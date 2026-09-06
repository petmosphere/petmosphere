"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PetProfileBackButton() {
  const router = useRouter();

  return (
    <button
      aria-label="Back"
      className="-ml-3 grid min-h-11 min-w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.replace("/profile");
      }}
      type="button"
    >
      <ArrowLeft aria-hidden="true" className="size-6" />
    </button>
  );
}
