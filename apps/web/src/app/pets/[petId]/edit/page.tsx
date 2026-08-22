import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditPetForm } from "@/components/features/pets/edit-pet-form";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnedPet, getPetPhotoUrl } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Edit pet profile",
  robots: { follow: false, index: false },
};

export default async function EditPetProfilePage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = await params;
  const { supabase, user } = await requireUser(`/pets/${petId}/edit`);
  const pet = await getOwnedPet(supabase, user.id, petId);
  if (!pet) notFound();

  return (
    <EditPetForm
      pet={pet}
      photoUrl={await getPetPhotoUrl(supabase, pet.photoPath)}
    />
  );
}
