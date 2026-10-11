import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ReminderForm } from "@/components/features/reminders/reminder-form";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrls, listOwnedPets } from "@/lib/pets/supabase-pets";
import { getProfile } from "@/lib/profile/supabase-profile";

export const metadata: Metadata = {
  title: "New reminder",
  robots: { follow: false, index: false },
};

export default async function NewReminderPage() {
  const { supabase, user } = await requireUser("/reminders/new");
  const [pets, profile] = await Promise.all([
    listOwnedPets(supabase, user.id),
    getProfile(supabase, user.id),
  ]);
  if (pets.length === 0) redirect("/onboarding");
  const photoUrls = await getPetPhotoUrls(supabase, pets);
  const petOptions = pets.map((pet) => ({
    pet,
    photoUrl: photoUrls.get(pet.id) ?? null,
  }));
  return (
    <ReminderForm
      pets={petOptions}
      preferredTimezone={profile.preferredTimezone}
    />
  );
}
