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

export const metadata: Metadata = { title: "Enter recovery code" };

export default async function VerifyRecoveryPage() {
  const pending = await getPendingSignUp("recovery");
  if (!pending.email) redirect("/auth/forgot-password");
  return (
    <AuthEntryShell
      title="Check your email"
      description="Enter the code from your email to reset your password. The code expires in 10 minutes."
      variant="verify"
    >
      <VerifyEmailCodeForm
        purpose="recovery"
        maskedEmail={maskEmail(pending.email)}
        initialResendWait={getResendWaitSeconds(pending.sentAt)}
        resendCooldown={resendCooldownSeconds}
      />
    </AuthEntryShell>
  );
}
