import type { Metadata } from "next";

import { LandingOnboarding } from "@/components/features/onboarding/landing-onboarding";

export const metadata: Metadata = {
  title: "Your pet's health companion",
  description:
    "Track your pet's wellness, remember important care, and keep everyday health organised with Petmosphere.",
};

export default function HomePage() {
  return <LandingOnboarding />;
}
