import type { Metadata } from "next";

import { signUpAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/features/auth/auth-form";
import { AuthShell } from "@/components/features/auth/auth-shell";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthShell
      description="Create a private account to start organising your pet’s care."
      title="A healthier routine starts here"
    >
      <AuthForm
        action={signUpAction}
        fields={[
          {
            autoComplete: "email",
            label: "Email address",
            name: "email",
            type: "email",
          },
          {
            autoComplete: "new-password",
            label: "Password",
            name: "password",
            type: "password",
          },
          {
            autoComplete: "new-password",
            label: "Confirm password",
            name: "confirmPassword",
            type: "password",
          },
        ]}
        footer={{
          href: "/auth/sign-in",
          label: "Sign in",
          prompt: "Already have an account?",
        }}
        submitLabel="Create account"
        variant="sign-up"
      />
    </AuthShell>
  );
}
