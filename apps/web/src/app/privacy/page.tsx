import type { Metadata } from "next";

import { PrivacyPolicyContent } from "@/components/features/profile/privacy-policy-content";
import { SupportPageShell } from "@/components/features/profile/support-page-shell";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  description:
    "How Petmosphere collects, uses, protects and manages personal information.",
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <SupportPageShell
      backHref="/"
      lastUpdated="30 August 2026"
      showNavigation={false}
      title="Privacy Policy"
    >
      <PrivacyPolicyContent />
    </SupportPageShell>
  );
}
