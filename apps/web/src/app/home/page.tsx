import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { deriveLocalDate, deriveLocalTime } from "@petmosphere/domain";

import { PetsHome } from "@/components/features/pets/pets-home";
import { requireUser } from "@/lib/auth/require-user";
import { createHealthLogReminderRepository } from "@/lib/health-logs/supabase-health-log-reminders";
import { listOwnedHealthLogSummaries } from "@/lib/health-logs/supabase-health-logs";
import { getPetPhotoUrl, listOwnedPets } from "@/lib/pets/supabase-pets";
import { createNotificationRepository } from "@/lib/notifications/supabase-notifications";
import {
  createReminderRepository,
  toReminderResponse,
} from "@/lib/reminders/supabase-reminders";
import { createWeightRepository } from "@/lib/weights/supabase-weights";
import { getProfile } from "@/lib/profile/supabase-profile";
import { listNotifications, listWeights } from "@petmosphere/services";

export const metadata: Metadata = {
  title: "Home",
  robots: { follow: false, index: false },
};

function localDateDaysAgo(localDate: string, days: number) {
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const { supabase, user } = await requireUser("/home");
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length === 0) redirect("/onboarding");
  const { pet: selectedPetId } = await searchParams;
  const currentPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0]!;
  const now = new Date();
  const today = deriveLocalDate(now, "Australia/Melbourne");
  const localTime = deriveLocalTime(now, "Australia/Melbourne");

  const profile = await getProfile(supabase, user.id);
  const displayName =
    profile.displayName.trim().split(/\s+/)[0] ||
    user.user_metadata.display_name?.trim().split(/\s+/)[0] ||
    "there";
  const [
    petsWithPhotos,
    healthLogs,
    reminder,
    careReminders,
    weightEntries,
    notifications,
  ] = await Promise.all([
    Promise.all(
      pets.map(async (pet) => ({
        pet,
        photoUrl: await getPetPhotoUrl(supabase, pet.photoPath),
      })),
    ),
    listOwnedHealthLogSummaries(
      supabase,
      user.id,
      currentPet.id,
      localDateDaysAgo(today, 6),
      today,
    ),
    createHealthLogReminderRepository(supabase).find(user.id, currentPet.id),
    createReminderRepository(supabase).list(
      user.id,
      "upcoming",
      today,
      localTime,
    ),
    listWeights(user.id, currentPet.id, createWeightRepository(supabase), now),
    listNotifications(user.id, createNotificationRepository(supabase), now),
  ]);

  return (
    <PetsHome
      displayName={displayName}
      currentPetId={currentPet.id}
      healthLogs={healthLogs}
      pets={petsWithPhotos}
      reminder={reminder}
      careReminders={careReminders.slice(0, 3).map(toReminderResponse)}
      today={today}
      weightEntries={weightEntries}
      weightUnit={profile.weightUnit}
      unreadNotificationCount={notifications.unreadCount}
    />
  );
}
