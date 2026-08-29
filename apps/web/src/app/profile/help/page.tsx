import type { Metadata } from "next";

import { FaqContent } from "@/components/features/profile/faq-content";
import { SupportPageShell } from "@/components/features/profile/support-page-shell";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = { title: "Help & FAQ" };

export default async function HelpPage() {
  const { supabase, user } = await requireUser("/profile/help");
  const pets = await listOwnedPets(supabase, user.id);

  return (
    <SupportPageShell
      diaryHref={pets[0] ? `/pets/${pets[0].id}/health-logs` : undefined}
      title="Help & FAQ"
    >
      <FaqContent />
    </SupportPageShell>
  );
}
