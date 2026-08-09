import type { Metadata } from "next";

import { resetPasswordAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/features/auth/auth-form";
import { AuthShell } from "@/components/features/auth/auth-shell";

export const metadata: Metadata = { title: "Choose new password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      description="Use at least 10 characters for your new password."
      title="Choose a new password"
    >
      <AuthForm
        action={resetPasswordAction}
        fields={[
          {
            autoComplete: "new-password",
            label: "New password",
            name: "password",
            type: "password",
          },
          {
            autoComplete: "new-password",
            label: "Confirm new password",
            name: "confirmPassword",
            type: "password",
          },
        ]}
        footer={{
          href: "/auth/forgot-password",
          label: "Request another link",
          prompt: "Link expired?",
        }}
        submitLabel="Update password"
        variant="reset"
      />
    </AuthShell>
  );
}
