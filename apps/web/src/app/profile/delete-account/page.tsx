import type { Metadata } from "next";

import { DeleteAccountForm } from "@/components/features/profile/delete-account-form";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Delete account" };

export default async function DeleteAccountPage() {
  await requireUser("/profile/delete-account");
  return <DeleteAccountForm />;
}
