import type { Metadata } from "next";
import { deriveLocalDate, deriveLocalTime } from "@petmosphere/domain";
import { redirect } from "next/navigation";

import { RemindersHome } from "@/components/features/reminders/reminders-home";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";
import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";

export const metadata: Metadata = {
  title: "Reminders",
  robots: { follow: false, index: false },
};

export default async function RemindersPage() {
  const { supabase, user } = await requireUser("/reminders");
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length === 0) redirect("/onboarding");
  const repository = createReminderRepository(supabase);
  const now = new Date();
  const localDate = deriveLocalDate(now, "Australia/Melbourne");
  const localTime = deriveLocalTime(now, "Australia/Melbourne");
  const [upcoming, completed, overdue] = await Promise.all([
    repository.list(user.id, "upcoming", localDate, localTime),
    repository.list(user.id, "completed", localDate, localTime),
    repository.list(user.id, "overdue", localDate, localTime),
  ]);
  return (
    <RemindersHome
      initial={{
        completed: completed.map(toReminderResponse),
        overdue: overdue.map(toReminderResponse),
        upcoming: upcoming.map(toReminderResponse),
      }}
      pets={pets}
    />
  );
}
