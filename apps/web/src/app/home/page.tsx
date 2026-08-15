import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PetsHome } from "@/components/features/pets/pets-home";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrl, listOwnedPets } from "@/lib/pets/supabase-pets";

export const metadata: Metadata = {
  title: "Home",
  robots: { follow: false, index: false },
};

export default async function AppHomePage() {
  const { supabase, user } = await requireUser("/home");
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length === 0) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const displayName =
    profile?.display_name?.trim().split(/\s+/)[0] ||
    user.user_metadata.display_name?.trim().split(/\s+/)[0] ||
    "there";
  const petsWithPhotos = await Promise.all(
    pets.map(async (pet) => ({
      pet,
      photoUrl: await getPetPhotoUrl(supabase, pet.photoPath),
    })),
  );

  return <PetsHome displayName={displayName} pets={petsWithPhotos} />;
}
