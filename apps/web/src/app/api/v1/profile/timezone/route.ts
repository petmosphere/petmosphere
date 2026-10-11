import * as Sentry from "@sentry/nextjs";
import { updateTimezoneSchema } from "@petmosphere/api-contracts";
import { NextResponse } from "next/server";

import { updateProfileTimezone } from "@/lib/profile/supabase-profile";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json(
      { message: "Sign in to update your time zone." },
      { status: 401 },
    );
  }

  try {
    const parsed = updateTimezoneSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Choose a valid time zone." },
        { status: 400 },
      );
    }
    const updated = await updateProfileTimezone(
      supabase,
      data.user.id,
      parsed.data.timezone,
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
      tags: { operation: "profile_timezone_update" },
    });
    return NextResponse.json(
      { message: "We could not update your time zone. Try again." },
      { status: 500 },
    );
  }
}
