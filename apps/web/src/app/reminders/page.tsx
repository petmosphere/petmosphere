import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RemindersHome } from "@/components/features/reminders/reminders-home";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrls, listOwnedPets } from "@/lib/pets/supabase-pets";
import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";

export const metadata: Metadata = {
  title: "Reminders",
  robots: { follow: false, index: false },
};

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const [{ supabase, user }, { pet: petParam }] = await Promise.all([
    requireUser("/reminders"),
    searchParams,
  ]);
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length === 0) redirect("/onboarding");
  const repository = createReminderRepository(supabase);
  const now = new Date();
  const [photoUrls, upcoming, completed, overdue] = await Promise.all([
    getPetPhotoUrls(supabase, pets),
    repository.list(user.id, "upcoming", now),
    repository.list(user.id, "completed", now),
    repository.list(user.id, "overdue", now),
  ]);
  const petOptions = pets.map((pet) => ({
    pet,
    photoUrl: photoUrls.get(pet.id) ?? null,
  }));
  const initialPetId = pets.find((p) => p.id === petParam)?.id;
  return (
    <RemindersHome
      initial={{
        completed: completed.map(toReminderResponse),
        overdue: overdue.map(toReminderResponse),
        upcoming: upcoming.map(toReminderResponse),
      }}
      pets={petOptions}
      {...(initialPetId ? { initialPetId } : {})}
    />
  );
}
