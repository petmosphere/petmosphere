import * as Sentry from "@sentry/nextjs";
import {
  markNotificationsReadSchema,
  notificationsResponseSchema,
} from "@petmosphere/api-contracts";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  createNotificationRepository,
  toNotificationResponse,
} from "@/lib/notifications/supabase-notifications";
import { createClient } from "@/lib/supabase/server";

async function authenticate() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

export async function GET() {
  const { supabase, user } = await authenticate();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to view notifications." },
      { status: 401 },
    );
  try {
    const result = await listNotifications(
      user.id,
      createNotificationRepository(supabase),
    );
    return NextResponse.json(
      notificationsResponseSchema.parse({
        notifications: result.notifications.map(toNotificationResponse),
        unreadCount: result.unreadCount,
      }),
    );
  } catch {
    Sentry.captureMessage("Notification list failed unexpectedly.", {
      level: "error",
      tags: { operation: "notification_list" },
    });
    return NextResponse.json(
      { message: "We could not load notifications. Try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const { supabase, user } = await authenticate();
  if (!user)
    return NextResponse.json(
      { message: "Sign in to update notifications." },
      { status: 401 },
    );
  const parsed = markNotificationsReadSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { message: "Choose valid notifications." },
      { status: 400 },
    );
  try {
    const repository = createNotificationRepository(supabase);
    if ("all" in parsed.data)
      await markAllNotificationsRead(user.id, repository);
    else
      await markNotificationRead(
        user.id,
        parsed.data.notificationId,
        repository,
      );
    return NextResponse.json({ ok: true });
  } catch {
    Sentry.captureMessage("Notification update failed unexpectedly.", {
      level: "error",
      tags: { operation: "notification_update" },
    });
    return NextResponse.json(
      { message: "We could not update notifications. Try again." },
      { status: 500 },
    );
  }
}
