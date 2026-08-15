import * as Sentry from "@sentry/nextjs";
import {
  webPushSubscriptionResponseSchema,
  webPushSubscriptionSchema,
} from "@petmosphere/api-contracts";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json(
      { message: "Sign in to enable reminders." },
      { status: 401 },
    );
  }

  try {
    const parsed = webPushSubscriptionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "The browser notification subscription is invalid." },
        { status: 400 },
      );
    }

    const { error } = await supabase.rpc("save_web_push_subscription", {
      p_auth: parsed.data.auth,
      p_endpoint: parsed.data.endpoint,
      p_p256dh: parsed.data.p256dh,
    });
    if (error) throw error;

    return NextResponse.json(
      webPushSubscriptionResponseSchema.parse({ subscribed: true }),
    );
  } catch {
    Sentry.captureMessage("Web Push subscription save failed unexpectedly.", {
      level: "error",
      tags: { operation: "web_push_subscription_save" },
    });
    return NextResponse.json(
      { message: "We could not enable notifications. Try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json(
      { message: "Sign in to disable notifications." },
      { status: 401 },
    );
  }

  try {
    const parsed = webPushSubscriptionSchema
      .pick({ endpoint: true })
      .safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { message: "The browser notification subscription is invalid." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("web_push_subscriptions")
      .delete()
      .eq("owner_id", data.user.id)
      .eq("endpoint", parsed.data.endpoint);
    if (error) throw error;

    return NextResponse.json(
      webPushSubscriptionResponseSchema.parse({ subscribed: false }),
    );
  } catch {
    Sentry.captureMessage(
      "Web Push subscription removal failed unexpectedly.",
      {
        level: "error",
        tags: { operation: "web_push_subscription_remove" },
      },
    );
    return NextResponse.json(
      { message: "We could not disable notifications on this device." },
      { status: 500 },
    );
  }
}
