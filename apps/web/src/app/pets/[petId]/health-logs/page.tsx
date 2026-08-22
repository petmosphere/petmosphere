import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HealthDiary } from "@/components/features/health-logs/health-diary";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnedPet, getPetPhotoUrl } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Health diary",
  robots: { follow: false, index: false },
};

export default async function HealthDiaryPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = await params;
  const { supabase, user } = await requireUser(`/pets/${petId}/health-logs`);
  const pet = await getOwnedPet(supabase, user.id, petId);
  if (!pet) notFound();

  return (
    <HealthDiary
      pet={pet}
      photoUrl={await getPetPhotoUrl(supabase, pet.photoPath)}
    />
  );
}
