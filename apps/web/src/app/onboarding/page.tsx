import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Add your first pet",
  robots: { follow: false, index: false },
};

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser("/onboarding");
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length > 0) redirect("/home");
  redirect("/onboarding/pet");
}
