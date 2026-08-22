import type { Metadata } from "next";

import { AuthEntryShell } from "@/components/features/auth/auth-entry-shell";
import { SignUpForm } from "@/components/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthEntryShell
      description="Join Aussie pet parents caring with confidence"
      title="Create your account"
      variant="sign-in"
    >
      <SignUpForm />
    </AuthEntryShell>
  );
}
