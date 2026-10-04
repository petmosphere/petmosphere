import { redirect } from "next/navigation";

import { LandingOnboarding } from "@/components/features/onboarding/landing-onboarding";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export const metadata = {
  title: "Your pet's wellness companion",
  description:
    "Track your pet's wellness, remember important care, and keep everyday health organised with Petmosphere.",
};

export default async function LandingPage() {
  // Signed-in users go straight to the app — never see the marketing slides.
  // Skipped when Supabase isn't configured (e.g. CI) so the page stays static
  // and doesn't error.
  if (hasSupabaseConfig()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/home");
  }

  return <LandingOnboarding />;
}
