import type { Metadata } from "next";

import { EditProfileForm } from "@/components/features/profile/edit-profile-form";
import { requireUser } from "@/lib/auth/require-user";
import {
  getProfile,
  getProfileAvatarUrl,
} from "@/lib/profile/supabase-profile";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const { supabase, user } = await requireUser("/profile/edit");
  const profile = await getProfile(supabase, user.id);
  return (
    <EditProfileForm
      avatarUrl={await getProfileAvatarUrl(supabase, profile.avatarPath)}
      displayName={profile.displayName}
      email={user.email ?? ""}
    />
  );
}
