import type { Metadata } from "next";

import { forgotPasswordAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/features/auth/auth-form";
import { AuthShell } from "@/components/features/auth/auth-shell";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="We’ll email a secure reset link if an account exists for this address."
      title="Reset your password"
    >
      <AuthForm
        action={forgotPasswordAction}
        fields={[
          {
            autoComplete: "email",
            label: "Email address",
            name: "email",
            type: "email",
          },
        ]}
        footer={{
          href: "/auth/sign-in",
          label: "Back to sign in",
          prompt: "Remembered it?",
        }}
        submitLabel="Send reset link"
        variant="forgot"
      />
    </AuthShell>
  );
}
