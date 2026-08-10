import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/features/auth/auth-shell";

export const metadata: Metadata = { title: "Check your email" };

export default function VerifyEmailPage() {
  return (
    <AuthShell
      description="Open the verification link we sent to finish creating your private account. Check your spam folder if it doesn’t arrive."
      title="Check your email"
    >
      <Link
        className="mt-8 flex min-h-12 items-center justify-center rounded-2xl border border-[#cd9255] px-5 font-bold text-[#8b5b30]"
        href="/auth/sign-in"
      >
        Return to sign in
      </Link>
    </AuthShell>
  );
}
