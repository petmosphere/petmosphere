import type { Metadata } from "next";

import { ContactInfo } from "@/components/features/profile/contact-info";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage() {
  const { supabase, user } = await requireUser("/profile/contact");
  const pets = await listOwnedPets(supabase, user.id);
  return (
    <ContactInfo
      diaryHref={pets[0] ? `/pets/${pets[0].id}/health-logs` : undefined}
    />
  );
}
