import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HealthDiary } from "@/components/features/health-logs/health-diary";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnedPet, getPetPhotoUrl } from "@/lib/pets/supabase-pets";

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
  const pet = await getOwnedPet(supabase, user.id, petId);
  if (!pet) notFound();

  return (
    <HealthDiary
      initialView="today"
      pet={pet}
      photoUrl={await getPetPhotoUrl(supabase, pet.photoPath)}
    />
  );
}
