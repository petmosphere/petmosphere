import * as Sentry from "@sentry/nextjs";
import { updateSubscriptionSchema } from "@petmosphere/api-contracts";
import { NextResponse } from "next/server";

import { updateSubscription } from "@/lib/profile/supabase-profile";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json(
      { message: "Sign in to update your subscription." },
      { status: 401 },
    );
  }

  try {
    const parsed = updateSubscriptionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Check your subscription request." },
        { status: 400 },
      );
    }
    const updated = await updateSubscription(
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
      tags: { operation: "profile_subscription_update" },
    });
    return NextResponse.json(
      { message: "We could not update your subscription. Try again." },
      { status: 500 },
    );
  }
}
