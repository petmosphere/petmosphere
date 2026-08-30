import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmptyPetsHome } from "@/components/features/pets/empty-pets-home";
import { requireUser } from "@/lib/auth/require-user";
import { listOwnedPets } from "@/lib/pets/supabase-pets";
import { createNotificationRepository } from "@/lib/notifications/supabase-notifications";
import { listNotifications } from "@petmosphere/services";

export const metadata: Metadata = {
  title: "Add your first pet",
  robots: { follow: false, index: false },
};

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser("/onboarding");
  const pets = await listOwnedPets(supabase, user.id);
  if (pets.length > 0) redirect("/home");

  const [{ data: profile }, notifications] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    listNotifications(user.id, createNotificationRepository(supabase)),
  ]);
  const displayName =
    profile?.display_name?.trim().split(/\s+/)[0] ||
    user.user_metadata.display_name?.trim().split(/\s+/)[0] ||
    "there";

  return (
    <EmptyPetsHome
      displayName={displayName}
      unreadNotificationCount={notifications.unreadCount}
    />
  );
}
