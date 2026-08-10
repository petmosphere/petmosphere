import type { Metadata } from "next";
import Link from "next/link";

import { signInAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/features/auth/auth-form";
import { AuthShell } from "@/components/features/auth/auth-shell";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell
      description="Welcome back. Your pet’s information stays private to your account."
      title="Sign in"
    >
      {params.notice === "expired-link" ? (
        <p
          className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          That link is invalid or expired. Sign in or request a new password
          reset link.
        </p>
      ) : null}
      <AuthForm
        action={signInAction}
        fields={[
          {
            autoComplete: "email",
            label: "Email address",
            name: "email",
            type: "email",
          },
          {
            autoComplete: "current-password",
            label: "Password",
            name: "password",
            type: "password",
          },
        ]}
        footer={{
          href: "/auth/sign-up",
          label: "Create one",
          prompt: "Need an account?",
        }}
        hiddenNext={params.next}
        submitLabel="Sign in"
        variant="sign-in"
      />
      <p className="mt-4 text-center text-sm">
        <Link
          className="font-semibold text-[#8b5b30] underline"
          href="/auth/forgot-password"
        >
          Forgot password?
        </Link>
      </p>
    </AuthShell>
  );
}
