import type { Metadata } from "next";

import { NotificationSettings } from "@/components/features/profile/notification-settings";
import { requireUser } from "@/lib/auth/require-user";
import { createHealthLogReminderRepository } from "@/lib/health-logs/supabase-health-log-reminders";
import { listOwnedPets } from "@/lib/pets/supabase-pets";
import { getProfile } from "@/lib/profile/supabase-profile";
import { createWeightReminderRepository } from "@/lib/weights/supabase-weights";

export const metadata: Metadata = { title: "Notification settings" };

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser("/profile/notifications");
  const pets = await listOwnedPets(supabase, user.id);
  const healthReminders = createHealthLogReminderRepository(supabase);
  const weightReminders = createWeightReminderRepository(supabase);
  const [profile, reminderSettings] = await Promise.all([
    getProfile(supabase, user.id),
    Promise.all(
      pets.map(async ({ id, name }) => ({
        healthReminder: await healthReminders.find(user.id, id),
        id,
        name,
        weightReminder: await weightReminders.find(user.id, id),
      })),
    ),
  ]);
  return (
    <NotificationSettings
      alertLeadDays={profile.alertLeadDays}
      pets={reminderSettings}
      reminderNotificationsEnabled={profile.reminderNotificationsEnabled}
    />
  );
}
