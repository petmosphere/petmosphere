import * as Sentry from "@sentry/nextjs";
import { deleteAccountSchema } from "@petmosphere/api-contracts";
import { deleteAccount } from "@petmosphere/services";
import { NextResponse } from "next/server";

import { createAccountDeletionRepository } from "@/lib/account/supabase-account-deletion";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user?.email) {
    return NextResponse.json(
      { message: "Sign in to delete your account." },
      { status: 401 },
    );
  }

  try {
    const parsed = deleteAccountSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Confirm account deletion.",
        },
        { status: 400 },
      );
    }
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: data.user.email,
      password: parsed.data.currentPassword,
    });
    if (passwordError) {
      return NextResponse.json(
        { message: "Your current password is incorrect." },
        { status: 400 },
      );
    }

    await deleteAccount(
      data.user.id,
      createAccountDeletionRepository(supabase),
    );
    await supabase.auth.signOut();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "account_permanent_delete" },
    });
    return NextResponse.json(
      {
        message:
          "We could not delete your account. Your account remains active; try again.",
      },
      { status: 500 },
    );
  }
}
