import type { Metadata } from "next";

import { TimezonePreference } from "@/components/features/profile/timezone-preference";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";
import { getProfile } from "@/lib/profile/supabase-profile";

export const metadata: Metadata = { title: "Time zone" };

export default async function TimezonePage() {
  const { supabase, user } = await requireUser("/profile/timezone");
  const [profile, pets] = await Promise.all([
    getProfile(supabase, user.id),
    listOwnedPets(supabase, user.id),
  ]);
  return (
    <TimezonePreference
      diaryHref={pets[0] ? `/pets/${pets[0].id}/health-logs` : undefined}
      initialTimezone={profile.preferredTimezone}
    />
  );
}
