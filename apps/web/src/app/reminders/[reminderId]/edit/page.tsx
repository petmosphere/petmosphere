import type { Metadata } from "next";
import { deriveLocalDate } from "@petmosphere/domain";
import { notFound } from "next/navigation";

import { ReminderForm } from "@/components/features/reminders/reminder-form";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrl, listOwnedPets } from "@/lib/pets/supabase-pets";
import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";

export const metadata: Metadata = {
  title: "Edit reminder",
  robots: { follow: false, index: false },
};

export default async function EditReminderPage({
  params,
}: {
  params: Promise<{ reminderId: string }>;
}) {
  const { reminderId } = await params;
  const { supabase, user } = await requireUser(`/reminders/${reminderId}/edit`);
  const [reminder, pets] = await Promise.all([
    createReminderRepository(supabase).findById(user.id, reminderId),
    listOwnedPets(supabase, user.id),
  ]);
  if (!reminder || reminder.deletedAt || reminder.completedAt) notFound();
  const petOptions = await Promise.all(
    pets.map(async (pet) => ({
      pet,
      photoUrl: await getPetPhotoUrl(supabase, pet.photoPath),
    })),
  );
  return (
    <ReminderForm
      pets={petOptions}
      reminder={toReminderResponse(reminder)}
      today={deriveLocalDate(new Date(), "Australia/Melbourne")}
    />
  );
}
