import type { Metadata } from "next";

import { ProfileHome } from "@/components/features/profile/profile-home";
import { requireUser } from "@/lib/auth/require-user";
import { getPetPhotoUrl, listOwnedPets } from "@/lib/pets/supabase-pets";
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
  const [avatarUrl, petsWithPhotos] = await Promise.all([
    getProfileAvatarUrl(supabase, profile.avatarPath),
    Promise.all(
      pets.map(async (pet) => ({
        pet,
        photoUrl: await getPetPhotoUrl(supabase, pet.photoPath),
      })),
    ),
  ]);

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
