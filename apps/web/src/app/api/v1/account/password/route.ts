import * as Sentry from "@sentry/nextjs";
import { changePasswordSchema } from "@petmosphere/api-contracts";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user?.email) {
    return NextResponse.json(
      { message: "Sign in to change your password." },
      { status: 401 },
    );
  }

  try {
    const parsed = changePasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Check your password details.",
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
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) throw error;
    return NextResponse.json({ updated: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "account_password_change" },
    });
    return NextResponse.json(
      { message: "We could not change your password. Try again." },
      { status: 500 },
    );
  }
}
