import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FirstPetForm } from "@/components/features/pets/first-pet-form";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Add your pet",
  robots: { follow: false, index: false },
};

export default async function AddPetPage() {
  const { supabase, user } = await requireUser("/onboarding/pet");
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length > 0) redirect("/home");

  return <FirstPetForm />;
}
