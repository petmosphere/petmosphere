import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HealthDiary } from "@/components/features/health-logs/health-diary";
import { healthLogStatuses } from "@petmosphere/domain";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrls, listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Today’s health log",
  robots: { follow: false, index: false },
};

export default async function TodayHealthLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ petId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ petId }, { status }] = await Promise.all([params, searchParams]);
  const initialStatus = healthLogStatuses.includes(status as never)
    ? (status as (typeof healthLogStatuses)[number])
    : undefined;
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
      {...(initialStatus && { initialStatus })}
      initialView="today"
      pet={pet}
      petOptions={petOptions}
      photoUrl={photoUrl}
    />
  );
}
