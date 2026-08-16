import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthEntryShell } from "@/components/features/auth/auth-entry-shell";
import { VerifyEmailCodeForm } from "@/components/features/auth/verify-email-code-form";
import {
  getPendingSignUp,
  getResendWaitSeconds,
  maskEmail,
  resendCooldownSeconds,
} from "@/lib/auth/pending-sign-up";

export const metadata: Metadata = { title: "Check your email" };

export default async function VerifyEmailPage() {
  const pendingSignUp = await getPendingSignUp();
  if (!pendingSignUp.email) redirect("/auth/sign-up");

  return (
    <AuthEntryShell
      description="Enter the code from your email to finish creating your private account."
      title="Check your email"
      variant="verify"
    >
      <VerifyEmailCodeForm
        initialResendWait={getResendWaitSeconds(pendingSignUp.sentAt)}
        maskedEmail={maskEmail(pendingSignUp.email)}
        resendCooldown={resendCooldownSeconds}
      />
    </AuthEntryShell>
  );
}
