import type { Metadata } from "next";

import { UnitsForm } from "@/components/features/profile/units-form";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";
import { getProfile } from "@/lib/profile/supabase-profile";

export const metadata: Metadata = { title: "Units" };

export default async function UnitsPage() {
  const { supabase, user } = await requireUser("/profile/units");
  const [profile, pets] = await Promise.all([
    getProfile(supabase, user.id),
    listOwnedPets(supabase, user.id),
  ]);
  return (
    <UnitsForm
      diaryHref={pets[0] ? `/pets/${pets[0].id}/health-logs` : undefined}
      initialUnits={{ weightUnit: profile.weightUnit }}
    />
  );
}
