import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReminderDetail } from "@/components/features/reminders/reminder-detail";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnedPet } from "@/lib/pets/supabase-pets";
import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";

export const metadata: Metadata = {
  title: "Reminder details",
  robots: { follow: false, index: false },
};

export default async function ReminderPage({
  params,
}: {
  params: Promise<{ reminderId: string }>;
}) {
  const { reminderId } = await params;
  const { supabase, user } = await requireUser(`/reminders/${reminderId}`);
  const reminder = await createReminderRepository(supabase).findById(
    user.id,
    reminderId,
  );
  if (!reminder || reminder.deletedAt) notFound();
  const pet = await getOwnedPet(supabase, user.id, reminder.petId);
  if (!pet) notFound();
  return (
    <ReminderDetail
      petName={pet.name}
      reminder={toReminderResponse(reminder)}
    />
  );
}
