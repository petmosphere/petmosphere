import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HealthDiary } from "@/components/features/health-logs/health-diary";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrls, listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Today’s health log",
  robots: { follow: false, index: false },
};

export default async function TodayHealthLogPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = await params;
  const { supabase, user } = await requireUser(
    `/pets/${petId}/health-logs/today`,
  );
  const pets = await listOwnedPets(supabase, user.id);
  const pet = pets.find((candidate) => candidate.id === petId);
  if (!pet) notFound();
  const photoUrls = await getPetPhotoUrls(supabase, pets);
  const petOptions = pets.map((candidate) => ({
    pet: candidate,
    photoUrl: photoUrls.get(candidate.id) ?? null,
  }));
  const photoUrl = photoUrls.get(pet.id) ?? null;

  return (
    <HealthDiary
      initialView="today"
      pet={pet}
      petOptions={petOptions}
      photoUrl={photoUrl}
    />
  );
}
