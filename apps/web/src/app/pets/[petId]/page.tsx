import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PetProfile } from "@/components/features/pets/pet-profile";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnedPet, getPetPhotoUrl } from "@/lib/pets/supabase-pets";
import { getProfile } from "@/lib/profile/supabase-profile";

export const metadata: Metadata = {
  title: "Pet profile",
  robots: { follow: false, index: false },
};

export default async function PetProfilePage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = await params;
  const { supabase, user } = await requireUser(`/pets/${petId}`);
  const pet = await getOwnedPet(supabase, user.id, petId);
  if (!pet) notFound();
  const profile = await getProfile(supabase, user.id);

  return (
    <PetProfile
      pet={pet}
      photoUrl={await getPetPhotoUrl(supabase, pet.photoPath)}
      weightUnit={profile.weightUnit}
    />
  );
}
