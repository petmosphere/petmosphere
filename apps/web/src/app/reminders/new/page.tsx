import type { Metadata } from "next";
import { deriveLocalDate } from "@petmosphere/domain";
import { redirect } from "next/navigation";

import { ReminderForm } from "@/components/features/reminders/reminder-form";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrls, listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "New reminder",
  robots: { follow: false, index: false },
};

export default async function NewReminderPage() {
  const { supabase, user } = await requireUser("/reminders/new");
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length === 0) redirect("/onboarding");
  const photoUrls = await getPetPhotoUrls(supabase, pets);
  const petOptions = pets.map((pet) => ({
    pet,
    photoUrl: photoUrls.get(pet.id) ?? null,
  }));
  return (
    <ReminderForm
      pets={petOptions}
      today={deriveLocalDate(new Date(), "Australia/Melbourne")}
    />
  );
}
