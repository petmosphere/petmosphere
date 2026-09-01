import { getMaxPets } from "@petmosphere/domain";
import type { Metadata } from "next";

import { FirstPetForm } from "@/components/features/pets/first-pet-form";
import { PetLimitUpsell } from "@/components/features/pets/pet-limit-upsell";
import { requireUser } from "@/lib/auth/require-user";
import { getProfile } from "@/lib/profile/supabase-profile";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Add a pet",
  robots: { follow: false, index: false },
};

export default async function AddAnotherPetPage() {
  const { supabase, user } = await requireUser("/pets/new");
  const [pets, profile] = await Promise.all([
    listOwnedPets(supabase, user.id),
    getProfile(supabase, user.id),
  ]);

  if (pets.length >= getMaxPets(profile.isSubscribed)) {
    return (
      <main className="grid min-h-dvh w-full place-items-center bg-[#fdf8f2] px-4 py-10">
        <PetLimitUpsell subscribed={profile.isSubscribed} />
      </main>
    );
  }

  return <FirstPetForm mode="add" />;
}
