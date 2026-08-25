import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listWeights } from "@petmosphere/services";

import { LogWeight } from "@/components/features/weights/log-weight";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnedPet } from "@/lib/pets/supabase-pets";
import {
  createWeightReminderRepository,
  createWeightRepository,
  toWeightReminderResponse,
} from "@/lib/weights/supabase-weights";

export const metadata: Metadata = {
  title: "Log weight",
  robots: { follow: false, index: false },
};

export default async function LogWeightPage({
  params,
}: {
  params: Promise<{ petId: string }>;
}) {
  const { petId } = await params;
  const { supabase, user } = await requireUser(`/pets/${petId}/weight`);
  const pet = await getOwnedPet(supabase, user.id, petId);
  if (!pet) notFound();
  const weights = createWeightRepository(supabase);
  const [entries, reminder] = await Promise.all([
    listWeights(user.id, petId, weights),
    createWeightReminderRepository(supabase).find(user.id, petId),
  ]);

  return (
    <LogWeight
      entries={entries}
      pet={pet}
      reminder={reminder ? toWeightReminderResponse(reminder) : null}
    />
  );
}
