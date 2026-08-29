import type { Metadata } from "next";

import { signInAction } from "@/app/auth/actions";
import { AuthEntryShell } from "@/components/features/auth/auth-entry-shell";
import { AuthForm } from "@/components/features/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthEntryShell
      description="Log in to your account"
      title="Welcome back"
      variant="sign-in"
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
      {params.notice === "password-updated" ? (
        <p
          className="mt-5 rounded-2xl bg-[#87b35c]/15 px-4 py-3 text-sm text-green-900"
          role="status"
        >
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      {params.notice === "account-deleted" ? (
        <p
          className="mt-5 rounded-2xl bg-[#65bcb5]/15 px-4 py-3 text-sm text-[#246865]"
          role="status"
        >
          Your Petmosphere account and private data were permanently deleted.
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
          label: "Sign up",
          prompt: "Don’t have an account?",
        }}
        hiddenNext={params.next}
        submitLabel="Log in"
        variant="sign-in"
      />
    </AuthEntryShell>
  );
}
