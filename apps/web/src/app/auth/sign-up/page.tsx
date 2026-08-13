import type { Metadata } from "next";

import { AuthShell } from "@/components/features/auth/auth-shell";
import { SignUpForm } from "@/components/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthShell
      description="Join Aussie pet parents caring with confidence"
      title="Create your account"
    >
      <SignUpForm />
    </AuthShell>
  );
}
