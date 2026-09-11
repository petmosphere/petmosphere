import type { Metadata } from "next";

import { ProfileHome } from "@/components/features/profile/profile-home";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrls, listOwnedPets } from "@/lib/pets/supabase-pets";
import {
  getProfile,
  getProfileAvatarUrl,
} from "@/lib/profile/supabase-profile";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { supabase, user } = await requireUser("/profile");
  const [profile, pets] = await Promise.all([
    getProfile(supabase, user.id),
    listOwnedPets(supabase, user.id),
  ]);
  const [avatarUrl, photoUrls] = await Promise.all([
    getProfileAvatarUrl(supabase, profile.avatarPath),
    getPetPhotoUrls(supabase, pets),
  ]);
  const petsWithPhotos = pets.map((pet) => ({
    pet,
    photoUrl: photoUrls.get(pet.id) ?? null,
  }));

  return (
    <ProfileHome
      avatarUrl={avatarUrl}
      displayName={profile.displayName}
      email={user.email ?? ""}
      pets={petsWithPhotos}
      weightUnit={profile.weightUnit}
    />
  );
}
