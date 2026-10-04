import { redirect } from "next/navigation";

import { LandingOnboarding } from "@/components/features/onboarding/landing-onboarding";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Your pet's wellness companion",
  description:
    "Track your pet's wellness, remember important care, and keep everyday health organised with Petmosphere.",
};

export default async function LandingPage() {
  // Signed-in users go straight to the app — never see the marketing slides.
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/home");

  return <LandingOnboarding />;
}
