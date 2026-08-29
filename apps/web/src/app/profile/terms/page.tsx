import type { Metadata } from "next";

import { TermsContent } from "@/components/features/profile/terms-content";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function ProfileTermsPage() {
  const { supabase, user } = await requireUser("/profile/terms");
  const pets = await listOwnedPets(supabase, user.id);

  return (
    <TermsContent
      backHref="/profile"
      diaryHref={pets[0] ? `/pets/${pets[0].id}/health-logs` : undefined}
      profileMode
    />
  );
}
