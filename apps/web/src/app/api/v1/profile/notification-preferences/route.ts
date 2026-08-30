import * as Sentry from "@sentry/nextjs";
import { updateReminderNotificationPreferencesSchema } from "@petmosphere/api-contracts";
import { NextResponse } from "next/server";

import { updateReminderNotificationPreferences } from "@/lib/profile/supabase-profile";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json(
      { message: "Sign in to update notification settings." },
      { status: 401 },
    );
  }

  try {
    const parsed = updateReminderNotificationPreferencesSchema.safeParse(
      await request.json(),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Choose valid notification settings." },
        { status: 400 },
      );
    }
    const updated = await updateReminderNotificationPreferences(
      supabase,
      data.user.id,
      parsed.data,
    );
    if (!updated) {
      return NextResponse.json(
        { message: "Profile not found." },
        { status: 404 },
      );
    }
    return NextResponse.json(parsed.data);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "notification_preferences_update" },
    });
    return NextResponse.json(
      { message: "We could not update notification settings. Try again." },
      { status: 500 },
    );
  }
}
