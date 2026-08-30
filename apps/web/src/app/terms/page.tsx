import type { Metadata } from "next";

import { TermsContent } from "@/components/features/profile/terms-content";

export const metadata: Metadata = {
  alternates: { canonical: "/terms" },
  description: "Terms governing the use of Petmosphere.",
  title: "Terms of Service",
};

export default function TermsPage() {
  return <TermsContent backHref="/auth/sign-up" />;
}
