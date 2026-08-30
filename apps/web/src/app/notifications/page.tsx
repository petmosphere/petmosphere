import type { Metadata } from "next";
import { deriveLocalDate } from "@petmosphere/domain";
import { listNotifications } from "@petmosphere/services";

import { NotificationInbox } from "@/components/features/notifications/notification-inbox";
import { requireUser } from "@/lib/auth/require-user";
import {
  createNotificationRepository,
  toNotificationResponse,
} from "@/lib/notifications/supabase-notifications";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { follow: false, index: false },
};

export default async function NotificationsPage() {
  const { supabase, user } = await requireUser("/notifications");
  const [result, pets] = await Promise.all([
    listNotifications(user.id, createNotificationRepository(supabase)),
    listOwnedPets(supabase, user.id),
  ]);
  const firstPet = pets[0];
  return (
    <NotificationInbox
      diaryHref={firstPet ? `/pets/${firstPet.id}/health-logs` : undefined}
      initialNotifications={result.notifications.map(toNotificationResponse)}
      reminderHref={firstPet ? "/reminders" : undefined}
      today={deriveLocalDate(new Date(), "Australia/Melbourne")}
    />
  );
}
