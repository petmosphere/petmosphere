import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/features/profile/change-password-form";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  await requireUser("/profile/change-password");
  return <ChangePasswordForm />;
}
