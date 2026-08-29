import type { Metadata } from "next";

import { PrivacyPolicyContent } from "@/components/features/profile/privacy-policy-content";
import { SupportPageShell } from "@/components/features/profile/support-page-shell";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function ProfilePrivacyPage() {
  const { supabase, user } = await requireUser("/profile/privacy");
  const pets = await listOwnedPets(supabase, user.id);

  return (
    <SupportPageShell
      diaryHref={pets[0] ? `/pets/${pets[0].id}/health-logs` : undefined}
      lastUpdated="30 August 2026"
      title="Privacy Policy"
    >
      <PrivacyPolicyContent termsHref="/profile/terms" />
    </SupportPageShell>
  );
}
