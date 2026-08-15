import type { Metadata } from "next";

import { forgotPasswordAction } from "@/app/auth/actions";
import { AuthEntryShell } from "@/components/features/auth/auth-entry-shell";
import { AuthForm } from "@/components/features/auth/auth-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthEntryShell
      description="Enter your email and we'll send you a reset link."
      title="Reset password"
      variant="forgot"
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
        submitLabel="Send Reset Link"
        variant="forgot"
      />
    </AuthEntryShell>
  );
}
